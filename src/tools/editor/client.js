import {mb} from "../../engine/utils";

export class MEEditorClient {

  ws = null;

  constructor(typeOfRun, name) {
    this.ws = new WebSocket("ws://localhost:1243");

    this.ws.onopen = () => {
      if(typeOfRun == 'created from editor') {
        //
        console.info('wATCH project <signal>');
        let o = {
          action: "watch",
          name: name
        };
        o = JSON.stringify(o);
        this.ws.send(o);

        o = {
          action: "list",
          path: name
        };
        o = JSON.stringify(o);
        this.ws.send(o);

      }
      console.log("%c[WS OPEN] [Attach events]", "color: lime; font-weight: bold");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("%c[WS MESSAGE]", "color: yellow", data);
        if(data && data.ok == true && data.payload && data.payload.redirect == true) {
          setTimeout(() => location.assign(data.name + ".html"), 1000);
        } else if(data.payload && data.payload == "stop-watch done") {
          mb.show("watch-stoped");
        } else if(data.listAssets) {
          document.dispatchEvent(new CustomEvent('la', {
            detail: data
          }))
        } else if(data.projects) {
          data.payload.forEach((item) => {
            console.log('.....' + item.name);
            if(item.name != 'readme.md') {
              let txt = `Project list: \n
                - ${item.name}  \n
               \n
               Choose project name:
              `;
              let projectName = prompt(txt);
              if(projectName !== null) {
                console.log("Project name:", projectName);
                projectName += ".html";
                location.assign(projectName);
              } else {
                console.error('Something wrong with load project input!');
              }
            }
          });
        } else {
          mb.show("from editor:" + data.payload);
        }
      } catch(e) {
        console.error("[WS ERROR PARSE]", e);
      }
    };

    this.ws.onerror = (err) => {
      console.error("%c[WS ERROR]", "color: red", err);
      document.dispatchEvent(new CustomEvent("editor-not-running", {detail: {}}));
    };

    this.ws.onclose = () => {
      console.log("%c[WS CLOSED]", "color: gray");
    }

    this.attachEvents();
  }

  attachEvents() {

    document.addEventListener('lp', (e) => {
      console.info('Load project <signal>');
      let o = {
        action: "lp"
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    })

    document.addEventListener('cnp', (e) => {
      console.info('Create new project <signal>');
      let o = {
        action: "cnp",
        name: e.detail.name,
        features: e.detail.features
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    })

    document.addEventListener('stop-watch', (e) => {
      console.info('stop-watch <signal>');
      let o = {
        action: "stop-watch",
        name: e.detail.name
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    })

    document.addEventListener('start-watch', (e) => {
      console.info('start-watch <signal>');
      let o = {
        action: "watch",
        name: e.detail.name
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    })
  }
}
