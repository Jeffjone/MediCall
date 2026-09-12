const cache = new Map<string, { rxcui: string | null; name: string | null; status: string }>();
export async function resolveDrug(ndc: string) {
  const cached = cache.get(ndc); if (cached) return cached;
  try {
    const response = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui.json?idtype=NDC&id=${encodeURIComponent(ndc)}`);
    if (!response.ok) throw new Error(`RxNorm returned ${response.status}`);
    const data = await response.json() as { idGroup?: { rxnormId?: string[] } };
    const rxcui = data.idGroup?.rxnormId?.[0] ?? null;
    let name: string | null = null;
    if (rxcui) {
      const properties = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/properties.json`);
      if (properties.ok) name = ((await properties.json()) as { properties?: { name?: string } }).properties?.name ?? null;
    }
    const result = { rxcui, name, status: rxcui ? 'RxNorm identity verified; recall scope remains NDC-specific' : 'No RxNorm identifier found; exact NDC evidence retained' };
    if (cache.size > 500) cache.clear(); cache.set(ndc, result); return result;
  } catch { return { rxcui: null, name: null, status: 'RxNorm unavailable; exact NDC evidence retained' }; }
}
