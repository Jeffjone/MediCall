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

/**
 * Google AI Studio serves a different model catalogue than the Lovable gateway,
 * so gateway-only ids are mapped onto their closest AI Studio equivalent.
 * An unmapped id would fail with a 404 "model not found".
 */
const GOOGLE_MODEL_MAP: Record<string, string> = {
  'gemini-3.8-flash': 'gemini-3.6-flash',
  'gemini-3-flash': 'gemini-3.6-flash',
  'gemini-3.5-flash': 'gemini-3.6-flash',
  'gemini-3.8-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3-pro': 'gemini-3.6-flash',
  // Google's free tier serves no quota for the Pro preview; use the supported Flash model.
  'gemini-3.1-pro-preview': 'gemini-3.6-flash',
  'gemini-2.5-flash': 'gemini-3.6-flash',
};

export function geminiEndpoint(): GeminiEndpoint | null {
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (lovableKey) {
    return {
      direct: false,
      baseURL: 'https://ai.gateway.lovable.dev/v1',
      headers: { 'Lovable-API-Key': lovableKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
      model: id => id,
    };
  }
  const google = process.env['GOOGLE_AI_API_KEY'];
  if (google) {
    return {
      direct: true,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      headers: { Authorization: `Bearer ${google}` },
      model: id => {
        const bare = id.replace(/^google\//, '');
        return GOOGLE_MODEL_MAP[bare] ?? bare;
      },
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
