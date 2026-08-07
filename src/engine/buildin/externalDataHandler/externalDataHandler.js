export class ExternalDataHandler {
  constructor() {
    this.adapters = {};
    this.series = {};
    this.listeners = [];
  }

  registerAdapter(name, adapter) {
    this.adapters[name] = adapter;
    adapter.onUpdate = (grid) => {
      this.series[name] = grid;
      this._emit(name, grid);
    };
  }

  start(name, intervalMs) {this.adapters[name].start(intervalMs)}
  stop(name) {this.adapters[name].stop()}
  onUpdate(cb) {this.listeners.push(cb)}
  _emit(name, grid) {for(const cb of this.listeners) cb(name, grid)}
}