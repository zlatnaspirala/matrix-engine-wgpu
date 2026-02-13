import {LOG_FUNNY_ARCADE, LOG_FUNNY_BIG_TERMINAL, mb} from "../../engine/utils";

export class MEEditorClient {
  ws = null;
  constructor(typeOfRun, name) {
    this.ws = new WebSocket("ws://localhost:1243");

    this.ws.onopen = () => {
      if(typeOfRun == 'created from editor') {
        console.log(`%cCreated from editor. Watch <signal> ${name}`, LOG_FUNNY_ARCADE);
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
      console.log("%c[EDITOR][WS OPEN]", LOG_FUNNY_ARCADE);
      document.dispatchEvent(new CustomEvent("editorx-ws-ready", {}));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("%c[EDITOR][WS MESSAGE]", LOG_FUNNY_ARCADE, data);
        if(data && data.ok == true && data.payload && data.payload.redirect == true) {
          setTimeout(() => location.assign(data.name + ".html"), 2000);
        } else if(data.payload && data.payload == "stop-watch done") {
          mb.show("watch-stoped");
        } else if(data.listAssetsForGraph) {
          // later in graphs ... 
          document.dispatchEvent(new CustomEvent('editorx-update-assets-list', {
            detail: data
          }))
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
          if(data.methodSaves && data.ok == true) {
            mb.show("Graph saved ✅");
            // console.log('Graph saved ✅ test ', data.graphName);
            if (typeof data.graphName === "string") document.dispatchEvent(new CustomEvent('get-shader-graphs', {}));
          }
          if(data.methodLoads && data.ok == true && data.shaderGraphs) {
            mb.show("Graphs list ✅" + data.shaderGraphs);
            document.dispatchEvent(new CustomEvent('on-shader-graphs-list', {detail: data.shaderGraphs}));
          } else if(data.methodLoads && data.ok == true) {
            mb.show("Graph loads ✅", data);
            document.dispatchEvent(new CustomEvent('on-graph-load', {detail: data.graph}));
          } else if(data.aiGenGraph && data.ok == true) {
            mb.show("AIGraph Generator response graph part ✅", data.aiGenNodes);
            document.dispatchEvent(new CustomEvent('on-ai-graph-response', {detail: data.aiGenNodes}));
          }
          else {
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
      console.info('%c[file-detail <signal>]', LOG_FUNNY_ARCADE);
      let o = {
        action: "file-detail",
        name: e.detail.name,
        rootFolder: e.detail.rootFolder
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addCube', (e) => {
      console.info('%c[web.editor.addCube]', LOG_FUNNY_ARCADE);
      let o = {
        action: "addCube",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addSphere', (e) => {
      console.info('%c[web.editor.addSphere]', LOG_FUNNY_ARCADE);
      let o = {
        action: "addSphere",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('save-methods', (e) => {
      console.info('%cSave methods <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "save-methods",
        methodsContainer: e.detail.methodsContainer
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('save-graph', (e) => {
      console.info('%cSave graph <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "save-graph",
        graphData: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('save-shader-graph', (e) => {
      console.info('%cSave shader-graph <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "save-shader-graph",
        graphData: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('aiGenGraphCall', (e) => {
      console.info('%caiGenGraphCall fluxCodexVertex <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "aiGenGraphCall",
        prompt: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('load-shader-graph', (e) => {
      console.info('%cLoad shader-graph <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "load-shader-graph",
        name: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('delete-shader-graph', (e) => {
      console.info('%cDelete shader-graph <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "delete-shader-graph",
        name: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('get-shader-graphs', () => {
      console.info('%cget-shader-graphs <signal>', LOG_FUNNY_ARCADE);
      let o = {
        action: "get-shader-graphs"
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addGlb', (e) => {
      console.log("%c[web.editor.addGlb]: " + e.detail, LOG_FUNNY_ARCADE);
      let o = {
        action: "addGlb",
        projectName: location.href.split('/public/')[1].split(".")[0],
        options: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.addObj', (e) => {
      console.log("%c[web.editor.addObj]: " + e.detail, LOG_FUNNY_ARCADE);
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
      console.log("%c[web.editor.delete]: " + e.detail, LOG_FUNNY_ARCADE);
      let o = {
        action: "delete-obj",
        projectName: location.href.split('/public/')[1].split(".")[0],
        name: e.detail.prefix
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.pos', (e) => {
      console.log("%c[web.editor.update.pos]: " + e.detail, LOG_FUNNY_ARCADE);
      let o = {
        action: "updatePos",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.rot', (e) => {
      console.log("%c[web.editor.update.rot]: " + e.detail, LOG_FUNNY_ARCADE);
      let o = {
        action: "updateRot",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.scale', (e) => {
      console.log("%c[web.editor.update.scale]: " + e.detail, LOG_FUNNY_ARCADE);
      let o = {
        action: "updateScale",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });

    document.addEventListener('web.editor.update.useScale', (e) => {
      console.log("%c[web.editor.update.useScale]: " + e.detail, LOG_FUNNY_ARCADE);
      let o = {
        action: "useScale",
        projectName: location.href.split('/public/')[1].split(".")[0],
        data: e.detail
      };
      o = JSON.stringify(o);
      this.ws.send(o);
    });
  }
}
