import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const HEADER = 'X-Lovable-AIG-Run-ID';
export function createCommandGateway(key: string, initial?: string) {
  let runId = initial;
  let resolve: (value?: string) => void = () => {};
  const ready = new Promise<string | undefined>(r => { resolve = r; });
  const provider = createOpenAICompatible({
    name: 'lovable', baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: { 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(HEADER, runId);
      try {
        const response = await fetch(input, { ...init, headers });
        runId = response.headers.get(HEADER) ?? runId;
        resolve(runId);
        return response;
      } catch (error) { resolve(undefined); throw error; }
    },
  });
  return { provider, async wrap(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) return response;
    const first = reader.read();
    const id = await ready;
    const headers = new Headers(response.headers);
    if (id) { headers.set(HEADER, id); headers.set('Access-Control-Expose-Headers', HEADER); }
    return new Response(new ReadableStream({
      async start(controller) {
        try {
          let chunk = await first;
          while (!chunk.done) { controller.enqueue(chunk.value); chunk = await reader.read(); }
          controller.close();
        } catch (error) { controller.error(error); }
      }, cancel: reason => reader.cancel(reason),
    }), { headers, status: response.status });
  } };
}
