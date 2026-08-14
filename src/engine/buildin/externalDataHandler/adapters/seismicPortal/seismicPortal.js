import {byId} from "../../../../utils";

export class SeismicPortalAdapter {
  constructor(historyLen = 10) {
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
      console.info("[seismicportal.eu] connected");
    };

    this.ws.onmessage = (msg) => {
      try {
        console.log("[seismic:data]", msg.data);
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
        const container = byId('last_earthquake');
        if(container) {
          container.innerHTML = '';
          const card = document.createElement('div');
          card.style.cssText = `
  font-family: Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  background: rgba(0,0,0,0.35);
  color: #fff;
  `;
          const title = document.createElement('div');
          title.textContent = '🌍 Last Earthquake';
          title.style.cssText = `
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 8px;
  `;
          const fields = [
            ['Magnitude', `${earthquake.magnitude} ${earthquake.magnitudeType ?? ''}`],
            ['Location', earthquake.region],
            ['Latitude', Number(earthquake.latitude).toFixed(4) + '°'],
            ['Longitude', Number(earthquake.longitude).toFixed(4) + '°'],
            ['Depth', `${earthquake.depth} km`],
            ['Time', earthquake.time ?? '-'],
            ['Source', earthquake.source ?? '-'],
            ['ID', earthquake.id ?? '-'],
          ];
          card.appendChild(title);
          for(const [label, value] of fields) {
            const row = document.createElement('div');
            const labelEl = document.createElement('span');
            labelEl.textContent = `${label}: `;
            labelEl.style.fontWeight = 'bold';
            const valueEl = document.createElement('span');
            valueEl.textContent = value;
            row.appendChild(labelEl);
            row.appendChild(valueEl);
            card.appendChild(row);
          }
          container.appendChild(card);
        }
        if(this.onUpdate) {
          this.onUpdate(earthquake);
        }
      } catch(e) {
        console.warn("SeismicPortalAdapter parse failed:", e);
      }
    };

    this.ws.onerror = (e) => console.warn("SeismicPortalAdapter ws error:", e);
    this.ws.onclose = () => {
      console.info("SeismicPortalAdapter ws closed.");
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