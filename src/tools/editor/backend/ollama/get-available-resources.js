export let AvailableResources = {

  injectResManifest: function(systemPrompt, rawResourceList) {
    // Process the list before injecting
    const textureFiles = rawResourceList
      .filter(res => res.name.includes('.')) // Only include files with extensions (skips folders)
      .map(res => {
        const fullPath = `${res.path}/${res.name}`.replace(/\\/g, '/');
        return fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
      });

    const formattedList = textureFiles.join(", ");
    return systemPrompt.replace("____INJECT_RES_MANIFEST____", this.constructData(formattedList));
  },

  constructData: function(textureListString) {
    return `### RESOURCE_MANIFEST
The system has access to specific local files. Use these ONLY.

[AVAILABLE_TEXTURES]
${textureListString}

[PATH_SELECTION_RULES]
1. STRICT FILENAME MATCHING: You are forbidden from inventing filenames. 
2. EXTENSION MATCHING: Ensure you use the full name including .png or .jpg.
3. SEMANTIC MAPPING: 
   - If user says "metal" or "dirty", look for "rust.jpg".
   - If user says "shiny" or "treasure", look for "gold-1.png".
   - If user says "cube face", use "cube-1.png" through "cube-4.png".
4. DEFAULT: If the visual style is unspecified, use "res/textures/default.png".
5. NEVER leave a texturePath empty if the node requires one.
`;
  }
};