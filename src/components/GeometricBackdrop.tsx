import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number };

/**
 * Ambient background: a slowly drifting network of connected points,
 * drawn in the primary brand color. Purely decorative.
 */
export function GeometricBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Resolve the primary color once so the canvas stays on-theme.
    const styles = getComputedStyle(document.documentElement);
    const stroke = styles.getPropertyValue("--primary").trim() || "oklch(0.686 0.163 158.2)";

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(18, Math.min(46, Math.round((width * height) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const linkDist = Math.min(190, Math.max(120, width / 7));

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          ctx.globalAlpha = (1 - dist / linkDist) * 0.32;
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.55;
      ctx.fillStyle = stroke;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(draw);
    };

    build();
    if (reduced) {
      draw();
      cancelAnimationFrame(frame);
    } else {
      frame = requestAnimationFrame(draw);
    }

    const onResize = () => {
      build();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
