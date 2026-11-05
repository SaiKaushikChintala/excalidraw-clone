import React, { useRef, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';

import type { ViewTransform } from '@/types';
import { LASER_DECAY_MS } from '@/utils/laser-trails';
import type { LaserTrailStore } from '@/utils/laser-trails';

type Props = {
  store: LaserTrailStore;
  viewTransform: ViewTransform;
};

export function LaserLayer({ store, viewTransform }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef(viewTransform);

  useEffect(() => {
    viewRef.current = viewTransform;
  }, [viewTransform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    let frame = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
    };

    const draw = () => {
      frame = 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const now = performance.now();
      store.prune(now);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { scrollX, scrollY, zoom } = viewRef.current;

      for (const trail of store.trails.values()) {
        for (const stroke of trail.strokes) {
          const input = stroke.points.map(([x, y, t]) => [
            x * zoom + scrollX,
            y * zoom + scrollY,
            Math.max(0.05, 1 - (now - t) / LASER_DECAY_MS),
          ]);
          const outline = getStroke(input, {
            size: 10,
            thinning: 0.7,
            smoothing: 0.5,
            streamline: 0.4,
            simulatePressure: false,
          });
          if (outline.length < 3) continue;

          ctx.beginPath();
          ctx.moveTo(outline[0][0], outline[0][1]);
          for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i][0], outline[i][1]);
          ctx.closePath();
          ctx.shadowColor = trail.color;
          ctx.shadowBlur = 14 * dpr;
          ctx.fillStyle = trail.color;
          ctx.fill();
        }
      }

      if (!store.isEmpty()) frame = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    const unsubscribe = store.subscribe(kick);

    return () => {
      unsubscribe();
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [store]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 7 }}
    />
  );
}
