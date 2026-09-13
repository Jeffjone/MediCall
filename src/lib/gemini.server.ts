/**
 * Resolves where Gemini calls go. When the pharmacy supplies its own Google AI Studio
 * key (GOOGLE_AI_API_KEY) we call Google directly through its OpenAI-compatible
 * endpoint; otherwise we fall back to the Lovable AI gateway.
 */
export type GeminiEndpoint = {
  direct: boolean;
  baseURL: string;
  headers: Record<string, string>;
  /** Maps a gateway model id such as `google/gemini-3.8-flash` to the right id for the endpoint. */
  model: (id: string) => string;
};

export function geminiEndpoint(): GeminiEndpoint | null {
  const google = process.env['GOOGLE_AI_API_KEY'];
  if (google) {
    return {
      direct: true,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      headers: { Authorization: `Bearer ${google}` },
      model: id => id.replace(/^google\//, ''),
    };
  }
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) return null;
  return {
    direct: false,
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    headers: { 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    model: id => id,
  };
}
