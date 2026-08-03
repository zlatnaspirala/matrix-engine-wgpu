import path from "path";
import fs from "fs/promises";
import {WebSocketServer} from "ws";

/**
 * @description
 * NodeJS backend for the-beast-code-creator
 * @note
 * This is node.js script.
 * Use same port (1243) like visual scripting ai node generato part.
 * Cant be run in same time.
 */

const ENGINE_PATH = path.resolve("../../../");
const PUBLIC_DIR = path.join(ENGINE_PATH, "public");
const PUBLIC_RES = path.join(PUBLIC_DIR, "res");

import {AiOllama} from "./ollama.js";
import {AvailableResources} from "./get-available-resources.js";
import {SYSTEM_PROMPT} from "./prompt.js";
import {AiGroq} from "./groq/groq.js";
import {AiAnthropic} from "./ai-anthropic/ai-anthropic.js";

const wss = new WebSocketServer({port: 1243});

const useResourcesListInPrompt = 'no';
console.log("\x1b[1m\x1b[92m%s\x1b[0m", " Editorx websock running on ws://localhost:1243");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[93m%s\x1b[0m", "- The Beast Code Creator                  -");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[93m%s\x1b[0m", "- Make task and get code/project          -");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");
console.log("\x1b[92m%s\x1b[0m", "- Default ai platform: Ollama             -");
console.log("\x1b[92m%s\x1b[0m", "- + Groq                                  -");
console.log("\x1b[92m%s\x1b[0m", "- + Anthropic                             -");
console.log("\x1b[92m%s\x1b[0m", "------------------------------------------");

console.log("\x1b[92m%s\x1b[0m", `Resources (media) prompt: ${useResourcesListInPrompt}    -`);

let matrixOllama = new AiOllama();
let matrixGroq = new AiGroq();
let matrixAiAnthropic = new AiAnthropic();
// let matrixGoogleAI = new AiAnthropic();

wss.on("connection", ws => {
  ws.on("message", async (msg) => {
    try {
      msg = JSON.parse(msg);
      if(msg.action === "aiGenGraphCall") {
        aiGenGraphCall(msg, ws);
      } else if(msg.action === "nav-folder") {
        console.log("nav-folder [WATCH]");
        navFolder(msg, ws);
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
      }
    } catch(err) {
      ws.send(JSON.stringify({ok: false, error: err.message}));
    }
  });
});

// G:\web_server\xampp\htdocs\PRIVATE_SERVER\me\meGPU\matrix-engine-wgpu\public

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

    if(msg.prompt.provider === 'groq') {
      msg.prompt.finalSysPrompt = AvailableResources.injectResManifest(
        SYSTEM_PROMPT, listOfTexs, listOfObjs, listOfGlbs, listOfMp3s, listOfMp4s);
      matrixGroq.aiGenGraphCall(msg.prompt).then((r) => {
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

      if(useResourcesListInPrompt === 'yes') {
        msg.prompt.finalSysPrompt = AvailableResources.injectResManifest(
          SYSTEM_PROMPT, listOfTexs, listOfObjs, listOfGlbs, listOfMp3s, listOfMp4s);
      } else {
        msg.prompt.finalSysPrompt = SYSTEM_PROMPT;
      }

      matrixOllama.aiGenGraphCall(msg.prompt).then((r) => {
        console.log('ollama claude call.')
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
      listAssets: "list-assets",
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

async function navFolder(data, ws) {
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