/**
 * @description
 * Web editor backend node application.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 * @www https://maximumroulette.com
 */
import esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";
import {WebSocketServer} from "ws";
import {DEFAULT_GRAPH_JS} from "./graph.js";
import {DEFAUL_METHODS} from "./methods.js";
import {DEFAULT_SHADER_GRAPH_JS} from "./shader-graph.js";

// matrix-engine-wgpu repo root reference
const ENGINE_PATH = path.resolve("../../../../");
const PUBLIC_DIR = path.join(ENGINE_PATH, "public");
const PUBLIC_RES = path.join(PUBLIC_DIR, "res");
const PROJECTS_DIR = path.join(ENGINE_PATH, "projects");
let PROJECT_NAME = "";

await fs.mkdir(PROJECTS_DIR, {recursive: true});
const watchers = new Map();

const wss = new WebSocketServer({port: 1243});
console.log("\x1b[1m\x1b[92m%s\x1b[0m", " Editorx websock running on ws://localhost:1243");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[93m%s\x1b[0m", "- Start you new project                  -");
console.log("\x1b[93m%s\x1b[0m", "- Load project                           -");
console.log("\x1b[93m%s\x1b[0m", "- When you create a project next time    -");
console.log("\x1b[93m%s\x1b[0m", "- you can go directly to /MyProject.html -");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");

async function buildAllProjectsOnStartup() {
  console.log("🔨 Building all projects (startup)…");
  const items = await fs.readdir(PROJECTS_DIR, {withFileTypes: true});
  for(const dir of items) {
    if(!dir.isDirectory()) continue;
    const projectName = dir.name;
    const entry = path.join(PROJECTS_DIR, projectName, "app-gen.js");
    // GRAPH
    const graphFile = path.join(PROJECTS_DIR, projectName, "graph.js");
    try {
      await fs.access(graphFile);
    } catch {
      await fs.writeFile(graphFile, DEFAULT_GRAPH_JS, "utf8");
      console.log(`🧠 Created default graph.js for ${projectName}`);
    }
    // Shader graph
    const shaderGraphFile = path.join(PROJECTS_DIR, projectName, "shader-graphs.js");
    try {
      await fs.access(shaderGraphFile);
    } catch {
      await fs.writeFile(shaderGraphFile, DEFAULT_SHADER_GRAPH_JS, "utf8");
      console.log(`🧠 Created default shader graph.js for ${projectName}`);
    }
    const mname = projectName + "_methods.js";
    const methodsFile = path.join(PUBLIC_DIR, mname);
    try {
      await fs.access(methodsFile);
    } catch {
      await fs.writeFile(methodsFile, DEFAUL_METHODS, "utf8");
      console.log(`🧠 Created default methods.js for ${projectName}`);
    }
    try {
      await fs.access(entry);
    } catch {
      console.warn(`⚠️ Skipping ${projectName} (no app-gen.js)`);
      continue;
    }
    const outfile = path.join(PUBLIC_DIR, `${projectName}.js`);
    try {
      await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        outfile,
        format: "esm",
        sourcemap: true,
        platform: "browser",
        minify: false
      });

      console.log(`✅ Built ${projectName}`);
      const htmlFile = path.join(PUBLIC_DIR, `${projectName}.html`);
      try {
        await fs.access(htmlFile);
      } catch {
        const html = new CodeBuilder();
        html.addLine(createHTMLProjectDocument(projectName));
        await html.saveTo(htmlFile);
        console.log(`📄 Created ${projectName}.html`);
      }
    } catch(err) {
      console.error(`❌ Failed to build ${projectName}`, err.message);
    }
  }

  console.log("✅ Startup build finished");
}

export class CodeBuilder {
  constructor() {
    this.lines = [];
  }

  addLine(line) {
    this.lines.push(line + "\n");
  }

  addEmptyLine() {
    this.lines.push("\n");
  }

  toString() {
    return this.lines.join("");
  }

  async saveTo(filePath) {
    await fs.writeFile(filePath, this.toString());
  }
}

await buildAllProjectsOnStartup();

