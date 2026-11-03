// src/slot/slot-game.js
import {getWindow, evaluateSpin, localSpin, normalizeSpinResult} from "./math.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

// reelViews[i] must implement:
//   startSpin(): void
//   stopAt(stopIndex): Promise<void>   (resolves when the reel has landed)
export class SlotGame {
  constructor(slot, reelViews, opts = {}) {
    if(reelViews.length !== slot.reelCount) throw new Error('reelViews count != reelCount');
    this.slot = slot;
    this.views = reelViews;
    this.lineBet = opts.lineBet ?? 1;
    this.minSpinMs = opts.minSpinMs ?? 800;
    this.stagger = opts.stagger ?? 300;       // ms between reel stops
    this.topIsPrev = opts.topIsPrev ?? true;
    this.onPresentWin = opts.onPresentWin;    // async (evaluation) => {}, awaited
    this.freeSpinsLeft = 0;
    this.state = 'IDLE';                      // IDLE | SPINNING | STOPPING | EVALUATING | PRESENTING
    this.queue = [];
    this.listeners = {};
  }

  on(evt, fn) {(this.listeners[evt] ??= []).push(fn); return this;}
  emit(evt, data) {(this.listeners[evt] || []).forEach(fn => fn(data));}
  setState(s) {this.state = s; this.emit('state', s);}

  spin() { // local test spin, same path as the server result
    return this.playResult({stops: localSpin(this.slot)});
  }

  async playResult(raw) {
    if(this.state !== 'IDLE') {this.queue.push(raw); return;}
    try {
      const {stops} = normalizeSpinResult(raw, this.slot);
      const inFree = this.freeSpinsLeft > 0;
      if(inFree) this.freeSpinsLeft--;

      this.setState('SPINNING');
      this.emit('spinStart', {inFree, freeSpinsLeft: this.freeSpinsLeft});
      this.views.forEach(v => v.startSpin());
      await sleep(this.minSpinMs);

      this.setState('STOPPING');
      await Promise.all(this.views.map(async (v, i) => {
        await sleep(i * this.stagger);
        await v.stopAt(stops[i]);
        this.emit('reelStop', {reel: i, stop: stops[i]});
      }));

      this.setState('EVALUATING');
      const grid = getWindow(this.slot, stops, {topIsPrev: this.topIsPrev});
      const ev = evaluateSpin(this.slot, grid, {lineBet: this.lineBet, inFreeSpins: inFree});
      this.freeSpinsLeft += ev.freeSpinsAwarded;
      const result = {...ev, grid, stops, inFree, freeSpinsLeft: this.freeSpinsLeft};
      this.emit('result', result);

      if(ev.lineWins.length || ev.freeSpinsAwarded) {
        this.setState('PRESENTING');
        const winningByReel = this.views.map(() => new Set());
        for(const win of ev.lineWins) {
          for(const cell of win.cells) {
            winningByReel[cell.reel].add(this.views[cell.reel].stripIndexForRow(
              stops[cell.reel], cell.row, this.topIsPrev
            ));
          }
        }
        if(ev.freeSpinsAwarded) {
          for(const cell of ev.scatterCells) {
            winningByReel[cell.reel].add(this.views[cell.reel].stripIndexForRow(
              stops[cell.reel], cell.row, this.topIsPrev
            ));
          }
        }
        const animations = winningByReel.flatMap((indices, reelIndex) =>
          [...indices].map(index => this.views[reelIndex].playWinAt(index))
        );
        const presentation = this.onPresentWin ? this.onPresentWin(result) : Promise.resolve();
        await Promise.all([...animations, presentation]);
      }
    } catch(err) {
      console.error('[slot] spin failed', err);
      this.emit('error', err);
    } finally {
      this.setState('IDLE');
    }
    if(this.queue.length) return this.playResult(this.queue.shift());
  }
}