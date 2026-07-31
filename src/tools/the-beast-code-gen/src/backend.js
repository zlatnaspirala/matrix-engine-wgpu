import path from "path";
import fs from "fs/promises";
import {WebSocketServer} from "ws";
import esbuild from "esbuild";

/**
 * @description
 * NodeJS backend for the-beast-code-creator
 * @note 
 * This is node.js script.
 */

const ENGINE_PATH = path.resolve("../../../../");
const PUBLIC_DIR = path.join(ENGINE_PATH, "public");
const PUBLIC_RES = path.join(PUBLIC_DIR, "res");
const PROJECTS_DIR = path.join(ENGINE_PATH, "projects");

// import {DEFAULT_GRAPH_JS} from "./graph.js";
// import {DEFAUL_METHODS} from "./methods.js";

import {AiOllama} from "./ollama.js";
import {AvailableResources} from "./get-available-resources.js";

import {SYSTEM_PROMPT} from "./prompt.js";

let PROJECT_NAME = "";

await fs.mkdir(PROJECTS_DIR, {recursive: true});
const watchers = new Map();

const wss = new WebSocketServer({port: 1243});
console.log("\x1b[1m\x1b[92m%s\x1b[0m", " Editorx websock running on ws://localhost:1243");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[93m%s\x1b[0m", "- TheBeast Code Creator                   -");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[93m%s\x1b[0m", "- MAke task and get code                 -");
console.log("\x1b[93m%s\x1b[0m", "- StartUp at ./public/matrix-engine.html -");
console.log("\x1b[93m%s\x1b[0m", "- you go directly to /<PROJECT_NAME>.html-");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[92m%s\x1b[0m", "- AI_TOOL Ollama            -");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");

let matrixOllama = new AiOllama();
// let matrixGroq = new AiGroq();
// let matrixAiAnthropic = new AiAnthropic();
// let matrixGoogleAI = new AiAnthropic();

wss.on("connection", ws => {
  ws.on("message", async (msg) => {
    try {
      msg = JSON.parse(msg);
      if(msg.action === "aiGenGraphCall") {
        aiGenGraphCall(msg, ws);
      }
    } catch(err) {
      ws.send(JSON.stringify({ok: false, error: err.message}));
    }
  });
});

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

  const entry = path.join(PROJECTS_DIR, projectName, "app-gen.js");
  const outfile = path.join(PUBLIC_DIR, `${projectName}.js`);
  const context = await esbuild.context({
    entryPoints: [entry],
    bundle: true,
    outfile,
    format: "esm",
    sourcemap: true,
    platform: "browser",
    minify: false,
    external: ["typedoc"],
    logOverride: {
      'direct-eval': 'silent',
    }
  });
  await context.watch();
  console.log(`Watching & bundling ${projectName} → ${outfile}`);
  watchers.set(projectName, context);
  PROJECT_NAME = projectName;
  console.log(`👀 Started watcher for ${projectName}`);

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

  await ctx.dispose();
  watchers.delete(projectName);
  console.log("🛑 Watch stopped for", projectName);
  ws.send(JSON.stringify({
    name: projectName,
    ok: true,
    payload: "stop-watch done"
  }))
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

async function aiGenGraphCall(msg, ws) {
  internal_navFolder({rootFolder: PUBLIC_RES, name: "textures"}, ws).then((res) => {
    let res_list_tex = res[0];
    let res_list_obj = res[1];
    let res_list_glb = res[2];
    let res_list_mp3 = res[3];
    let res_list_mp4 = res[4];
    const listOfTexs = res_list_tex.map(t => t.relativePath).join(", ");
    const listOfObjs = res_list_obj.map(t => t.relativePath).join(", ");
    const listOfGlbs = res_list_glb.map(t => t.relativePath).join(", ");
    const listOfMp3s = res_list_mp3.map(t => t.relativePath).join(", ");
    const listOfMp4s = res_list_mp4.map(t => t.relativePath).join(", ");
    console.log('msg.prompt.provider....>>>>', msg.prompt.provider)

    if(msg.prompt.provider === 'groq') {
      msg.prompt.finalSysPrompt = AvailableResources.injectResManifest(
        SYSTEM_PROMPT, listOfTexs, listOfObjs, listOfGlbs, listOfMp3s, listOfMp4s);
      matrixGroq.aiGenGraphCall(msg.prompt).then((r) => {
        console.log('GROQ service....>>>>')
        ws.send(JSON.stringify({
          ok: true,
          aiGenGraph: 'OK',
          aiGenNodes: r
        }));
      })
    } else if(msg.prompt.provider === 'google') {
      msg.prompt.finalSysPrompt = AvailableResources.injectResManifest(
        SYSTEM_PROMPT, listOfTexs, listOfObjs, listOfGlbs, listOfMp3s, listOfMp4s);
      matrixAiAnthropic.aiGenGraphCall(msg.prompt).then((r) => {
        ws.send(JSON.stringify({
          ok: true,
          aiGenGraph: 'OK',
          aiGenNodes: r
        }));
      })
    } else if(msg.prompt.provider === 'anthropic') {
      // no free quota
      msg.prompt.finalSysPrompt = AvailableResources.injectResManifest(
        SYSTEM_PROMPT, listOfTexs, listOfObjs, listOfGlbs, listOfMp3s, listOfMp4s);
      matrixAiAnthropic.aiGenGraphCall(msg.prompt).then((r) => {
        ws.send(JSON.stringify({
          ok: true,
          aiGenGraph: 'OK',
          aiGenNodes: r
        }));
      })
    } else {
      msg.prompt.finalSysPrompt = AvailableResources.injectResManifest(
        SYSTEM_PROMPT, listOfTexs, listOfObjs, listOfGlbs, listOfMp3s, listOfMp4s);
        // no free quota at the moment 
      matrixOllama.aiGenGraphCall(msg.prompt).then((r) => {
        console.log('result ollama  ai tool service>')
        ws.send(JSON.stringify({
          ok: true,
          aiGenGraph: 'OK',
          aiGenNodes: r
        }));
      })
    }
  });
}

async function internal_navFolder(data, ws) {
  return new Promise(async (resolve, reject) => {
    if(!data.rootFolder) {reject('no root folder'); return;}
    console.log("🔨 Building resources data ..");
    const folderTex = path.join(data.rootFolder, data.name);
    const folderAudios = path.join(data.rootFolder, "audios");
    const folderVideos = path.join(data.rootFolder, "videos");
    const folderObjs = path.join(data.rootFolder, "meshes");

    // bad but still good for lazy
    let listOfPngs2 = await getAllFilenamesFrom(folderObjs, ".png")
    let listOfwebp2 = await getAllFilenamesFrom(folderObjs, ".webp")
    let listOfjpeg2 = await getAllFilenamesFrom(folderObjs, ".jpeg")

    let listOfPngs = await getAllFilenamesFrom(folderTex, ".png");
    let listOfJpgs = await getAllFilenamesFrom(folderTex, ".jpg");
    let listOfwebp = await getAllFilenamesFrom(folderTex, ".webp");
    let listOfTexures = [...listOfJpgs, ...listOfPngs, ...listOfwebp, ...listOfPngs2, ...listOfjpeg2, listOfwebp2];

    let listOfObjs = await getAllFilenamesFrom(folderObjs, ".obj")
    let listOfGlbs = await getAllFilenamesFrom(folderObjs, ".glb")
    let listOfMp3 = await getAllFilenamesFrom(folderAudios, ".mp3")
    let listOfMp4 = await getAllFilenamesFrom(folderVideos, ".mp4")
    ws.send(JSON.stringify({
      // IMPLEMENT LATER ! on front can be used for texture drop down in fcv graph.
      listAssetsForGraph: "list-assets",
      ok: true,
      rootFolder: path.join(data.rootFolder, data.name),
      resources: {
        objs: listOfObjs.map(d => ({name: d.name, relativePath: d.relativePath})),
        textures: listOfTexures.map(d => ({name: d.name, relativePath: d.relativePath})),
        glbs: listOfGlbs.map(d => ({name: d.name, relativePath: d.relativePath})),
        mp3: listOfMp3.map(d => ({name: d.name, relativePath: d.relativePath})),
        mp4: listOfMp4.map(d => ({name: d.name, relativePath: d.relativePath})),
      }
    }));
    resolve([listOfTexures, listOfObjs, listOfGlbs, listOfMp3, listOfMp4]);
  })
}

export async function getAllFilenamesFrom(dirPath, ext) {
  let results = [];
  const list = await fs.readdir(dirPath, {withFileTypes: true});
  for(const dirent of list) {
    const fullPath = path.join(dirPath, dirent.name);
    if(dirent.isDirectory()) {
      const recursiveResults = await getAllFilenamesFrom(fullPath, ext);
      results = results.concat(recursiveResults);
    } else {
      if(path.extname(dirent.name).toLowerCase() === ext.toLowerCase()) {
        results.push({
          filename: dirent.name,
          fullpath: fullPath,
          relativePath: fullPath.split('public' + path.sep).pop().replace(/\\/g, '/')
        });
      }
    }
  }
  return results;
}