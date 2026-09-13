import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { geminiEndpoint } from './gemini.server';

const HEADER = 'X-Lovable-AIG-Run-ID';
export function createCommandGateway(_key: string, initial?: string) {
  let runId = initial;
  let resolve: (value?: string) => void = () => {};
  const ready = new Promise<string | undefined>(r => { resolve = r; });
  // Retain the managed gateway only when no personal Google key is configured.
  const lovable = process.env['LOVABLE_API_KEY'];
  const endpoint = lovable
    ? { direct: false, baseURL: 'https://ai.gateway.lovable.dev/v1', headers: { 'Lovable-API-Key': lovable, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' }, model: (id: string) => id }
    : geminiEndpoint();
  if (!endpoint) throw new Error('AI is not configured.');
  const provider = createOpenAICompatible({
    name: 'lovable', baseURL: endpoint.baseURL,
    headers: endpoint.headers,
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(HEADER, runId);
      try {
        const response = await fetch(input, { ...init, headers, signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(90000)]) });
        runId = response.headers.get(HEADER) ?? runId;
        resolve(runId);
        return response;
      } catch (error) { resolve(undefined); throw error; }
    },
  });
  return { provider, model: endpoint.model, direct: endpoint.direct, async wrap(response: Response) {
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
