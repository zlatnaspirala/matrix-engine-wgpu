export class SeismicPortalAdapter {

  constructor(historyLen = 64) {
    this.historyLen = historyLen;
    this.mags = new Float32Array(historyLen);
    this.depths = new Float32Array(historyLen);
    this.onUpdate = null;
    this.ws = null;
    this._heartbeat = null;
  }


  start() {

    this.ws = new WebSocket("wss://www.seismicportal.eu/standing_order/websocket");

    this.ws.onopen = () => {
      console.info("[seismic] connected");
      this._heartbeat = setInterval(() => {
        if(this.ws.readyState === WebSocket.OPEN) {
          this.ws.send("ping");
        }
      }, 5000);
    };

    this.ws.onmessage = (msg) => {
      try {
        console.log("[seismic raw]", msg.data);
        const data = JSON.parse(msg.data);
        const props = data.data?.properties;
        if(!props) {return;}

        this.mags.copyWithin(0, 1);
        this.mags[this.historyLen - 1] = props.mag ?? 0;
        this.depths.copyWithin(0, 1);
        this.depths[this.historyLen - 1] = props.depth ?? 0;
        const earthquake = {
          id: data.data?.id ?? props.unid ?? null,
          latitude: props.lat ?? 0,
          longitude: props.lon ?? 0,
          depth: props.depth ?? 0,
          magnitude: props.mag ?? 0,
          magnitudeType: props.magtype ?? null,
          region: props.flynn_region ?? "",
          time: props.time ?? null,
          source: props.source_catalog ?? null,
        };
        if(this.onUpdate) {
          this.onUpdate(earthquake);
        }
      } catch(e) {
        console.warn("SeismicPortalAdapter parse failed:", e);
      }
    };

    this.ws.onerror = (e) => console.warn("SeismicPortalAdapter ws error:", e);
    this.ws.onclose = () => {
      console.info("SeismicPortalAdapter ws closed");
      if(this._heartbeat) {
        clearInterval(this._heartbeat);
        this._heartbeat = null;
      }
    };
  }

  stop() {
    if(this._heartbeat) {
      clearInterval(this._heartbeat);
      this._heartbeat = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}