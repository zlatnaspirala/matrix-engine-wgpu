export class METoolTip {

  constructor() {
    // --- Tooltip system ---
    const tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.padding = '6px 10px';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = '#fff';
    tooltip.style.borderRadius = '6px';
    tooltip.style.fontFamily = 'Arial';
    tooltip.style.fontSize = '12px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s ease';
    tooltip.style.zIndex = '9999';
    document.body.appendChild(tooltip);
  }

  attachTooltip(element, text) {
    element.addEventListener('mouseenter', (e) => {
      tooltip.textContent = text;
      tooltip.style.opacity = '1';
    });

    element.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.clientX + 12 + 'px';
      tooltip.style.top = e.clientY + 12 + 'px';
    });

    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

  }

}