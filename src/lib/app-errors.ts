/** Safe messages shared by page recovery and service callers. Never display raw HTML or provider payloads. */
export function errorStatus(error: unknown, seen = new Set<unknown>()): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if (seen.has(error)) return undefined;
  seen.add(error);
  for (const key of ['statusCode', 'status']) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === 'number' && value >= 400 && value <= 599) return value;
  }
  if ('cause' in error && error.cause !== error) return errorStatus(error.cause, seen);
  return undefined;
}

export function errorMessage(error: unknown): string {
  const status = errorStatus(error);
  const messages: Record<number, string> = {
    400: 'The request could not be processed. Check your input before trying again.',
    401: 'Your session has expired. Please sign in again.',
    402: 'AI credits are unavailable. The workspace owner can add credits in Lovable.',
    403: 'This action is not permitted. Contact your workspace administrator.',
    404: 'The requested record could not be found. Refresh the list and select it again.',
    408: 'The request timed out. Check its status before trying again.',
    413: 'This upload is too large. Choose a smaller file.',
    429: 'Too many requests. Please wait before trying again.',
    500: 'The service encountered an error. Please try again later.',
    502: 'A connected service returned an invalid response. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'A connected service took too long to respond. Check its status before trying again.',
  };
  if (status && messages[status]) return messages[status];
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return messages[504]!;
    if (error.name === 'AbortError') return 'The request was cancelled.';
    if (/chunk|dynamically imported module/i.test(error.message)) return 'A new version of MediCall is available. Reload the page to continue.';
    if (/failed to fetch|fetch failed|networkerror|network request|load failed/i.test(error.message)) return 'Connection lost. Check your internet connection and try again.';
    if (error.message && !/<(?:html|body|script|!doctype)|stack trace|api[_-]?key|bearer |postgres|supabase|select .* from|https?:\/\//i.test(error.message)) return error.message.slice(0, 600);
  }
  return 'Something went wrong. Please try again later.';
}

/** Reads only: never automatically repeat writes, calls, or AI work. */
export function retryRead(failureCount: number, error: unknown): boolean {
  const status = errorStatus(error);
  return failureCount < 2 && status !== undefined && status >= 500;
}
