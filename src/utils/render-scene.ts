import rough from 'roughjs/bin/rough';
import { getStroke } from 'perfect-freehand';

import type { DrawingElement, FreeDrawElement, LinearElement, TextElement, ViewTransform } from '@/types';
import { getElementBounds, getResizeHandles, getLinearHandles, FONT_FAMILY_CSS } from '@/utils/element-utils';
import { getElementShape } from '@/utils/shape-utils';
import { HANDLE_SIZE } from '@/utils/constants';

function strokeToPath(pts: number[][]): string {
  if (!pts.length) return '';
  const d: (string | number)[] = ['M', pts[0][0], pts[0][1], 'Q'];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  d.push('Z');
  return d.join(' ');
}

function renderFreeDraw(el: FreeDrawElement, ctx: CanvasRenderingContext2D): void {
  if (el.points.length < 2) return;

  const inputPts = el.points.map(([x, y], i) => [x, y, el.pressures[i] ?? 0.5]);
  const outlinePoints = getStroke(inputPts, {
    size: el.strokeWidth * 4,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  const pathStr = strokeToPath(outlinePoints);
  const path = new Path2D(pathStr);
  ctx.fillStyle = el.strokeColor;
  ctx.fill(path);
}

function renderText(el: TextElement, ctx: CanvasRenderingContext2D): void {
  ctx.font = `${el.fontSize}px ${FONT_FAMILY_CSS[el.fontFamily] ?? FONT_FAMILY_CSS['hand-drawn']}`;
  ctx.fillStyle = el.strokeColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left';
  const anchorX =
    el.textAlign === 'center' ? el.x + el.width / 2 : el.textAlign === 'right' ? el.x + el.width : el.x;
  const lines = el.text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, anchorX, el.y + i * el.fontSize * 1.35);
  });
}

function renderElement(
  el: DrawingElement,
  rc: ReturnType<typeof rough.canvas>,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.save();
  ctx.globalAlpha = el.opacity / 100;

  if (el.type === 'freedraw') {
    renderFreeDraw(el as FreeDrawElement, ctx);
  } else if (el.type === 'text') {
    renderText(el as TextElement, ctx);
  } else if (el.type === 'line' || el.type === 'arrow') {
    const shape = getElementShape(el);
    if (shape) {
      if (Array.isArray(shape)) {
        for (const s of shape) rc.draw(s);
      } else {
        rc.draw(shape);
      }
    }
  } else {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate(el.angle);
    ctx.translate(-el.width / 2, -el.height / 2);

    const shape = getElementShape(el);
    if (shape) {
      if (Array.isArray(shape)) {
        for (const s of shape) rc.draw(s);
      } else {
        rc.draw(shape);
      }
    }
  }

  ctx.restore();
}

function renderSelectionBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  zoom: number,
): void {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-w / 2, -h / 2);

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]);
  ctx.strokeRect(0, 0, w, h);
  ctx.setLineDash([]);
  ctx.restore();

  const handles = getResizeHandles(x, y, w, h, angle, zoom);
  const size = HANDLE_SIZE / zoom;

  for (const { handle, cx: hx, cy: hy } of handles) {
    ctx.save();
    if (handle === 'rotation') {
      ctx.beginPath();
      ctx.arc(hx, hy, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5 / zoom;
      ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    }
    ctx.restore();
  }

  const topCenter = handles.find(h => h.handle === 'n');
  const rotHandle = handles.find(h => h.handle === 'rotation');
  if (topCenter && rotHandle) {
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(topCenter.cx, topCenter.cy);
    ctx.lineTo(rotHandle.cx, rotHandle.cy);
    ctx.stroke();
    ctx.restore();
  }
}

export function renderDragSelection(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  zoom: number,
): void {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  ctx.save();
  ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.restore();
}

type RenderSceneOptions = {
  elements: DrawingElement[];
  selectedIds: Set<string>;
  viewTransform: ViewTransform;
  canvas: HTMLCanvasElement;
  canvasBackground: string;
  stagingElement?: DrawingElement | null;
  dragSelection?: { x1: number; y1: number; x2: number; y2: number } | null;
  editingId?: string | null;
};

export function renderScene({
  elements,
  selectedIds,
  viewTransform,
  canvas,
  canvasBackground,
  stagingElement,
  dragSelection,
  editingId,
}: RenderSceneOptions): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { scrollX, scrollY, zoom } = viewTransform;
  const dpr = window.devicePixelRatio || 1;
  const rc = rough.canvas(canvas);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = canvasBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, scrollX * dpr, scrollY * dpr);

  for (const el of elements) {
    if (el.isDeleted) continue;
    if (el.id === editingId) continue;
    renderElement(el, rc, ctx);
  }

  if (stagingElement && !stagingElement.isDeleted) {
    renderElement(stagingElement, rc, ctx);
  }

  if (dragSelection) {
    renderDragSelection(ctx, dragSelection.x1, dragSelection.y1, dragSelection.x2, dragSelection.y2, zoom);
  }

  const selected = elements.filter(
    el => selectedIds.has(el.id) && !el.isDeleted && el.id !== editingId,
  );
  if (selected.length === 1) {
    const el = selected[0];
    const b = getElementBounds(el);
    if (el.type === 'line' || el.type === 'arrow') {
      const handles = getLinearHandles(el as LinearElement);
      const r = (HANDLE_SIZE / zoom) * 0.6;
      ctx.save();
      for (const h of handles) {
        ctx.beginPath();
        if (h.insert) {
          ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5 / zoom;
          ctx.fillRect(h.x - r, h.y - r, r * 2, r * 2);
          ctx.strokeRect(h.x - r, h.y - r, r * 2, r * 2);
        }
      }
      ctx.restore();
    } else if (el.type === 'freedraw') {
      ctx.save();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(b.x, b.y, b.width, b.height);
      ctx.setLineDash([]);
      ctx.restore();
    } else {
      renderSelectionBox(ctx, el.x, el.y, el.width, el.height, el.angle, zoom);
    }
  } else if (selected.length > 1) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of selected) {
      const b = getElementBounds(el);
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
    ctx.restore();
  }
}

