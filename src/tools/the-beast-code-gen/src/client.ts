import { LOG_FUNNY_ARCADE, mb } from "../../../engine/utils";

export class MEEditorClient {
  ws=null;
  updateSceneEvent=new CustomEvent('updateSceneContainer', { detail: {} });

  constructor () {
    this.ws=new WebSocket("ws://localhost:1243");
    this.ws.onopen=() => {
      console.log(`%c <signal> list`, LOG_FUNNY_ARCADE);
      var o: any={
        action: "list",
        path: ''
      };
      o=JSON.stringify(o);
      this.ws.send(o);
      console.log("%c[CODE CREATOR][WS OPEN]", LOG_FUNNY_ARCADE);
      document.dispatchEvent(new CustomEvent("code-creator-ready", {}));
    };

    this.ws.onmessage=(event) => {
      try {
        const data=JSON.parse(event.data);
        console.log("%c[EDITOR][WS MESSAGE]", LOG_FUNNY_ARCADE, data);
        if(data.listAssets) {
          console.log("%c[EDITOR][WS MESSAGE] list assets", LOG_FUNNY_ARCADE, data);
          document.dispatchEvent(new CustomEvent('list-assets', { detail: data }))
        } else {
          if(data.aiGenGraph&&data.ok==true) {
            console.log("TheBeast Creator ✅:", data.aiGenNodes);
            document.dispatchEvent(new CustomEvent('on-ai-response', { detail: data.aiGenNodes }));
          } else {
            // mb.show("From code creator:"+data.ok);
            console.info("no_handler", data);
          }
        }
      } catch(e: any) {
        console.error("[WS ERROR PARSE]", e);
      }
    };

    this.ws.onerror=(err) => {
      console.error("%c[WS ERROR]", "color: red", err);
      document.dispatchEvent(new CustomEvent("editor-not-running", { detail: {} }));
    };

    this.ws.onclose=() => {
      console.log("%c[WS CLOSED]", "color: gray");
    }
    this.attachEvents();
  }

  attachEvents() {
    document.addEventListener('aiGenGraphCall', (e: any) => {
      console.info('%caiGenGraphCall fluxCodexVertex <signal>', LOG_FUNNY_ARCADE);
      let o: any={
        action: "aiGenGraphCall",
        prompt: e.detail
      };
      o=JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('nav-folder', (e: any) => {
      console.info('nav-folder <signal>');
      let o={
        action: "nav-folder",
        name: e.detail.name,
        rootFolder: e.detail.rootFolder
      };
      o=JSON.stringify(o);
      this.ws.send(o);
    });

  }
}