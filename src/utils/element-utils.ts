import type {
  DrawingElement,
  LinearElement,
  FreeDrawElement,
  ViewTransform,
  ResizeHandle,
  LinearHandle,
} from '@/types';
import { HANDLE_SIZE, ROTATION_HANDLE_OFFSET, SELECTION_THRESHOLD } from '@/utils/constants';

export function clientToScene(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  { scrollX, scrollY, zoom }: ViewTransform,
): [number, number] {
  const cssX = clientX - canvasRect.left;
  const cssY = clientY - canvasRect.top;
  return [(cssX - scrollX) / zoom, (cssY - scrollY) / zoom];
}

export function getElementBounds(el: DrawingElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') {
    const pts = (el as LinearElement | FreeDrawElement).points;
    if (!pts.length) return { x: el.x, y: el.y, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of pts) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height };
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function pointInAABB(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

export function hitTestElement(
  el: DrawingElement,
  px: number,
  py: number,
  zoom: number,
): boolean {
  const threshold = SELECTION_THRESHOLD / zoom;

  if (el.type === 'freedraw') {
    const pts = (el as FreeDrawElement).points;
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < threshold) {
        return true;
      }
    }
    return false;
  }

  if (el.type === 'line' || el.type === 'arrow') {
    const pts = (el as LinearElement).points;
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]) < threshold) {
        return true;
      }
    }
    return false;
  }

  if (el.type === 'text') {
    return pointInAABB(px, py, el.x, el.y, el.width, el.height);
  }

  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const cos = Math.cos(-el.angle);
  const sin = Math.sin(-el.angle);
  const dx = px - cx;
  const dy = py - cy;
  const localX = cos * dx - sin * dy + cx;
  const localY = sin * dx + cos * dy + cy;

  const { x, y, width, height } = el;

  if (el.type === 'ellipse') {
    const rx = width / 2;
    const ry = height / 2;
    const elCx = x + rx;
    const elCy = y + ry;
    const nx = (localX - elCx) / (rx + threshold);
    const ny = (localY - elCy) / (ry + threshold);
    return nx * nx + ny * ny <= 1;
  }

  if (el.type === 'diamond') {
    const hw = width / 2 + threshold;
    const hh = height / 2 + threshold;
    const elCx = x + width / 2;
    const elCy = y + height / 2;
    const nx = Math.abs(localX - elCx) / hw;
    const ny = Math.abs(localY - elCy) / hh;
    return nx + ny <= 1;
  }

  return pointInAABB(localX, localY, x - threshold, y - threshold, width + 2 * threshold, height + 2 * threshold);
}

export function getElementAtPoint(
  elements: DrawingElement[],
  px: number,
  py: number,
  zoom: number,
): DrawingElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.isDeleted) continue;
    if (hitTestElement(el, px, py, zoom)) return el;
  }
  return null;
}

export function getElementsInRect(
  elements: DrawingElement[],
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): DrawingElement[] {
  const x1 = Math.min(rx, rx + rw);
  const y1 = Math.min(ry, ry + rh);
  const x2 = Math.max(rx, rx + rw);
  const y2 = Math.max(ry, ry + rh);
  return elements.filter((el) => {
    if (el.isDeleted) return false;
    const b = getElementBounds(el);
    return b.x >= x1 && b.y >= y1 && b.x + b.width <= x2 && b.y + b.height <= y2;
  });
}

export function getResizeHandles(
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  zoom: number,
): Array<{ handle: ResizeHandle; cx: number; cy: number }> {
  const hw = w / 2;
  const hh = h / 2;
  const cx = x + hw;
  const cy = y + hh;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rotate = (lx: number, ly: number): [number, number] => {
    const dx = lx - cx;
    const dy = ly - cy;
    return [cx + cos * dx - sin * dy, cy + sin * dx + cos * dy];
  };

  const corners: Array<[ResizeHandle, number, number]> = [
    ['nw', x, y],
    ['n', x + hw, y],
    ['ne', x + w, y],
    ['e', x + w, y + hh],
    ['se', x + w, y + h],
    ['s', x + hw, y + h],
    ['sw', x, y + h],
    ['w', x, y + hh],
  ];

  const handles = corners.map(([handle, lx, ly]) => {
    const [rx, ry] = rotate(lx, ly);
    return { handle, cx: rx, cy: ry };
  });

  const [rcx, rcy] = rotate(x + hw, y - ROTATION_HANDLE_OFFSET / zoom);
  handles.push({ handle: 'rotation', cx: rcx, cy: rcy });

  return handles;
}