wss.on("connection", ws => {
  ws.on("message", async (msg) => {
    try {
      msg = JSON.parse(msg);
      if(msg.action === "lp") {
        const folder = path.join(PROJECTS_DIR, "");
        const items = await fs.readdir(folder, {withFileTypes: true});
        ws.send(JSON.stringify({
          projects: "projects",
          ok: true,
          payload: items.map(d => ({
            name: d.name,
            isDir: d.isDirectory()
          }))
        }));
      } else if(msg.action === "list") {
        const rel = "";
        const folder = path.join(PUBLIC_RES, rel);
        const items = await fs.readdir(folder, {withFileTypes: true});
        ws.send(JSON.stringify({
          listAssets: "list-assets",
          ok: true,
          rootFolder: PUBLIC_RES,
          payload: items.map(d => ({
            name: d.name,
            isDir: d.isDirectory()
          }))
        }));
      } else if(msg.action === "cnp") {
        cnp(ws, msg);
      } else if(msg.action === "watch") {
        console.log("action [WATCH]");
        buildProject(msg.name, ws, 'Watch activated')
      } else if(msg.action === "stop-watch") {
        console.log("action [WATCH]");
        stopWatch(msg.name, ws)
      } else if(msg.action === "nav-folder") {
        console.log("nav-folder [WATCH]");
        navFolder(msg, ws);
      } else if(msg.action == "file-detail") {
        fileDetail(msg, ws);
      } else if(msg.action == "addCube") {
        addCube(msg, ws);
      } else if(msg.action == "addSphere") {
        addSphere(msg, ws);
      } else if(msg.action == "addGlb") {
        addGlb(msg, ws);
      } else if(msg.action == "addObj") {
        addObj(msg, ws);
      } else if(msg.action == "save-methods") {
        saveMethods(msg, ws);
      } else if(msg.action == "save-graph") {
        saveGraph(msg, ws);
      } else if(msg.action == "save-shader-graph") {
        saveShaderGraph(msg, ws);
      } else if(msg.action == "delete-obj") {
        deleteSceneObject(msg, ws);
      } else if(msg.action == "updatePos") {
        updatePos(msg, ws);
      } else if(msg.action == "updateRot") {
        updateRot(msg, ws);
      } else if(msg.action == "updateScale") {
        updateScale(msg, ws);
      } else if(msg.action == "useScale") {
        useScale(msg, ws);
      }

    } catch(err) {
      ws.send(JSON.stringify({ok: false, error: err.message}));
    }
  });
});

function CBimport() {
  return `import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
`;
}

function CBoptions(p, n, pName) {
  return `
  {
  ${p ? '' : 'dontUsePhysics: true,'}
  useEditor: true,
  projectType: "created from editor",
  ${pName ? `projectName: '${pName}',` : ""}
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.1, g: 0.1, a: 1}
}
  `;
}

async function cnp(ws, msg) {
  const content = new CodeBuilder();
  let p = false;
  let n = false;
  content.addLine(CBimport());

  if(msg.features.physics) {
    // console.log('Add physics...');
    p = true;
    if(msg.features.networking) {
      n = true;
      // console.log('Add net ...');
    } else {
      n = false;
      // console.log('no net ...');
    }
  } else {
    // console.log('no physics...');
    if(msg.features.networking) {
      // console.log('Add net ...');
      n = true;
    } else {
      // console.log('no net ...');
      n = false;
    }
  }

  content.addLine(`let app = new MatrixEngineWGPU(`);
  content.addLine(CBoptions(p, n, msg.name));
  content.addLine(`, (app) => {`);
  if(p) content.addLine(`addEventListener('AmmoReady', async () => { `);

  content.addLine(`// [only fro projects created from editor]`);
  content.addLine(`app.graph = graph;`);
  // graph
  content.addLine(`// [light]`);
  content.addLine(`app.addLight();`);

  content.addLine(`
      // ME START FLOOR addCube\n
      downloadMeshes({mesh: "./res/meshes/blender/plane.obj"}, (m) => {
          let texturesPaths = ['./res/meshes/blender/cube.png'];
          app.addMeshObj({
            position: {x: 0, y: -1, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
            texturesPaths: [texturesPaths],
            name: 'FLOOR',
            mesh: m.mesh,
            raycast: {enabled: true, radius: 2},
            physics: {enabled: false, geometry: "Cube"}
          });
        }, {scale: [25, 1, 25]});\n
      // ME END FLOOR addCube\n
  `);

  content.addLine(`// [MAIN_REPLACE2]`);
  if(p) content.addLine(` })`);
  content.addLine(`})`);
  content.addLine(`window.app = app;`);

  const name = msg.name || "noname";
  const id = `${name}`;
  const objFolder = path.join(PROJECTS_DIR, id);
  let payload = {
    redirect: true,
    id,
    name,
    absolutePath: path.join(objFolder, `${msg.name}.json`),
    PROJECTS_DIR: PROJECTS_DIR,
    projectData: path.join(id, `${msg.name}.json`),
    physics: p,
    networking: n
  };
  await fs.mkdir(objFolder, {recursive: true});
  await fs.writeFile(
    path.join(objFolder, `${msg.name}.json`),
    JSON.stringify(payload, null, 2)
  );

  await content.saveTo(path.join(objFolder, 'app-gen.js'));

  buildProject(name, ws, payload);
}

