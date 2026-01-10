import {mb} from "../../engine/utils";

export class MEEditorClient {

  ws = null;

  constructor(typeOfRun, name) {
    this.ws = new WebSocket("ws://localhost:1243");

    this.ws.onopen = () => {
      if(typeOfRun == 'created from editor') {
        console.info('created from editor - watch <signal>');
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
          setTimeout(() => location.assign(data.name + ".html"), 2000);
        } else if(data.payload && data.payload == "stop-watch done") {
          mb.show("watch-stoped");
        } else if(data.listAssets) {
          document.dispatchEvent(new CustomEvent('la', {
            detail: data
          }))
        } else if(data.projects) {
          const projects = data.payload
            .filter(item => item.name !== 'readme.md')
            .map(item => item.name.trim());
          if(projects.length === 0) {
            console.warn('No projects found');
            return;
          }
          const txt = "Project list: \n" +
            projects.map(p => `- ${p}`).join("\n") + "\n" +
            "  Choose project name:";
          const projectName = prompt(txt);
          if(projectName) {
            console.log("Project name:", projectName);
            location.assign(projectName + ".html");
          } else {
            console.error('Project loading cancelled');
          }
        } else if(data.details) {
          document.dispatchEvent(new CustomEvent('file-detail-data', {
            detail: data
          }))
        } else if(data.refresh == 'refresh') {
          // setTimeout(() => location.reload(true) , 1500);
          setTimeout(() => document.dispatchEvent(new CustomEvent('updateSceneContainer', {detail: {}})), 1000)
        } else {
          console.log("data", data)
          if(data.methodSaves && data.ok == true) {
            mb.show("Graph saved ✅");
          } else {
            mb.show("From editorX:" + data.ok);
          }

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
    });

    document.addEventListener('cnp', (e) => {
      console.info('Create new project <signal>');
      let o = {
        action: "cnp",
        name: e.detail.name,
        features: e.detail.features
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('stop-watch', (e) => {
      console.info('stop-watch <signal>');
      let o = {
        action: "stop-watch",
        name: e.detail.name
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('start-watch', (e) => {
      console.info('start-watch <signal>');
      let o = {
        action: "watch",
        name: e.detail.name
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('nav-folder', (e) => {
      console.info('nav-folder <signal>');
      let o = {
        action: "nav-folder",
        name: e.detail.name,
        rootFolder: e.detail.rootFolder
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('file-detail', (e) => {
      console.info('file-detail <signal>');
      let o = {
        action: "file-detail",
        name: e.detail.name,
        rootFolder: e.detail.rootFolder
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addCube', (e) => {
      console.log("[web.editor.addCube]: ", e.detail);
      console.info('addCube <signal>');
      let o = {
        action: "addCube",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addSphere', (e) => {
      console.log("[web.editor.addSphere]: ", e.detail);
      console.info('addSphere <signal>');
      let o = {
        action: "addSphere",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('save-methods', (e) => {
      console.info('save script <signal>');
      let o = {
        action: "save-methods",
        methodsContainer: e.detail.methodsContainer
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('save-graph', (e) => {
      console.info('save graph <signal>');
      let o = {
        action: "save-graph",
        graphData: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addGlb', (e) => {
      console.log("[web.editor.addGlb]: ", e.detail);

      console.info('addGlb <signal>');
      let o = {
        action: "addGlb",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addObj', (e) => {
      console.log("[web.editor.addObj]: ", e.detail);

      console.info('addObj <signal>');
      let o = {
        action: "addObj",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addMp3', (e) => {
      // console.log("[web.editor.addMp3]: ", e.detail);
      // console.info('addMp3 <signal>');
      // let o = {
      //   action: "addMp3",
      //   projectName: location.href.split('/public/')[1].split(".")[0],
      //   options: e.detail
      // };
      // o = JSON.stringify(o);
      // this.ws.send(o);
    });

    // delete obj
    document.addEventListener('web.editor.delete', (e) => {
      console.log("[web.editor.delete]: ", e.detail.prefix);
      console.info('delete-obj <signal>');
      let o = {
        action: "delete-obj",
        projectName: location.href.split('/public/')[1].split(".")[0],
        name: e.detail.prefix
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.pos', (e) => {
      console.log("[web.editor.update.pos]: ", e.detail);
      console.info('web.editor.update.pos <signal>');
      let o = {
        action: "updatePos",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.rot', (e) => {
      console.log("[web.editor.update.rot]: ", e.detail);
      console.info('web.editor.update.rot <signal>');
      let o = {
        action: "updateRot",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.scale', (e) => {
      console.log("[web.editor.update.scale]: ", e.detail);
      console.info('web.editor.update.scale <signal>');
      let o = {
        action: "updateScale",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

  }
}
