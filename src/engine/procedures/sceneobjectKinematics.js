
export function snapRotateY(targetObject, start, end, steps = 10) {
  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    const angle = start + ((end - start) / steps) * currentStep;
    
    targetObject.setRotationY(angle);
    
    if (currentStep >= steps) clearInterval(interval);
  }, 100);
}

/**
 * Smoothly rotates the object from current rotation to a target Y rotation
 * @param {Object} targetObject - The object with the setRotationY method
 * @param {number} targetAngle - The final angle in degrees
 * @param {number} duration - Total time for the animation in milliseconds
 */
export function animateRotationY(targetObject, targetAngle, duration = 1000) {
  const startAngle = 0; // Or get the current rotation if you have a getter
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1); // Clamp to 0-1
    
    // Linear interpolation
    const currentAngle = startAngle + (targetAngle - startAngle) * progress;
    
    targetObject.setRotationY(currentAngle);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export function spiralDown(idx, startX, startY, startZ, targetX, targetY, targetZ, duration = 3.0) {
  const totalFrames = Math.round(duration * 60);
  let frame = 0;

  const interval = setInterval(() => {
    if (frame >= totalFrames) {
      clearInterval(interval);
      app.matrixPhysics.setKinematicTransform(idx, targetX, targetY, targetZ);
      return;
    }

    const t = frame / totalFrames;           // 0 → 1
    const eased = t * t * (3 - 2 * t);      // smoothstep

    // radius shrinks to 0 at center
    const radius = (1 - eased) * 2.0;
    const angle = t * Math.PI * 8;          // 4 full rotations

    const x = targetX + Math.cos(angle) * radius;
    const z = targetZ + Math.sin(angle) * radius;
    const y = startY + (targetY - startY) * eased;

    app.matrixPhysics.setKinematicTransform(idx, x, y, z);
    frame++;
  }, 1000 / 60);
}