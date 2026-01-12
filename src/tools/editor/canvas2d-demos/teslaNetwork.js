function teslaNetwork(ctx, canvas, arg) {

  let state = arg;

  state.mode      ??= "star";   // star | quad | ring | text
  state.segments  ??= 20;
  state.jitter    ??= 18;
  state.glow      ??= 25;
  state.hue       ??= 200;
  state.thickness ??= 2;
  state.ballRadius ??= 12;
  state.time      ??= 0;

  function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, state.ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLightning(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const dx = (x2 - x1) / state.segments;
    const dy = (y2 - y1) / state.segments;

    for (let i = 1; i < state.segments; i++) {
      const offset =
        (Math.random() - 0.5) *
        state.jitter *
        Math.sin(i * 0.6 + state.time);

      ctx.lineTo(
        x1 + dx * i + offset,
        y1 + dy * i + offset
      );
    }

    ctx.lineTo(x2, y2);

    ctx.strokeStyle = `hsla(${state.hue},100%,70%,0.9)`;
    ctx.lineWidth = state.thickness;
    ctx.shadowBlur = state.glow;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.shadowBlur = state.glow * 0.5;
    ctx.stroke();
  }

  function generatePoints() {
    const pts = [];

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (state.mode === "star") {
      const r = 120;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    }

    if (state.mode === "quad") {
      const s = 140;
      pts.push(
        [cx - s, cy - s],
        [cx + s, cy - s],
        [cx + s, cy + s],
        [cx - s, cy + s]
      );
    }

    if (state.mode === "ring") {
      const r = 160;
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    }

    if (state.mode === "text") {
      // simple letter points (example: A)
      const size = 120;
      pts.push(
        [cx, cy - size],
        [cx - size, cy + size],
        [cx + size, cy + size],
        [cx - size * 0.5, cy],
        [cx + size * 0.5, cy]
      );
    }

    return pts;
  }

  function helper() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `hsl(${state.hue},100%,70%)`;
    ctx.shadowColor = `hsl(${state.hue},100%,60%)`;

    const points = generatePoints();

    // draw balls
    for (const p of points) drawBall(p[0], p[1]);

    // connect them
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      drawLightning(a[0], a[1], b[0], b[1]);
    }

    state.time += 0.15;
    state.hue += 0.4;
    if (state.hue > 360) state.hue = 0;
  }

  helper();
}