async function buildProject(projectName, ws, payload) {

  if(watchers.has(projectName)) {
    console.log(`⚠️ Watcher for ${projectName} is already running...`);
    ws.send(JSON.stringify({
      name: projectName,
      ok: true,
      payload: "watcher is already running..."
    }))
    return;
  }

  const entry = `${PROJECTS_DIR}\\${projectName}\\app-gen.js`;
  const outfile = `${PUBLIC_DIR}\\${projectName}.js`;
  const context = await esbuild.context({
    entryPoints: [entry],
    bundle: true,
    outfile,
    format: "esm",
    sourcemap: true,
    platform: "browser",
    minify: false
  });
  await context.watch();
  console.log(`Watching & bundling ${projectName} → ${outfile}`);
  watchers.set(projectName, context); // <- store watcher
  PROJECT_NAME = projectName;
  console.log(`👀 Started watcher for ${projectName}`);

  const htmldoc = new CodeBuilder();
  htmldoc.addLine(createHTMLProjectDocument(projectName));
  const outHtmlFile = `${PUBLIC_DIR}\\${projectName}.html`;
  htmldoc.saveTo(outHtmlFile);

  await buildAllProjectsOnStartup();

  ws.send(JSON.stringify({
    name: projectName,
    ok: true,
    payload: payload
  }))
}

async function stopWatch(projectName, ws) {
  const ctx = watchers.get(projectName);
  if(!ctx) {
    console.log("No watcher for project:", projectName);
    ws.send(JSON.stringify({
      name: projectName,
      ok: true,
      payload: "watcher already terminated..."
    }))
    return;
  }

  await ctx.dispose();       // <- STOP WATCH
  watchers.delete(projectName);
  console.log("🛑 Watch stopped for", projectName);
  ws.send(JSON.stringify({
    name: projectName,
    ok: true,
    payload: "stop-watch done"
  }))
}

function createHTMLProjectDocument(name) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="manifest" href="manifest.web" />
    <title>${name}</title>
    <meta name="description" content="Web Editor for Matrix Engine webGPU. Created by Nikola Lukic zlatnaspirala@gmail.com 2025" />
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <link defer rel="stylesheet" href="css/style.css" />
    <link rel="apple-touch-icon" href="res/icons/512.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#000000" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0,minimal-ui" />
    <link rel="icon" type="image/png" sizes="512x512" href="res/icons/512.png" />
    <script src="./hacker-timer/hack-timer-worker.min.js"></script>
  </head>
  <body allow="autoplay" class="meBody">
    <script src="${name}.js"></script>
    <div id="msgBox" class="msg-box animate1" onclick="mb.copy()"></div>
    <div id="log" class="msg-box animate1">matrix-engine-autogen</div>
    <div id="matrix-net"></div>
  </body>
