/**
 * Lightweight, high-performance canvas confetti celebration effect
 * Zero external dependencies
 */
export function fireConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const particles: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    color: string;
    rotation: number;
    vRot: number;
    opacity: number;
  }> = [];

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 200,
      y: height * 0.5 + (Math.random() - 0.5) * 50,
      w: Math.random() * 8 + 5,
      h: Math.random() * 6 + 4,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -12 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let animationFrameId: number;
  let startTime = performance.now();

  function render(time: number) {
    const elapsed = time - startTime;
    ctx?.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // friction
      p.rotation += p.vRot;
      p.opacity = Math.max(0, 1 - elapsed / 1800);

      if (p.opacity > 0 && p.y < height + 50) {
        activeParticles++;
        if (ctx) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
    }

    if (activeParticles > 0 && elapsed < 2000) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
