import React, { useEffect, useRef } from 'react';
import { useEmberStore } from '../../store/useEmberStore';

export interface ProceduralFlameCanvasProps {
  className?: string;
  width?: number;
  height?: number;
}

interface SootParticle {
  x: number;
  y: number;
  vy: number;
  vx: number;
  alpha: number;
  size: number;
  life: number;
}

export const ProceduralFlameCanvas: React.FC<ProceduralFlameCanvasProps> = ({
  className = '',
  width = 400,
  height = 500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Gracefully handle environments without 2D canvas support (e.g. happy-dom / jsdom)
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }

    let animationFrameId: number;
    let startTime = performance.now();

    // Soot micro-particles pool (for 1g convective plume)
    const sootParticles: SootParticle[] = [];
    const MAX_SOOT = 25;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const displayWidth = rect.width || width;
      const displayHeight = rect.height || height;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      if (ctx) {
        ctx.resetTransform?.();
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      if (!ctx || !canvas) {
        // In environments where ctx is not available, keep rAF alive or exit safely
        if (typeof requestAnimationFrame === 'function') {
          animationFrameId = requestAnimationFrame(render);
        }
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width || width;
      const h = rect.height || height;
      const time = (now - startTime) / 1000;

      // Direct store state access without triggering React re-renders
      const state = useEmberStore.getState();
      const { gravity, oxygenPct, isIgnited } = state;

      // Clear previous frame
      ctx.clearRect(0, 0, w, h);

      if (!isIgnited) {
        // Render inactive nozzle tip indicator
        const cx = w / 2;
        const cy = h * 0.7;
        ctx.save();
        ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const g = Math.max(0, Math.min(1, gravity));
      const o2Factor = Math.max(0.2, oxygenPct / 21.0);

      // Flame physical dimensions
      const cx = w / 2;
      const cy = h * 0.58;
      const baseRadius = 32 * Math.sqrt(o2Factor);

      // Elongation: 1.0 (perfect sphere at 0g) to 2.6 (tall teardrop at 1g)
      const elongation = 1.0 + 1.6 * g;

      // Flicker physics:
      // ~9.6 Hz high-frequency flicker under 1g convection;
      // quiet sinusoidal ~0.6 Hz breathing at 0g (pure diffusion).
      const flicker1g =
        (Math.sin(time * 9.6 * 2 * Math.PI) * 0.06 +
          Math.sin(time * 19.2 * 2 * Math.PI) * 0.03) *
        g;
      const breathing0g = Math.sin(time * 0.6 * 2 * Math.PI) * 0.035 * (1 - g);
      const pulsation = 1.0 + flicker1g + breathing0g;

      const r = baseRadius * pulsation;

      // Color interpolation:
      // 1.00g: #FFB454 amber-orange (rgb 255, 180, 84), glowing core #FFF8DC (rgb 255, 248, 220)
      // 0.00g: #4CC9F0 cyan-blue chemiluminescence (rgb 76, 201, 240), pale core (rgb 181, 226, 250)
      const rOuter = Math.round(255 * g + 76 * (1 - g));
      const gOuter = Math.round(180 * g + 201 * (1 - g));
      const bOuter = Math.round(84 * g + 240 * (1 - g));

      const rCore = Math.round(255 * g + 181 * (1 - g));
      const gCore = Math.round(248 * g + 226 * (1 - g));
      const bCore = Math.round(220 * g + 250 * (1 - g));

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // 1. Outer ambient glow
      const glowOffsetY = -r * (elongation - 1) * 0.45;
      const glowRadius = r * (elongation * 1.5 + 0.8);
      const outerGlow = ctx.createRadialGradient(
        cx,
        cy + glowOffsetY,
        0,
        cx,
        cy + glowOffsetY,
        glowRadius
      );
      outerGlow.addColorStop(0, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.55)`);
      outerGlow.addColorStop(0.4, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.22)`);
      outerGlow.addColorStop(1, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0)`);

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + glowOffsetY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Flame body rendering
      if (g < 0.08) {
        // Zero-gravity: Perfectly round, soft luminous cyan-blue sphere with gentle breathing pulsation
        const sphereGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        sphereGrad.addColorStop(0, `rgba(${rCore}, ${gCore}, ${bCore}, 0.95)`);
        sphereGrad.addColorStop(0.5, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.8)`);
        sphereGrad.addColorStop(0.85, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.4)`);
        sphereGrad.addColorStop(1, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0)`);

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Soft outer diffusive aura
        const auraGrad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.4);
        auraGrad.addColorStop(0, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.3)`);
        auraGrad.addColorStop(1, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0)`);
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Transitional & 1g teardrop flame:
        const tipY = cy - r * elongation;
        const bottomY = cy + r * 0.75;
        const waist = r * (1.1 - 0.2 * g);
        const topRounding = r * (1.0 - g);

        ctx.beginPath();
        ctx.moveTo(cx, bottomY);
        // Right side
        ctx.bezierCurveTo(
          cx + waist * 1.25,
          cy + r * 0.3,
          cx + topRounding + waist * 0.5 * g,
          cy - r * 0.7 * g,
          cx,
          tipY
        );
        // Left side
        ctx.bezierCurveTo(
          cx - topRounding - waist * 0.5 * g,
          cy - r * 0.7 * g,
          cx - waist * 1.25,
          cy + r * 0.3,
          cx,
          bottomY
        );
        ctx.closePath();

        const flameGrad = ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy - r * (elongation - 1) * 0.3,
          r * elongation
        );
        flameGrad.addColorStop(0, `rgba(${rCore}, ${gCore}, ${bCore}, 0.95)`);
        flameGrad.addColorStop(0.35, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.85)`);
        flameGrad.addColorStop(0.75, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0.45)`);
        flameGrad.addColorStop(1, `rgba(${rOuter}, ${gOuter}, ${bOuter}, 0)`);

        ctx.fillStyle = flameGrad;
        ctx.fill();

        // 3. Glowing inner core
        const coreElongation = 1.0 + 0.8 * g;
        const coreR = r * 0.45;
        ctx.beginPath();
        ctx.ellipse(cx, cy, coreR, coreR * coreElongation, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rCore}, ${gCore}, ${bCore}, ${0.85 * (1 + flicker1g)})`;
        ctx.fill();
      }

      // 4. Convective soot plume (only when gravity > 0.2)
      if (g > 0.2) {
        if (sootParticles.length < MAX_SOOT && Math.random() < 0.45 * g) {
          sootParticles.push({
            x: cx + (Math.random() - 0.5) * r * 0.4,
            y: cy - r * elongation,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -1.2 - Math.random() * 1.8 * g,
            alpha: 0.5 + Math.random() * 0.3,
            size: 1.5 + Math.random() * 2,
            life: 0,
          });
        }

        ctx.fillStyle = 'rgba(255, 140, 50, 0.4)';
        for (let i = sootParticles.length - 1; i >= 0; i--) {
          const p = sootParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life += 1;
          p.alpha -= 0.015;

          if (p.alpha <= 0 || p.y < 0) {
            sootParticles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = `rgba(255, 170, 70, ${Math.max(0, p.alpha * g)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Clear soot when entering microgravity
        sootParticles.length = 0;
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    if (typeof requestAnimationFrame === 'function') {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="procedural-flame-canvas"
      className={`block w-full h-full max-w-full ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
};
