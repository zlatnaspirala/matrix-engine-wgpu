export default [
  {
    "name": "getResultAngle",
    "code": "function getResultAngle(input) {\n  return input * 30;\n}",
    "type": "return",
    "intervalId": null
  },
  {
    "name": "neonTextEffect",
    "code": "function neonTextEffect(ctx, canvas, node) {\n  // Local state\n  const state = {\n    hue: 200,               // color hue\n    glow: 10,               // glow intensity\n    text: node.id,       // text to render\n    fontSize: 80,           // font size\n    flicker: 0.05,          // flicker probability\n  };\n\n  function helper() {\n    // clear canvas\n    ctx.clearRect(0, 0, canvas.width, canvas.height);\n\n    // flicker effect\n    const flickerOffset = Math.random() < state.flicker ? Math.random() * 50 : 0;\n\n    // neon shadow\n    ctx.shadowColor = `hsl(${state.hue}, 100%, 50%)`;\n    ctx.shadowBlur = state.glow + flickerOffset;\n\n    // font style\n    ctx.font = `${state.fontSize}px 'Arial Black', sans-serif`;\n    ctx.textAlign = \"center\";\n    ctx.textBaseline = \"middle\";\n\n    // gradient neon fill\n    const gradient = ctx.createLinearGradient(\n      canvas.width / 2 - 150, canvas.height / 2,\n      canvas.width / 2 + 150, canvas.height / 2\n    );\n    gradient.addColorStop(0, `hsl(${state.hue}, 100%, 60%)`);\n    gradient.addColorStop(0.5, `hsl(${state.hue + 50}, 100%, 70%)`);\n    gradient.addColorStop(1, `hsl(${state.hue}, 100%, 60%)`);\n\n    ctx.fillStyle = gradient;\n    ctx.fillText(state.text, canvas.width / 2, canvas.height / 2);\n\n    // optional: add glow outline\n    ctx.lineWidth = 2;\n    ctx.strokeStyle = `hsl(${state.hue}, 100%, 90%)`;\n    ctx.strokeText(state.text, canvas.width / 2, canvas.height / 2);\n\n    // update hue slowly for color cycling\n    state.hue += 0.5;\n    if (state.hue > 360) state.hue = 0;\n  }\n\n  // call helper once (graph loop will call it repeatedly)\n  helper();\n}",
    "type": "void",
    "intervalId": null
  }
];
