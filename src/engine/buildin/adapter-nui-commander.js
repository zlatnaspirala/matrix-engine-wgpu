export function createNuiContainer() {
  const container = document.createElement('div');
  container.id = 'nui-commander-container';

  const webcam = document.createElement('video');
  webcam.id = 'webcam';
  webcam.autoplay = true;
  webcam.width = 640;
  webcam.height = 480;

  const canvasSource = document.createElement('canvas');
  canvasSource.id = 'canvas-source';
  canvasSource.width = 640;
  canvasSource.height = 480;

  const canvasBlended = document.createElement('canvas');
  canvasBlended.id = 'canvas-blended';
  canvasBlended.width = 640;
  canvasBlended.height = 480;
  canvasBlended.style.display = 'none';

  const xylo = document.createElement('div');
  xylo.id = 'xylo';

  container.appendChild(webcam);
  container.appendChild(canvasSource);
  container.appendChild(canvasBlended);
  container.appendChild(xylo);

  document.body.appendChild(container);

  return {
    container,
    webcam,
    canvasSource,
    canvasBlended,
    xylo
  };
}