</html>
  `;
}

async function navFolder(data, ws) {
  if(data.rootFolder) {
    // console.log('data.rootFolder ', data.rootFolder);
  } else {
    console.log('data.rootFolder no defined');
  }
  const folder = path.join(data.rootFolder, data.name);
  const items = await fs.readdir(folder, {withFileTypes: true});
  ws.send(JSON.stringify({
    listAssets: "list-assets",
    ok: true,
    rootFolder: path.join(data.rootFolder, data.name),
    payload: items.map(d => ({
      name: d.name,
      isDir: d.isDirectory()
    }))
  }));
}

async function fileDetail(msg, ws) {
  const folder = path.join(msg.rootFolder, msg.name);
  try {
    const stat = await fs.stat(folder);
    const details = {
      path: folder,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
      size: stat.size,          // bytes
      created: stat.birthtime,  // Date
      modified: stat.mtime,     // Date
    };
    ws.send(JSON.stringify({
      ok: true,
      details: details
    }));
  } catch(err) {
    console.error("Error:", err);
    ws.send(JSON.stringify({error: err.message}));
  }
}

async function addCube(msg, ws) {
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.options.index} ${msg.action}`);
  content.addLine(` downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { `);
  content.addLine(`   let texturesPaths = ['./res/meshes/blender/cube.png']; `);
  content.addLine(`   app.addMeshObj({`);
  content.addLine(`     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},`);
  content.addLine(`     texturesPaths: [texturesPaths],`);
  content.addLine(`     name: '${msg.options.index}',`);
  content.addLine(`     mesh: m.cube,`);
  content.addLine(`     raycast: {enabled: true, radius: 2},`);
  content.addLine(`     physics: {enabled: ${msg.options.physics}, geometry: "Cube"}`);
  content.addLine(`   }); `);
  content.addLine(` }, {scale: [1, 1, 1]});  `);
  content.addLine(` // ME END ${msg.options.index} ${msg.action}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = text.replace('// [MAIN_REPLACE2]',
      `
      ${content.toString()} \n
      // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

async function saveScript(path, text, ws) {
  fs.writeFile(path, text, "utf8").then((e) => {
    const refresh = 'refresh';
    console.log(refresh);
    ws.send(JSON.stringify({
      ok: true,
      refresh: refresh
    }));
  }).catch((err) => {
    console.log('write file ERR', err)
  });
}

async function saveMethods(msg, ws) {
  const folderPerProject = path.join(PROJECTS_DIR, PROJECT_NAME);
  fs.mkdir(folderPerProject, {recursive: true});
  const file = path.join(folderPerProject, "\\methods.js");
  const content =
    "export default " +
    JSON.stringify(msg.methodsContainer, null, 2) +
    ";\n";
  fs.writeFile(file, content, "utf8").then((e) => {
    // ws.send(JSON.stringify({
    //   ok: true,
    //   methodSaves: 'OK'
    // }));
    console.log("Saved methods.js");
  });
  //

  let name = PROJECT_NAME + "_methods.js"
  const finalPack = path.join(PUBLIC_DIR, name);
  const contentPublic =
    "export default " +
    JSON.stringify(msg.methodsContainer, null, 2) +
    ";\n";
  fs.writeFile(finalPack, contentPublic, "utf8").then((e) => {
    ws.send(JSON.stringify({
      ok: true,
      methodSaves: 'OK'
    }));
    console.log("Saved methods.js");
  });
}

async function saveGraph(msg, ws) {
  const folderPerProject = path.join(PROJECTS_DIR, PROJECT_NAME);
  fs.mkdir(folderPerProject, {recursive: true});
  const file = path.join(folderPerProject, "\\graph.js");
  const content =
    "export default " +
    msg.graphData +
    ";\n";
  fs.writeFile(file, content, "utf8").then((e) => {
    ws.send(JSON.stringify({
      ok: true,
      methodSaves: 'OK'
    }));
    console.log("Saved graph.js");
  });
}

async function saveShaderGraph(msg, ws) {
  const folderPerProject = path.join(PROJECTS_DIR, PROJECT_NAME);
  await fs.mkdir(folderPerProject, {recursive: true});
  const file = path.join(folderPerProject, "shader-graphs.js");
  let graphs = [];
  try {
    const existingContent = await fs.readFile(file, "utf8");
    // Extract array from "export default [...];"
    const match = existingContent.match(/export default (\[[\s\S]*\]);?/);
    if(match) {
      graphs = JSON.parse(match[1]);
    }
  } catch(err) {
    console.log("No existing shader-graphs.js, creating new");
  }
  // const newGraph = JSON.parse(msg.graphData);
  const newGraph = msg.graphData;
  // Find and update, or add new
  const existingIndex = graphs.findIndex(g => g.name === newGraph.name);
  if(existingIndex !== -1) {
    graphs[existingIndex] = newGraph;
  } else {
    graphs.push(newGraph);
  }
  const content = `export default ${JSON.stringify(graphs, null, 2)};\n`;
  await fs.writeFile(file, content, "utf8");
  ws.send(JSON.stringify({
    ok: true,
    methodSaves: 'OK',
    graphName: newGraph.name
  }));
  console.log(`Saved shader graph: ${newGraph.name}`);
}

function getNameFromPath(p) {
  return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, "");
}

