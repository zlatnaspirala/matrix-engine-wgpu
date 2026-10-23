// src/slot/slot-math.js

// Convention: stopIndex = strip position shown on the CENTER row.
// topIsPrev = true  -> top row shows strip[stop-1], bottom row shows strip[stop+1].
// If the ring visually runs the other way, flip this flag (we'll verify with the sprites).
export function getWindow(slot, stops, {topIsPrev = true} = {}) {
  const center = Math.floor(slot.visibleRows / 2);
  return slot.reels.map((reel, i) => {
    const N = reel.length;
    return Array.from({length: slot.visibleRows}, (_, row) => {
      const off = (row - center) * (topIsPrev ? 1 : -1);
      const idx = (((stops[i] + off) % N) + N) % N;
      return reel.strip[idx];
    });
  }); // grid[reel][row] -> symbol id
}

export function localSpin(slot, rng = Math.random) {
  return slot.reels.map(r => Math.floor(rng() * r.length));
}

export function evaluateSpin(slot, grid, {lineBet = 1, inFreeSpins = false} = {}) {
  const {wild, scatter} = slot.symbolRoles;
  const isWild = id => wild.includes(id);
  const isScatter = id => scatter.includes(id);
  const lineWins = [];

  for(const line of slot.paylines) {
    const cells = line.rows.map((row, reel) => ({reel, row, id: grid[reel][row]}));

    // paying symbol = first non-wild symbol; a scatter breaks the line
    let paySym = null;
    for(const c of cells) {
      if(isScatter(c.id)) break;
      if(!isWild(c.id)) {paySym = c.id; break;}
    }
    // count the run from the left
    let run = 0;
    for(const c of cells) {
      if(isScatter(c.id)) break;
      if(paySym === null || isWild(c.id) || c.id === paySym) run++; else break;
    }

    const sym = paySym ?? wild[0]; // an all-wild line pays as wild
    const table = sym && slot.paytable[sym];
    if(!table) continue;

    const count = Object.keys(table).map(Number).filter(n => n <= run).sort((a, b) => b - a)[0];
    if(!count) continue;
    const pay = table[count];
    if(pay > 0) lineWins.push({lineId: line.id, symbol: sym, count, pay, cells: cells.slice(0, count)});
  }

  const fs = slot.freeSpins;
  const scatterCells = [];
  grid.forEach((col, reel) => col.forEach((id, row) => {
    if(fs?.enabled && id === fs.triggerSymbol) scatterCells.push({reel, row});
  }));
  const freeSpinsAwarded =
    fs?.enabled && scatterCells.length >= fs.triggerCount && (!inFreeSpins || fs.retrigger)
      ? fs.spinsAwarded : 0;

  const multiplier = inFreeSpins ? (fs?.multiplier ?? 1) : 1;
  const payUnits = lineWins.reduce((s, w) => s + w.pay, 0);

  return {
    lineWins, scatterCells, freeSpinsAwarded,
    payUnits,                                  // sum of paytable values
    totalWin: payUnits * lineBet * multiplier, // currency
    multiplier,
  };
}

// Server -> internal format. The payload shape is a GUESS, so paste a real SPIN RESULT and I'll fix this.
export function normalizeSpinResult(raw, slot) {
  const stops = raw?.stops ?? raw?.reelStops ?? raw?.positions;
  if(!Array.isArray(stops) || stops.length !== slot.reelCount) {
    throw new Error('Unknown spin result shape: ' + JSON.stringify(raw));
  }
  return {stops, serverWin: raw.totalWin ?? raw.win ?? null};
}