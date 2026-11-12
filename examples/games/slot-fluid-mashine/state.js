import {getWindow, evaluateSpin, localSpin, normalizeSpinResult} from "./math.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

export class SlotGame {
  constructor(slot, reelViews, opts = {}) {
    if(reelViews.length !== slot.reelCount) throw new Error('reelViews count != reelCount');
    this.slot = slot;
    this.views = reelViews;
    this.lineBet = opts.lineBet ?? 1;
    // chatgpt SUGGESTION START
    // Local demo credits only: no real-money balance or payment integration.
    this.demoBalance = opts.demoBalance ?? 1000;
    this.betAmount = opts.betAmount ?? 1;
    this.onDemoBalance = opts.onDemoBalance ?? (() => {});
    this.onDemoBalance(this.demoBalance);
    // chatgpt SUGGESTION END
    this.minSpinMs = opts.minSpinMs ?? 800;
    this.startStagger = opts.startStagger ?? 380; // ms between reel starts
    this.stagger = opts.stagger ?? 300;           // ms between reel stops
    this.topIsPrev = opts.topIsPrev ?? true;
    this.onPresentWin = opts.onPresentWin;        // async (evaluation) => {}, awaited
    this.freeSpinsLeft = 0;
    this.state = 'IDLE';                          // IDLE | SPINNING | STOPPING | EVALUATING | PRESENTING
    this.queue = [];
    this.listeners = {};
  }

  on(evt, fn) {(this.listeners[evt] ??= []).push(fn); return this;}
  emit(evt, data) {(this.listeners[evt] || []).forEach(fn => fn(data));}
  setState(s) {this.state = s; this.emit('state', s);}

  spin() {
    // chatgpt SUGGESTION START
    // The default keyboard spin is local and uses fictive demo credits.
    return this.playResult({
      stops: localSpin(this.slot),
      isLocalDemo: true
    });
    // chatgpt SUGGESTION END
  }

