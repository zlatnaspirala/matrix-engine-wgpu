/**
 * @description
 * Web editor backend node application.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 * @www maximumroulette.com
 */
import fs from "fs/promises";
import path from "path";
import {WebSocketServer} from "ws";

// console.log("\x1b[31m%s\x1b[0m", "Red text");
// console.log("\x1b[32m%s\x1b[0m", "Green text");
// console.log("\x1b[33m%s\x1b[0m", "Yellow text");
// console.log("\x1b[34m%s\x1b[0m", "Blue text");
// console.log("\x1b[35m%s\x1b[0m", "Magenta text");
// console.log("\x1b[36m%s\x1b[0m", "Cyan text");
// console.log("\x1b[37m%s\x1b[0m", "White text");

// matrix-engine-wgpu repo root
const ENGINE_PATH = path.resolve("../../../../");
const PUBLIC_DIR = path.join(ENGINE_PATH, "public");
const PUBLIC_RES = path.join(PUBLIC_DIR, "res");
const PROJECTS_DIR = path.join(ENGINE_PATH, "projects");

await fs.mkdir(PROJECTS_DIR, {recursive: true});

const wss = new WebSocketServer({port: 1243});

// console.log("\x1b[32m%s\x1b[0m", " Editor WS running on ws://localhost:1243 ");
console.log("\x1b[1m\x1b[92m%s\x1b[0m", " Editor WS running on ws://localhost:1243");
console.log("\x1b[92m%s\x1b[0m", "-----------------------------------------");
console.log("\x1b[93m%s\x1b[0m", "- Start you new project                 -");

wss.on("connection", ws => {
  ws.on("message", async (msg) => {
    try {
      const {cmd, payload} = JSON.parse(msg);

      console.log("CONNECTED !!!")
      if(cmd === "LIST_FOLDER") {
        const rel = payload.path || "";
        const folder = path.join(PUBLIC_RES, rel);
        const items = await fs.readdir(folder, {withFileTypes: true});
        ws.send(JSON.stringify({
          cmd,
          ok: true,
          payload: items.map(d => ({
            name: d.name,
            isDir: d.isDirectory()
          }))
        }));
      }

      if(cmd === "CREATE_OBJECT") {
        const name = payload.name || "obj";
        const id = `${name}-${Math.random().toString(36).substring(2, 8)}`;
        const objFolder = path.join(PUBLIC_RES, "objects", id);

        await fs.mkdir(objFolder, {recursive: true});
        await fs.writeFile(
          path.join(objFolder, "meta.json"),
          JSON.stringify({id, name}, null, 2)
        );

        ws.send(JSON.stringify({
          cmd,
          ok: true,
          payload: {
            id,
            path: path.relative(PUBLIC_RES, objFolder)
          }
        }));
      }

      if(cmd === "SAVE_PROJECT") {
        const project = payload.project;
        const projectFolder = path.join(PROJECTS_DIR, project.projectName);
        const projectPublic = path.join(projectFolder, "public");
        const projectRes = path.join(projectPublic, "res");

        // create directories
        await fs.mkdir(projectRes, {recursive: true});

        // native Node recursive copy (no fs-extra)
        await fs.cp(PUBLIC_DIR, projectPublic, {
          recursive: true,
          force: true
        });

        // write project JSON
        await fs.mkdir(path.join(projectFolder, "src"), {recursive: true});
        await fs.writeFile(
          path.join(projectFolder, "src", "scene.json"),
          JSON.stringify(project, null, 2)
        );

        ws.send(JSON.stringify({
          cmd,
          ok: true,
          payload: {projectFolder}
        }));
      }

    } catch(err) {
      ws.send(JSON.stringify({ok: false, error: err.message}));
    }
  });
});