async function addGlb(msg, ws) {
  const content = new CodeBuilder();
  msg.options.path = msg.options.path.replace(/\\/g, '/');
  content.addLine(` // ME START ${getNameFromPath(msg.options.path)}`);
  content.addLine(` var glbFile01 = await fetch('${msg.options.path}').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));`);
  content.addLine(`   texturesPaths = ['./res/meshes/blender/cube.png']; `);
  content.addLine(`    app.addGlbObj({ `);
  content.addLine(`     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},`);
  content.addLine(`     texturesPaths: [texturesPaths],`);
  content.addLine(`     scale: [2, 2, 2],`);
  content.addLine(`     name:  app.getNameFromPath('${msg.options.path}'),`);
  content.addLine(`     material: {type: 'standard', useTextureFromGlb: true},`);
  content.addLine(`     raycast: {enabled: true, radius: 2},`);
  content.addLine(`     physics: {enabled: ${msg.options.physics}, geometry: "Cube"}`);
  content.addLine(`   }, null, glbFile01);`);
  content.addLine(` // ME END ${getNameFromPath(msg.options.path)}`);

  const objScript = path.join(PROJECTS_DIR, PROJECT_NAME + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = text.replace('// [MAIN_REPLACE2]',
      `
      ${content.toString()} \n
      // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

async function addObj(msg, ws) {
  msg.options.path = msg.options.path.replace(/\\/g, '/');
  console.log('msg', msg.options.path);
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.options.index}`);
  content.addLine(` downloadMeshes({cube: "${msg.options.path}"}, (m) => { `);
  content.addLine(`   const texturesPaths = ['./res/meshes/blender/cube.png']; `);
  content.addLine(`   app.addMeshObj({`);
  content.addLine(`     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},`);
  content.addLine(`     texturesPaths: [texturesPaths],`);
  content.addLine(`     name: '${msg.options.index}',`);
  content.addLine(`     mesh: m.cube,`);
  content.addLine(`     raycast: {enabled: true, radius: 2},`);
  content.addLine(`     physics: {enabled: ${msg.options.physics}, geometry: "Cube"}`);
  content.addLine(`   }); `);
  content.addLine(` }, {scale: [1, 1, 1]});  `);
  content.addLine(` // ME END ${msg.options.index}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = text.replace('// [MAIN_REPLACE2]',
      `
      ${content.toString()} \n
      // [MAIN_REPLACE2]`);

    saveScript(objScript, text, ws);
  })
}

