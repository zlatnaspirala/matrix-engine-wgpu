
export class MEEditorClient {

  constructor() {
    this.ws = new WebSocket("ws://localhost:1243");

    this.ws.onopen = () => {
      console.log("%c[WS OPEN]", "color: lime; font-weight: bold");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("%c[WS MESSAGE]", "color: yellow", data);
      } catch(e) {
        console.error("[WS ERROR PARSE]", e);
      }
    };

    this.ws.onerror = (err) => {
      console.error("%c[WS ERROR]", "color: red", err);
    };

    this.ws.onclose = () => {
      console.log("%c[WS CLOSED]", "color: gray");
    }

  }
}
