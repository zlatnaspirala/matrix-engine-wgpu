function neonTextEffect(ctx, canvas, arg) {

  const state = arg;

  state.fontSize ??= 14;
  state.flicker   ??= 22;
  state.text     ??= "nidza.js";
  state.glow       ??= 25;
  state.hue        ??= 200;
 

  function helper() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const flickerOffset =
      Math.random() < state.flicker ? Math.random() * 50 : 0;

    ctx.shadowColor = `hsl(${state.hue}, 100%, 50%)`;
    ctx.shadowBlur = state.glow + flickerOffset;

    ctx.font = `${state.fontSize}px 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = String(state.text).split("\n");
    const lineHeight = state.lineHeight ?? state.fontSize * 1.2;

    const totalHeight = lines.length * lineHeight;
    let y = canvas.height / 2 - totalHeight / 2 + lineHeight / 2;

    const gradient = ctx.createLinearGradient(
      canvas.width / 2 - 150, 0,
      canvas.width / 2 + 150, 0
    );

    gradient.addColorStop(0, `hsl(${state.hue}, 100%, 60%)`);
    gradient.addColorStop(0.5, `hsl(${state.hue + 50}, 100%, 70%)`);
    gradient.addColorStop(1, `hsl(${state.hue}, 100%, 60%)`);

    ctx.fillStyle = gradient;
    ctx.lineWidth = 4;
    ctx.strokeStyle = `hsl(${state.hue}, 100%, 90%)`;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvas.width / 2, y);
      ctx.strokeText(lines[i], canvas.width / 2, y);
      y += lineHeight;
    }

    state.hue += 0.5;
    if (state.hue > 360) state.hue = 0;
  }

  helper();
}