const NUI_CONTAINER_STYLES = `
#nui-commander-container {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 640px;
  height: 480px;
  overflow: hidden;
  z-index: 0;
  background-color: transparent;
  color: lime;
}

#canvas-source {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
}

#canvas-blended {
  opacity: 0.5;
  position: absolute;
  top: 0px;
  left: 0;
  z-index: 1;
}
`;

function injectNuiStyles() {
  if(document.getElementById('nui-commander-styles')) return; // avoid duplicate injection

  const style = document.createElement('style');
  style.id = 'nui-commander-styles';
  style.textContent = NUI_CONTAINER_STYLES;
  document.head.appendChild(style);
}

export function createNuiContainer(hideSource = false, hideBlend = false, hideWebcam = false) {
  injectNuiStyles();

  const container = document.createElement('div');
  container.id = 'nui-commander-container';

  const webcam = document.createElement('video');
  webcam.id = 'webcam';
  webcam.autoplay = true;
  webcam.width = 640;
  webcam.height = 480;
  webcam.style.display = hideWebcam === true ? 'none' : 'block';

  const canvasSource = document.createElement('canvas');
  canvasSource.id = 'canvas-source';
  canvasSource.width = 640;
  canvasSource.height = 480;
  canvasSource.style.display = hideSource === true ? 'none' : 'block';

  const canvasBlended = document.createElement('canvas');
  canvasBlended.id = 'canvas-blended';
  canvasBlended.width = 640;
  canvasBlended.height = 480;
  canvasBlended.style.display = hideBlend === true? 'none' : 'block';

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