  async playResult(raw) {
    if(this.state !== 'IDLE') {this.queue.push(raw); return;}
    // chatgpt SUGGESTION START
    let demoBetCharged = false;
    let demoWinningsCredited = false;
    if(raw?.isLocalDemo) {
      if(this.demoBalance < this.betAmount) {
        this.emit('insufficientBalance', {
          balance: this.demoBalance,
          betAmount: this.betAmount
        });
        return;
      }
      this.demoBalance -= this.betAmount;
      demoBetCharged = true;
      this.onDemoBalance(this.demoBalance);
      this.emit('balance', this.demoBalance);
    }
    // chatgpt SUGGESTION END
    try {
      console.groupCollapsed('[slot-debug] incoming spin');
      console.log('RAW SERVER RESULT:', raw);
      console.log('CONFIG:', {
        reelCount: this.slot.reelCount,
        visibleRows: this.slot.visibleRows,
        topIsPrev: this.topIsPrev,
        stripLengths: this.slot.reels.map(reel => reel.length)
      });
      console.groupEnd();

      const {stops} = normalizeSpinResult(raw, this.slot);
      const inFree = typeof raw?.inFree === 'boolean'
        ? raw.inFree
        : this.freeSpinsLeft > 0;
      if(inFree) this.freeSpinsLeft--;

      this.setState('SPINNING');
      this.emit('spinStart', {inFree, freeSpinsLeft: this.freeSpinsLeft});
      // Give each reel its own mechanical kick and acceleration, slightly staggered.
      const starts = [];
      for(let i = 0; i < this.views.length; i++) {
        starts.push(this.views[i].startSpin());
        if(i < this.views.length - 1) await sleep(this.startStagger);
      }
      await Promise.all(starts);
      await sleep(this.minSpinMs);

      this.setState('STOPPING');
      await Promise.all(this.views.map(async (v, i) => {
        await sleep(i * this.stagger);
        await v.stopAt(stops[i]);
        this.emit('reelStop', {reel: i, stop: stops[i]});
      }));

      this.setState('EVALUATING');
      // Server spin results are authoritative when they include an evaluation.
      // Keep local evaluation for keyboard/local test spins.
      const grid = Array.isArray(raw?.grid)
        ? raw.grid
        : getWindow(this.slot, stops, {topIsPrev: this.topIsPrev});
      const ev = Array.isArray(raw?.lineWins)
        ? {
            lineWins: raw.lineWins,
            scatterCells: Array.isArray(raw.scatterCells) ? raw.scatterCells : [],
            freeSpinsAwarded: Number(raw.freeSpinsAwarded) || 0,
            payUnits: Number(raw.payUnits) || 0,
            totalWin: Number(raw.totalWin) || 0,
            multiplier: Number(raw.multiplier) || 1
          }
        : evaluateSpin(this.slot, grid, {lineBet: this.lineBet, inFreeSpins: inFree});

      if(typeof raw?.freeSpinsLeft === 'number') {
        this.freeSpinsLeft = raw.freeSpinsLeft;
      } else {
        this.freeSpinsLeft += ev.freeSpinsAwarded;
      }
      // chatgpt SUGGESTION START
      // Credit local demo winnings using the evaluator's totalWin in units.
      if(demoBetCharged) {
        this.demoBalance += ev.totalWin;
        demoWinningsCredited = true;
        this.onDemoBalance(this.demoBalance);
        this.emit('balance', this.demoBalance);
      }
      // chatgpt SUGGESTION END
      const result = {...ev, grid, stops, inFree, freeSpinsLeft: this.freeSpinsLeft};
      this.emit('result', result);

      if(ev.lineWins.length || ev.freeSpinsAwarded) {
        this.setState('PRESENTING');
        const winningByReel = this.views.map(() => new Set());
        const addWinningCell = (cell, source) => {
          const {reel, row} = cell;
          const view = this.views[reel];
          if(!view || !Number.isInteger(row) || row < 0 || row >= this.slot.visibleRows) {
            console.warn('[slot] Ignoring invalid winning cell', {source, cell});
            return;
          }

          const stripIndex = Number.isInteger(cell.stripIndex)
            ? cell.stripIndex
            : view.stripIndexForRow(stops[reel], row, this.topIsPrev);
          const actualSymbol = this.slot.reels[reel].strip[stripIndex];
          const expectedSymbol = cell.id ?? grid[reel]?.[row];

          // Never animate a physical symbol unless it matches the winning cell.
          if(!Number.isInteger(stripIndex) || stripIndex < 0 ||
             stripIndex >= this.slot.reels[reel].strip.length ||
             actualSymbol !== expectedSymbol) {
            console.error('[slot] WINNING SYMBOL MISMATCH', {
              source, reel, row, stripIndex,
              expectedSymbol, actualSymbol, stop: stops[reel]
            });
            return;
          }

          winningByReel[reel].add(stripIndex);
        };

        for(const win of ev.lineWins) {
          for(const cell of (win.cells ?? [])) addWinningCell(cell, win.lineId);
        }
        if(ev.freeSpinsAwarded) {
          for(const cell of ev.scatterCells) addWinningCell(cell, 'scatter');
        }
        const animations = winningByReel.flatMap((indices, reelIndex) =>
          [...indices].map(index => this.views[reelIndex].playWinAt(index))
        );
        const presentation = this.onPresentWin ? this.onPresentWin(result) : Promise.resolve();
        await Promise.all([...animations, presentation]);
      }
    } catch(err) {
      // chatgpt SUGGESTION START
      // Refund the demo stake if the spin failed before a result was credited.
      if(demoBetCharged && !demoWinningsCredited) {
        this.demoBalance += this.betAmount;
        this.onDemoBalance(this.demoBalance);
        this.emit('balance', this.demoBalance);
      }
      // chatgpt SUGGESTION END
      console.error('[slot] spin failed', err);
      this.emit('error', err);
    } finally {
      this.setState('IDLE');
    }
    if(this.queue.length) return this.playResult(this.queue.shift());
  }
}