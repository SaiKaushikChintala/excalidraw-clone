import { RoughGenerator } from 'roughjs/bin/generator';
import type { Drawable, Options } from 'roughjs/bin/core';

import type { DrawingElement, LinearElement } from '@/types';

const rg = new RoughGenerator();

const cache = new WeakMap<DrawingElement, Drawable | Drawable[] | null>();

export function invalidateShape(el: DrawingElement): void {
  cache.delete(el);
}

function roughOptions(el: DrawingElement): Options {
  const { strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, seed } = el;

  const dashArr =
    strokeStyle === 'dashed'
      ? [8, 8 + strokeWidth]
      : strokeStyle === 'dotted'
      ? [1.5, 6 + strokeWidth]
      : undefined;

  return {
    seed,
    roughness,
    strokeWidth: strokeStyle !== 'solid' ? strokeWidth + 0.5 : strokeWidth,
    stroke: strokeColor,
    fill: backgroundColor !== 'transparent' ? backgroundColor : undefined,
    fillStyle,
    fillWeight: strokeWidth / 2,
    hachureGap: strokeWidth * 4,
    disableMultiStroke: strokeStyle !== 'solid',
    strokeLineDash: dashArr,
    preserveVertices: roughness < 1,
  };
}

function buildShape(el: DrawingElement): Drawable | Drawable[] | null {
  const opts = roughOptions(el);

  switch (el.type) {
    case 'rectangle': {
      if (el.roundness === 'round') {
        const r = Math.min(el.width, el.height) * 0.15;
        const w = el.width, h = el.height;
        const path = `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
        return rg.path(path, opts);
      }
      return rg.rectangle(0, 0, el.width, el.height, opts);
    }

    case 'ellipse':
      return rg.ellipse(el.width / 2, el.height / 2, el.width, el.height, {
        ...opts,
        curveFitting: 1,
      });

    case 'diamond': {
      const hw = el.width / 2;
      const hh = el.height / 2;
      return rg.polygon(
        [
          [hw, 0],
          [el.width, hh],
          [hw, el.height],
          [0, hh],
        ],
        opts,
      );
    }

    case 'line':
    case 'arrow': {
      const linear = el as LinearElement;
      if (linear.points.length < 2) return null;
      const shapes: Drawable[] = [];

      let pts = linear.points as [number, number][];

      if (linear.arrowType === 'elbow' && pts.length >= 2) {
        const start = pts[0];
        const end = pts[pts.length - 1];
        const midX = (start[0] + end[0]) / 2;
        pts = [start, [midX, start[1]], [midX, end[1]], end];
        for (let i = 0; i < pts.length - 1; i++) {
          shapes.push(rg.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], opts));
        }
      } else if (pts.length >= 3 && linear.arrowType === 'round') {
        shapes.push(rg.curve(pts, opts));
      } else {
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, y1] = pts[i];
          const [x2, y2] = pts[i + 1];
          shapes.push(rg.line(x1, y1, x2, y2, opts));
        }
      }

      if (el.type === 'arrow' && linear.arrowheadEnd !== 'none') {
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
        const size = Math.max(el.strokeWidth * 4, 12);
        const a1: [number, number] = [
          last[0] - size * Math.cos(angle - Math.PI / 6),
          last[1] - size * Math.sin(angle - Math.PI / 6),
        ];
        const a2: [number, number] = [
          last[0] - size * Math.cos(angle + Math.PI / 6),
          last[1] - size * Math.sin(angle + Math.PI / 6),
        ];
        const arrowOpts = { ...opts, roughness: 0, disableMultiStroke: true };
        if (linear.arrowheadEnd === 'triangle') {
          shapes.push(
            rg.polygon([[last[0], last[1]], a1, a2], {
              ...arrowOpts,
              fill: el.strokeColor,
              fillStyle: 'solid',
            }),
          );
        } else {
          shapes.push(rg.line(last[0], last[1], a1[0], a1[1], arrowOpts));
          shapes.push(rg.line(last[0], last[1], a2[0], a2[1], arrowOpts));
        }
      }

      return shapes;
    }

    case 'freedraw':
    case 'text':
      return null;
  }
}

export function getElementShape(el: DrawingElement): Drawable | Drawable[] | null {
  if (cache.has(el)) return cache.get(el)!;
  const shape = buildShape(el);
  cache.set(el, shape);
  return shape;
}
