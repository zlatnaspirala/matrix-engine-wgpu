function teslaLetter(ctx, canvas, arg) {

  const state = arg;

  state.char       ??= "A";
  state.fontSize   ??= 180;
  state.sampleStep ??= 8;
  state.segments   ??= 12;
  state.jitter     ??= 14;
  state.glow       ??= 20;
  state.hue        ??= 200;
  state.ballRadius ??= 5;
  state.time       ??= 0;

  // offscreen buffer (local, safe)
  const buffer = document.createElement("canvas");
  buffer.width = canvas.width;
  buffer.height = canvas.height;
  const bctx = buffer.getContext("2d");

  function getLetterPoints() {
    bctx.clearRect(0, 0, buffer.width, buffer.height);

    bctx.fillStyle = "#fff";
    bctx.font = `${state.fontSize}px Arial Black`;
    bctx.textAlign = "center";
    bctx.textBaseline = "middle";
    bctx.fillText(state.char, buffer.width / 2, buffer.height / 2);

    const img = bctx.getImageData(0, 0, buffer.width, buffer.height).data;
    const pts = [];

    for (let y = 0; y < buffer.height; y += state.sampleStep) {
      for (let x = 0; x < buffer.width; x += state.sampleStep) {
        if (img[(y * buffer.width + x) * 4 + 3] > 20) {
          pts.push([x, y]);
        }
      }
    }
    return pts;
  }

  function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, state.ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLightning(a, b) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);

    const dx = (b[0] - a[0]) / state.segments;
    const dy = (b[1] - a[1]) / state.segments;

    for (let i = 1; i < state.segments; i++) {
      const o =
        (Math.random() - 0.5) *
        state.jitter *
        Math.sin(i + state.time);

      ctx.lineTo(
        a[0] + dx * i + o,
        a[1] + dy * i + o
      );
    }

    ctx.lineTo(b[0], b[1]);

    ctx.strokeStyle = `hsla(${state.hue},100%,70%,0.9)`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = state.glow;
    ctx.stroke();
  }

  function helper() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `hsl(${state.hue},100%,70%)`;
    ctx.shadowColor = `hsl(${state.hue},100%,60%)`;

    const pts = getLetterPoints();

    // draw balls
    for (const p of pts) drawBall(p[0], p[1]);

    // lightning between near points
    for (let i = 0; i < pts.length - 1; i += 2) {
      drawLightning(pts[i], pts[i + 1]);
    }

    state.time += 0.2;
    state.hue += 0.4;
    if (state.hue > 360) state.hue = 0;
  }

  helper();
}
