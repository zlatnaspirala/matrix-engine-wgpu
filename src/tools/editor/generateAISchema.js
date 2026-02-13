export function generateAISchema(nodeFactories) {
  const schema = {nodes: {}, links: [], nodeCounter: 1, linkCounter: 1, pan: [0, 0], variables: {number: {}, boolean: {}, string: {}, object: {}}};

  for(const type in nodeFactories) {
    let spec = null;

    // Simulate your post-factory options handling
    if(type === 'dynamicFunction') {
      spec = {...nodeFactories[type]("node_" + schema.nodeCounter, 0, 0, {accessObject: "USER_INPUT"})};
      if(spec.fields) spec.fields.forEach(f => f.value = f.value ?? "USER_INPUT");
    } else if(type === 'audioMP3') {
      spec = nodeFactories[type]("node_" + schema.nodeCounter, 0, 0, {name: "audioName", path: "audioPath.mp3"});
      if(spec.fields) spec.fields.forEach(f => {
        if(f.key === 'key') f.value = "audioName";
        if(f.key === 'src') f.value = "audioPath.mp3";
      });
    } else {
      spec = nodeFactories[type]("node_" + schema.nodeCounter, 0, 0);
      if(spec.fields) spec.fields.forEach(f => f.value = f.value ?? null);
    }

    // Save-ready format
    schema.nodes["node_" + schema.nodeCounter] = {
      id: "node_" + schema.nodeCounter,
      title: spec.title,
      x: spec.x,
      y: spec.y,
      category: spec.category,
      inputs: spec.inputs ?? [],
      outputs: spec.outputs ?? [],
      fields: spec.fields?.map(f => ({key: f.key, value: f.value})) ?? [],
      builtIn: spec.builtIn ?? false,
      noselfExec: spec.noselfExec ?? false,
      displayEl: {}
    };

    schema.nodeCounter++;
  }

  return schema;
}

export function generateAICatalog(factoryNodes) {
  const catalog = {};

  for(const [type, factory] of Object.entries(factoryNodes)) {
    let spec;

    try {
      // Call factory in a SAFE dummy way
      spec = factory("__ai__", 0, 0, {});
    } catch(e) {
      console.warn(`Factory ${type} skipped (needs special args)`);
      continue;
    }

    catalog[type] = {
      title: spec.title,
      category: spec.category,
      inputs: (spec.inputs || []).map(i => ({
        name: i.name,
        type: i.type
      })),
      outputs: (spec.outputs || []).map(o => ({
        name: o.name,
        type: o.type
      })),
      fields: (spec.fields || []).map(f => ({
        key: f.key,
        type: typeof f.value
      })),
      noselfExec: !!spec.noselfExec,
      builtIn: !!spec.builtIn
    };
  }

  return catalog;
}

export function catalogToText(catalog) {
  let out = "NODE CATALOG:\n\n";

  for(const [name, n] of Object.entries(catalog)) {
    out += `Node: ${name}\n`;
    out += `Category: ${n.category}\n`;

    if(n.inputs.length) {
      out += "Inputs:\n";
      for(const i of n.inputs) out += `- ${i.name} : ${i.type}\n`;
    }

    if(n.outputs.length) {
      out += "Outputs:\n";
      for(const o of n.outputs) out += `- ${o.name} : ${o.type}\n`;
    }

    if(n.fields.length) {
      out += "Fields:\n";
      for(const f of n.fields) out += `- ${f.key} : ${f.type}\n`;
    }

    if(n.noselfExec) out += "noselfExec: true\n";
    out += "\n";
  }

  return out;
}

export let tasks = [
  "On load print hello world",
  "On load create a cube named box1 at position 0 0 0",
  "Create a the labyrinth using generatorWall",
  "Set texture for floor object",
  "Create a cube and enable raycast",
  "Create 5 cubes in a row with spacing",
  "Create a pyramid of cubes with 4 levels",
  "Play mp3 audio on load",
  "Create audio reactive node from music",
  "Print beat value when detected",
  "Rotate box1 slowly on Y axis every frame",
  "Move box1 forward on Z axis over time",
  "Oscillate box1 Y position between 0 and 2",
  "Change box1 rotation using sine wave",
  "On ray hit print hit object name",
  "Apply force to hit object in ray direction",
  "Change texture of object when clicked new texture rust metal",
  "Generate random number and print it",
  "Set variable score to 0",
  "Increase score by 1 on object hit, Print score value",
  "Dispatch custom event named GAME_START",
  "After 2 seconds create a new cube",
  "Animate cube position using curve timeline",
  "Enable vertex wave animation on floor"];

export let providers = [
  "ollama",
  "groq"
];