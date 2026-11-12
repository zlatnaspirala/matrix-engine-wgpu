import {SLOT_SIMULATOR_CONFIG_TOKEN} from "./slot";

export async function fetchSlotConfig(baseUrl, machineId) {
  const token = SLOT_SIMULATOR_CONFIG_TOKEN;
  const headers = token ? {"X-Local-Config-Token": token} : {};
  const res = await fetch(`${baseUrl}/slot-api/machines/${machineId}/slot-config`,
    {credentials: "include", headers});
  if(!res.ok) throw new Error(`slot-config HTTP ${res.status}`);
  return res.json();
}

export function adaptSlotConfig(raw) {
  const warnings = [];
  const errors = [];

  if(!Array.isArray(raw?.reels) || !raw.reels.length) errors.push('No reels in config');
  if(!Array.isArray(raw?.symbols) || !raw.symbols.length) errors.push('No symbols in config');
  if(errors.length) throw new Error('Invalid slot config: ' + errors.join('; '));

  const symbols = new Map(raw.symbols.map(s => [s.id, s]));
  const reelCount = raw.reels.length;

  // Each strip entry is a symbol ID backed by its own 4x4 (16-frame) texture.
  const reels = raw.reels.map(r => {
    if(!Array.isArray(r.strip) || !r.strip.length) {
      errors.push(`Reel ${r.id}: empty or missing strip`);
      return {id: r.id, strip: [], length: 0};
    }
    for(const id of r.strip) {
      if(!symbols.has(id)) warnings.push(`Reel ${r.id}: unknown symbol "${id}" is not in the symbol registry`);
    }
    return {id: r.id, strip: [...r.strip], length: r.strip.length};
  });
  if(errors.length) throw new Error('Invalid slot config: ' + errors.join('; '));

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

  const maxPaylineRow = paylines.length ? Math.max(...paylines.flatMap(l => l.rows)) : 2;
  const visibleRows = Math.max(1, Number(raw.visibleRows) || maxPaylineRow + 1);

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
    paytable,
    paylines,
    freeSpins: raw.freeSpins ?? {enabled: false},
    targetRtp: raw.targetRtp,
    warnings,
  };
}