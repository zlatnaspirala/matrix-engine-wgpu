export class ExternalDataHandler {
  constructor() {
    this.adapters = {};
    this.series = {};
    this.listeners = [];
  }

  registerAdapter(name, adapter) {
    this.adapters[name] = adapter;
    adapter.onUpdate = (data) => {
      this.series[name] = data;
      this._emit(name, data);
    };
  }

  start(name, intervalMs) {this.adapters[name].start(intervalMs)}
  stop(name) {this.adapters[name].stop()}
  onUpdate(cb) {this.listeners.push(cb)}
  _emit(name, data) {for(const cb of this.listeners) cb(name, data)}
}