export function getHitHandle(
  handles: Array<{ handle: ResizeHandle; cx: number; cy: number }>,
  px: number,
  py: number,
  zoom: number,
): ResizeHandle | null {
  const size = HANDLE_SIZE / zoom;
  for (const { handle, cx, cy } of handles) {
    if (Math.hypot(px - cx, py - cy) <= size) return handle;
  }
  return null;
}

export function getLinearHandles(el: LinearElement): LinearHandle[] {
  const pts = el.points;
  const handles: LinearHandle[] = pts.map((p, i) => ({
    x: p[0],
    y: p[1],
    pointIndex: i,
    insert: false,
  }));
  if (pts.length === 2) {
    handles.push({
      x: (pts[0][0] + pts[1][0]) / 2,
      y: (pts[0][1] + pts[1][1]) / 2,
      pointIndex: 1,
      insert: true,
    });
  }
  return handles;
}

export function getHitLinearHandle(
  el: LinearElement,
  px: number,
  py: number,
  zoom: number,
): LinearHandle | null {
  const size = HANDLE_SIZE / zoom;
  const handles = getLinearHandles(el);
  for (const h of handles) {
    if (!h.insert && Math.hypot(px - h.x, py - h.y) <= size) return h;
  }
  for (const h of handles) {
    if (h.insert && Math.hypot(px - h.x, py - h.y) <= size) return h;
  }
  return null;
}

export const FONT_FAMILY_CSS: Record<string, string> = {
  'hand-drawn': 'Virgil, cursive',
  normal: 'Helvetica, Arial, sans-serif',
  code: 'Cascadia, monospace',
};

export function measureText(
  text: string,
  fontSize: number,
  ctx: CanvasRenderingContext2D,
  fontFamily: string = 'hand-drawn',
): { width: number; height: number } {
  ctx.save();
  ctx.font = `${fontSize}px ${FONT_FAMILY_CSS[fontFamily] ?? FONT_FAMILY_CSS['hand-drawn']}`;
  const lines = text.split('\n');
  let maxWidth = 0;
  for (const line of lines) {
    const m = ctx.measureText(line || ' ');
    if (m.width > maxWidth) maxWidth = m.width;
  }
  ctx.restore();
  return { width: Math.max(maxWidth, fontSize), height: lines.length * fontSize * 1.35 };
}

let _measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (_measureCtx) return _measureCtx;
  if (typeof document === 'undefined') return null;
  _measureCtx = document.createElement('canvas').getContext('2d');
  return _measureCtx;
}

export function recomputeTextSize<T extends { type: string }>(el: T): T {
  if (el.type !== 'text') return el;
  const ctx = getMeasureCtx();
  if (!ctx) return el;
  const te = el as unknown as { text: string; fontSize: number; fontFamily: string; width: number; height: number };
  const dims = measureText(te.text || ' ', te.fontSize, ctx, te.fontFamily);
  return { ...el, width: dims.width, height: dims.height };
}

export function getNewZoom(
  currentZoom: number,
  delta: number,
  centerX: number,
  centerY: number,
  scrollX: number,
  scrollY: number,
  minZoom: number,
  maxZoom: number,
): { zoom: number; scrollX: number; scrollY: number } {
  const newZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom * (1 - delta * 0.001)));
  const newScrollX = centerX - ((centerX - scrollX) / currentZoom) * newZoom;
  const newScrollY = centerY - ((centerY - scrollY) / currentZoom) * newZoom;
  return { zoom: newZoom, scrollX: newScrollX, scrollY: newScrollY };
}
