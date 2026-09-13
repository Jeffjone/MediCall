import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, Output, NoObjectGeneratedError } from 'ai';
import { z } from 'zod';
import { createHash } from 'node:crypto';

export const briefingSchema = z.object({
  headline: z.string(),
  body: z.string(),
  priorities: z.array(z.string()),
});
export type Briefing = z.infer<typeof briefingSchema> & { generatedAt: string };

export function cacheKey(kind: string, payload: unknown) {
  return `${kind}:${createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32)}`;
}

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin;
}

export async function readCached(key: string): Promise<Briefing | null> {
  try {
    const db = await admin();
    const { data } = await db.from('ai_briefings').select('content,created_at').eq('cache_key', key).maybeSingle();
    if (!data) return null;
    const parsed = briefingSchema.safeParse(data.content);
    return parsed.success ? { ...parsed.data, generatedAt: data.created_at } : null;
  } catch {
    return null;
  }
}

async function writeCached(key: string, kind: string, value: z.infer<typeof briefingSchema>) {
  try {
    const db = await admin();
    await db.from('ai_briefings').upsert({ cache_key: key, kind, content: value, created_at: new Date().toISOString() });
  } catch {
    /* cache is best-effort */
  }
}

/** Generates a short structured brief with Gemini. Returns null when AI is unavailable. */
export async function generateBrief(kind: string, key: string, prompt: string): Promise<Briefing | null> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return null;
  let runId: string | undefined;
  const provider = createOpenAICompatible({
    name: 'lovable',
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set('X-Lovable-AIG-Run-ID', runId);
      const res = await fetch(input, { ...init, headers });
      runId = res.headers.get('X-Lovable-AIG-Run-ID') ?? runId;
      return res;
    },
  });
  try {
    const result = streamText({
      model: provider('google/gemini-3.8-flash'),
      maxRetries: 0,
      output: Output.object({ schema: briefingSchema }),
      prompt,
    });
    let value: z.infer<typeof briefingSchema>;
    try {
      value = await result.output;
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) throw error;
      value = briefingSchema.parse(JSON.parse(error.text ?? ''));
    }
    const clean: z.infer<typeof briefingSchema> = {
      headline: value.headline.slice(0, 120),
      body: value.body.slice(0, 900),
      priorities: value.priorities.slice(0, 3).map(p => p.slice(0, 200)),
    };
    await writeCached(key, kind, clean);
    return { ...clean, generatedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}
