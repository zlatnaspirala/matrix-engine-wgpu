export let AvailableResources = {

  injectResManifest: function(systemPrompt, texs, objs, glbs, mp3, mp4) {
    return systemPrompt.replace("____INJECT_RES_MANIFEST____", this.constructData(texs, objs));
  },

  constructData: function(texs, objs, glbs , mp3, mp4) {return `### RESOURCE_MANIFEST
The system has access to specific local files. Use these ONLY.

[AVAILABLE_TEXTURES]
${texs}

[PATH_SELECTION_RULES]
1. STRICT FILENAME MATCHING: You are forbidden from inventing filenames. 
2. EXTENSION MATCHING: Ensure you use the full name including .png or .jpg.
3. SEMANTIC MAPPING: 
   - If user says "metal" or "dirty", look for "rust.jpg".
   - If user says "shiny" or "treasure", look for "gold-1.webp".
   - If user says "cube face", use "cube*.png" through "cube-4.webp".
4. DEFAULT: If the visual style is unspecified, use "res/textures/default.png".
5. NEVER leave a texturePath empty if the node requires one.

[AVAILABLE_OBJS]
${objs}

[AVAILABLE_GLB]
${glbs}

[AVAILABLE_AUDIOS]
${mp3}

[AVAILABLE_VIDEOS]
${mp4}


[PATH_SELECTION_RULES]
1. STRICT FILENAME MATCHING: You are forbidden from inventing filenames. 
2. EXTENSION MATCHING: Ensure you use the full name including .obj .
3. SEMANTIC MAPPING: 
   - If user says "slot" or "reel", look for "reel.obj".
   - If user says "cube" or "box", look for "cube.obj".
   - If user says "plane", use "plane.obj".
   - If user says vertex animate , use sufix sub look for "plane-sub64.obj".
4. DEFAULT: If the visual style is unspecified, use "res/meshes/blender/cube.obj".
5. NEVER leave a path empty if the node requires one.



`;
  }
};