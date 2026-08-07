export class SeismicPortalAdapter {
  constructor(historyLen = 64) {
    this.historyLen = historyLen;
    this.mags = new Float32Array(historyLen);   // Y = magnitude
    this.depths = new Float32Array(historyLen);  // could drive a second row later
    this.onUpdate = null;
    this.ws = null;
  }

  start() {
    this.ws = new WebSocket("wss://www.seismicportal.eu/standing_order/websocket");

    this.ws.onopen = () => {
      console.info("[seismic] connected");
      this._heartbeat = setInterval(() => {
        if(this.ws.readyState === WebSocket.OPEN) this.ws.send("ping");
      }, 15000);
    };

    this.ws.onmessage = (msg) => {
      try {
        console.log("[seismic raw]", msg.data);
        const data = JSON.parse(msg.data);
        const props = data.data?.properties;
        if(!props) return;
        this.mags.copyWithin(0, 1);
        this.mags[this.historyLen - 1] = props.mag ?? 0;
        this.depths.copyWithin(0, 1);
        this.depths[this.historyLen - 1] = props.depth ?? 0;
        if(this.onUpdate) this.onUpdate(this._buildGrid());
      } catch(e) {
        console.warn("SeismicPortalAdapter parse failed:", e);
      }
    };
    this.ws.onerror = (e) => console.warn("SeismicPortalAdapter ws error:", e);
    this.ws.onclose = () => console.info("SeismicPortalAdapter ws closed");
  }

  stop() {this.ws?.close();}

  _buildGrid() {
    // fits your existing "coins" grid shape — here just one "series": earthquakes
    let min = Infinity, max = -Infinity;
    for(const v of this.mags) {min = Math.min(min, v); max = Math.max(max, v);}
    return {
      coinCount: 1,
      timeSteps: this.historyLen,
      coins: [{id: "global-quakes", min: Math.min(min, 0), max: Math.max(max, 6), samples: this.mags}]
    };
  }
}