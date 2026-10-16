
// symbol id -> spritesheet frame. Placeholder until you describe the sprite fields tomorrow.
export const DEFAULT_FRAME_MAP = {A: 0, K: 1, Q: 2, J: 3, "10": 4, W: 5, S: 6};
const UNKNOWN_FRAME = 15;

export async function fetchSlotConfig(baseUrl, machineId) {
  const res = await fetch(`${baseUrl}/slot-api/machines/${machineId}/slot-config`,
    {
      credentials: "include",
      headers: {
        "X-Local-Config-Token": "SHITHAPPENS"
      }
    });
  if(!res.ok) throw new Error(`slot-config HTTP ${res.status}`);
  return res.json();
}

export function adaptSlotConfig(raw, opts = {}) {
  const frameMap = {...DEFAULT_FRAME_MAP, ...(opts.frameMap || {})};
  const warnings = [];
  const errors = [];

  if(!Array.isArray(raw?.reels) || !raw.reels.length) errors.push('No reels in config');
  if(!Array.isArray(raw?.symbols) || !raw.symbols.length) errors.push('No symbols in config');
  if(errors.length) throw new Error('Invalid slot config: ' + errors.join('; '));

  const symbols = new Map(raw.symbols.map(s => [s.id, s]));
  const reelCount = raw.reels.length;

  // Reels: strip ids -> frame indices
  const reels = raw.reels.map(r => {
    const frames = r.strip.map(id => {
      if(!symbols.has(id)) {
        warnings.push(`Reel ${r.id}: unknown symbol "${id}", using placeholder frame`);
        return UNKNOWN_FRAME;
      }
      if(!(id in frameMap)) {
        warnings.push(`No frame mapped for symbol "${id}", using placeholder frame`);
        return UNKNOWN_FRAME;
      }
      return frameMap[id];
    });
    return {id: r.id, strip: [...r.strip], frames, length: r.strip.length};
  });

  // Paylines: drop disabled ones, check the row count against the reel count
  const paylines = raw.paylines
    .filter(l => l.enabled !== false)
    .filter(l => {
      if(l.rows.length !== reelCount) {
        warnings.push(`Payline ${l.id}: ${l.rows.length} rows vs ${reelCount} reels, skipped`);
        return false;
      }
      return true;
    })
    .map(l => ({id: l.id, rows: [...l.rows]}));

  const visibleRows = Math.max(...paylines.flatMap(l => l.rows)) + 1;

  // Paytable: normalize keys to numbers
  const paytable = {};
  for(const [sym, pays] of Object.entries(raw.paytable || {})) {
    paytable[sym] = Object.fromEntries(Object.entries(pays).map(([k, v]) => [Number(k), v]));
    if(!symbols.has(sym)) warnings.push(`Paytable symbol "${sym}" not in symbols`);
  }

  // Role lookups for later win presentation
  const byType = t => raw.symbols.filter(s => s.type === t).map(s => s.id);

  return {
    machineId: raw.machineId,
    name: raw.name,
    reelCount,
    visibleRows,
    reels,
    symbols,
    symbolRoles: {wild: byType('wild'), scatter: byType('scatter')},
    frameMap,
    paytable,
    paylines,
    freeSpins: raw.freeSpins ?? {enabled: false},
    targetRtp: raw.targetRtp,
    warnings,
  };
}