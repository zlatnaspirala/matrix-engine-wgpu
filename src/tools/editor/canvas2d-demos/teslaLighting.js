export function teslaLightning(ctx, canvas, arg) {

  const state = arg;

  // defaults (safe for node graphs)
  state.leftX  ??= canvas.width * 0.25;
  state.leftY  ??= canvas.height * 0.5;
  state.rightX ??= canvas.width * 0.75;
  state.rightY ??= canvas.height * 0.5;

  state.ballRadius ??= 14;
  state.segments   ??= 22;
  state.jitter     ??= 18;
  state.glow       ??= 25;
  state.hue        ??= 200;
  state.thickness  ??= 2;
  state.time       ??= 0;

  function helper() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // === DRAW BALLS ===
    ctx.shadowBlur = state.glow;
    ctx.shadowColor = `hsl(${state.hue},100%,60%)`;

    ctx.fillStyle = `hsl(${state.hue},100%,70%)`;

    ctx.beginPath();
    ctx.arc(state.leftX, state.leftY, state.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(state.rightX, state.rightY, state.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // === LIGHTNING PATH ===
    ctx.beginPath();

    let x1 = state.leftX;
    let y1 = state.leftY;
    let x2 = state.rightX;
    let y2 = state.rightY;

    const dx = (x2 - x1) / state.segments;
    const dy = (y2 - y1) / state.segments;

    ctx.moveTo(x1, y1);

    for (let i = 1; i < state.segments; i++) {
      const offset =
        (Math.random() - 0.5) * state.jitter *
        Math.sin(i * 0.5 + state.time);

      const nx = x1 + dx * i + offset;
      const ny = y1 + dy * i + offset;

      ctx.lineTo(nx, ny);
    }

    ctx.lineTo(x2, y2);

    // === LIGHTNING STYLE ===
    ctx.strokeStyle = `hsla(${state.hue},100%,70%,0.9)`;
    ctx.lineWidth = state.thickness;
    ctx.shadowBlur = state.glow;
    ctx.stroke();

    // === CORE (HOT CENTER LINE) ===
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = state.glow * 0.5;
    ctx.stroke();

    // animate
    state.time += 0.15;
    state.hue += 0.3;
    if (state.hue > 360) state.hue = 0;
  }

  helper();
}