async function addSphere(msg, ws) {
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.options.index} ${msg.action}`);
  content.addLine(` downloadMeshes({sphere: "./res/meshes/shapes/sphere.obj"}, (m) => { `);
  content.addLine(`   let texturesPaths = ['./res/meshes/blender/cube.png']; `);
  content.addLine(`   app.addMeshObj({`);
  content.addLine(`     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},`);
  content.addLine(`     texturesPaths: [texturesPaths],`);
  content.addLine(`     name: "${msg.options.index}",`);
  content.addLine(`     mesh: m.sphere,`);
  content.addLine(`     raycast: {enabled: true, radius: 2},`);
  content.addLine(`     physics: {enabled: ${msg.options.physics}, geometry: "Sphere"}`);
  content.addLine(`   }); `);
  content.addLine(` }, {scale: [1, 1, 1]});  `);
  content.addLine(` // ME END ${msg.options.index} ${msg.action}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = text.replace('// [MAIN_REPLACE2]',
      `
      ${content.toString()} \n
      // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

// update procedure
async function updatePos(msg, ws) {
  //  // inputFor: "Cube_0" property: "x" propertyId: "position" value: "1"
  console.log('msg pos update :', msg.data);
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.data.inputFor} ${msg.action + msg.data.property}`);
  content.addLine(` setTimeout(() => {`);
  content.addLine(`  app.getSceneObjectByName('${msg.data.inputFor}').position.Set${msg.data.property.toUpperCase()}(${msg.data.value});`);
  content.addLine(` }, 800);`);
  content.addLine(` // ME END ${msg.data.inputFor} ${msg.action + msg.data.property}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = removeSceneBlock(text, (msg.action + msg.data.property), msg.data.inputFor);
    text = text.replace('// [MAIN_REPLACE2]', `${content.toString()} \n // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

async function updateRot(msg, ws) {
  //  // inputFor: "Cube_0" property: "x" propertyId: "position" value: "1"
  console.log('msg rot update :', msg.data);
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.data.inputFor} ${msg.action + msg.data.property}`);
  content.addLine(` setTimeout(() => {`);
  content.addLine(`  app.getSceneObjectByName('${msg.data.inputFor}').rotation.${msg.data.property} = ${msg.data.value};`);
  content.addLine(` }, 800);`);
  content.addLine(` // ME END ${msg.data.inputFor} ${msg.action + msg.data.property}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = removeSceneBlock(text, (msg.action + msg.data.property), msg.data.inputFor);
    text = text.replace('// [MAIN_REPLACE2]', `${content.toString()} \n // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

async function updateScale(msg, ws) {
  //  // inputFor: "Cube_0" property: "0 1 2" propertyId: "scale" value: "1"
  console.log('msg scale update :', msg.data);
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.data.inputFor} ${msg.action + msg.data.property}`);
  content.addLine(` setTimeout(() => {`);
  content.addLine(`  app.getSceneObjectByName('${msg.data.inputFor}').scale[${msg.data.property}] = ${msg.data.value};`);
  content.addLine(` }, 800);`);
  content.addLine(` // ME END ${msg.data.inputFor} ${msg.action + msg.data.property}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = removeSceneBlock(text, (msg.action + msg.data.property), msg.data.inputFor);
    text = text.replace('// [MAIN_REPLACE2]', `${content.toString()} \n // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

async function useScale(msg, ws) {
  //  // inputFor: "Cube_0" property: "0 1 2" propertyId: "scale" value: "1"
  console.log('msg usescale update :', msg);
  const content = new CodeBuilder();
  content.addLine(` // ME START ${msg.data.inputFor} ${msg.action + msg.data.property}`);
  content.addLine(` setTimeout(() => {`);
  content.addLine(`  app.getSceneObjectByName('${msg.data.inputFor}').useScale = ${msg.data.value};`);
  content.addLine(` }, 800);`);
  content.addLine(` // ME END ${msg.data.inputFor} ${msg.action + msg.data.property}`);

  const objScript = path.join(PROJECTS_DIR, msg.projectName + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = removeSceneBlock(text, (msg.action + msg.data.property), msg.data.inputFor);
    text = text.replace('// [MAIN_REPLACE2]', `${content.toString()} \n // [MAIN_REPLACE2]`);
    saveScript(objScript, text, ws);
  })
}

// Delete object script code
async function deleteSceneObject(n, ws) {
  const objScript = path.join(PROJECTS_DIR, PROJECT_NAME + "\\app-gen.js");
  fs.readFile(objScript).then((b) => {
    let text = b.toString("utf8");
    text = removeSceneBlock(text, n.action, n.name);
    saveScript(objScript, text, ws);
  });
}

function removeSceneBlock(text, type, objName) {
  let regex;

  if(type === 'delete-obj') {
    // match ANY block that belongs to this object
    const start = `// ME START ${objName}`;
    const end = `// ME END ${objName}`;

    regex = new RegExp(
      `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}[^\\n]*\\s*`,
      'g'
    );
  } else {
    const start = `// ME START ${objName} ${type}`;
    const end = `// ME END ${objName} ${type}`;

    regex = new RegExp(
      `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\s*`,
      'g'
    );
  }

  return text.replace(regex, '');
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}