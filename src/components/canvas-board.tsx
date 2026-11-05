import React, {
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { getStroke } from 'perfect-freehand';

import type {
  DrawingElement,
  AppState,
  LinearElement,
  FreeDrawElement,
  TextElement,
  ResizeHandle,
  RemoteSelection,
  ViewTransform,
} from '@/types';
import {
  clientToScene,
  getElementAtPoint,
  getElementsInRect,
  getResizeHandles,
  getHitHandle,
  getHitLinearHandle,
  getElementBounds,
  measureText,
  getNewZoom,
  FONT_FAMILY_CSS,
} from '@/utils/element-utils';
import { renderScene } from '@/utils/render-scene';
import { invalidateShape } from '@/utils/shape-utils';
import {
  newRectangle,
  newEllipse,
  newDiamond,
  newLinear,
  newFreeDraw,
  newText,
  generateId,
  generateSeed,
} from '@/utils/new-element';
import { MIN_ZOOM, MAX_ZOOM, DRAG_THRESHOLD } from '@/utils/constants';

const TRAIL_DECAY_MS = 200;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function strokeToSvgPath(stroke: number[][]): string {
  const n = stroke.length;
  if (n < 4) return '';
  let a = stroke[0];
  let b = stroke[1];
  const c = stroke[2];
  let d =
    `M${a[0].toFixed(1)},${a[1].toFixed(1)} ` +
    `Q${b[0].toFixed(1)},${b[1].toFixed(1)} ` +
    `${((b[0] + c[0]) / 2).toFixed(1)},${((b[1] + c[1]) / 2).toFixed(1)} T`;
  for (let i = 2; i < n - 1; i++) {
    a = stroke[i];
    b = stroke[i + 1];
    d += `${((a[0] + b[0]) / 2).toFixed(1)},${((a[1] + b[1]) / 2).toFixed(1)} `;
  }
  return d + 'Z';
}

type Interaction =
  | { type: 'idle' }
  | {
      type: 'drawing';
      element: DrawingElement;
      startX: number;
      startY: number;
    }
  | {
      type: 'moving';
      elementIds: string[];
      startX: number;
      startY: number;
      originals: Map<string, DrawingElement>;
    }
  | {
      type: 'resizing';
      elementId: string;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      original: DrawingElement;
      snapshot: DrawingElement[];
    }
  | {
      type: 'rotating';
      elementId: string;
      center: { x: number; y: number };
      startAngle: number;
      originalAngle: number;
      snapshot: DrawingElement[];
    }
  | {
      type: 'selecting';
      startX: number;
      startY: number;
      x: number;
      y: number;
    }
  | {
      type: 'panning';
      startX: number;
      startY: number;
      startScrollX: number;
      startScrollY: number;
    }
  | {
      type: 'erasing';
      snapshot: DrawingElement[];
    }
  | {
      type: 'linearPoint';
      elementId: string;
      pointIndex: number;
      snapshot: DrawingElement[];
    }
  | { type: 'laser' };

type Props = {
  elements: DrawingElement[];
  appState: AppState;
  onElementsChange: React.Dispatch<React.SetStateAction<DrawingElement[]>>;
  onAppStateChange: (updates: Partial<AppState>) => void;
  onCommitHistory: (snapshot: DrawingElement[]) => void;
  onPointerScenePosition?: (x: number, y: number) => void;
  onLaserPoint?: (x: number, y: number) => void;
  onLaserEnd?: () => void;
  remoteSelections?: RemoteSelection[];
  remoteDrafts?: DrawingElement[];
  onDraft?: (el: DrawingElement | null) => void;
};

export function CanvasBoard({
  elements,
  appState,
  onElementsChange,
  onAppStateChange,
  onCommitHistory,
  onPointerScenePosition,
  onLaserPoint,
  onLaserEnd,
  remoteSelections,
  remoteDrafts,
  onDraft,
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<Interaction>({ type: 'idle' });
  const stagingRef = useRef<DrawingElement | null>(null);
  const dragSelRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const rafRef = useRef<number>(0);
  const eraserCursorRef = useRef<HTMLDivElement>(null);
  const eraserDidEraseRef = useRef(false);
  const trailPtsRef = useRef<[number, number, number][]>([]);
  const trailPathRef = useRef<SVGPathElement>(null);
  const trailAnimRef = useRef<number>(0);
  const trailActiveRef = useRef(false);

  const elementsRef = useRef(elements);
  const remoteSelectionsRef = useRef<RemoteSelection[]>([]);
  const remoteDraftsRef = useRef<DrawingElement[]>([]);
  const touchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureActiveRef = useRef(false);
  const lastTouchAtRef = useRef(0);
  const gestureStartRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    view: ViewTransform;
  } | null>(null);
  const appStateRef = useRef(appState);
  const commitTextEditRef = useRef<() => void>(() => {});
  const linearDragRef = useRef<{ id: string; pts: Array<[number, number]>; pointIndex: number } | null>(null);
  const clipboardRef = useRef<DrawingElement[]>([]);
  const pasteOffsetRef = useRef(0);

  const scheduleRender = useCallback((): void => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderScene({
        elements: elementsRef.current,
        selectedIds: appStateRef.current.selectedElementIds,
        viewTransform: appStateRef.current.viewTransform,
        canvas,
        canvasBackground: appStateRef.current.canvasBackground,
        stagingElement: stagingRef.current,
        dragSelection: dragSelRef.current,
        editingId: appStateRef.current.editingElementId,
        remoteSelections: remoteSelectionsRef.current,
        remoteDrafts: remoteDraftsRef.current,
      });
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = wrap;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      scheduleRender();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    return () => ro.disconnect();
  }, [scheduleRender]);

  useEffect(() => {
    elementsRef.current = elements;
    appStateRef.current = appState;
    scheduleRender();
  }, [elements, appState, scheduleRender]);

  useEffect(() => {
    remoteSelectionsRef.current = remoteSelections ?? [];
    scheduleRender();
  }, [remoteSelections, scheduleRender]);

  useEffect(() => {
    remoteDraftsRef.current = remoteDrafts ?? [];
    scheduleRender();
  }, [remoteDrafts, scheduleRender]);

  const runTrailFrame = useCallback((): void => {
    function step() {
      const pathEl = trailPathRef.current;
      if (!pathEl) return;

      const now = performance.now();
      trailPtsRef.current = trailPtsRef.current.filter(([, , t]) => now - t < TRAIL_DECAY_MS);

      if (trailPtsRef.current.length < 2) {
        pathEl.setAttribute('d', '');
        if (trailActiveRef.current) {
          trailAnimRef.current = requestAnimationFrame(step);
        }
        return;
      }

      const pts = trailPtsRef.current.map(([x, y, t], i, arr) => {
        const ageFactor = Math.max(0, 1 - (now - t) / TRAIL_DECAY_MS);
        const posFactor = (i + 1) / arr.length;
        return [x, y, Math.min(easeOut(posFactor), easeOut(ageFactor))];
      });

      const stroke = getStroke(pts, {
        size: 10,
        thinning: 0.65,
        smoothing: 0.5,
        streamline: 0.3,
        easing: easeOut,
        simulatePressure: false,
      });

      pathEl.setAttribute('d', strokeToSvgPath(stroke));
      trailAnimRef.current = requestAnimationFrame(step);
    }
    step();
  }, []);

  useEffect(() => {
    return () => { cancelAnimationFrame(trailAnimRef.current); };
  }, []);

  const toScene = useCallback((clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return clientToScene(clientX, clientY, rect, appStateRef.current.viewTransform);
  }, []);

  const deleteSelected = useCallback((): void => {
    const { selectedElementIds } = appStateRef.current;
    if (!selectedElementIds.size) return;
    onCommitHistory(elementsRef.current);
    onElementsChange(
      elementsRef.current.map(el =>
        selectedElementIds.has(el.id) ? { ...el, isDeleted: true } : el,
      ),
    );
    onAppStateChange({ selectedElementIds: new Set() });
  }, [onElementsChange, onAppStateChange, onCommitHistory]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;

      if (e.code === 'Space') {
        spaceHeldRef.current = true;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
        return;
      }

      if (e.key === 'Escape') {
        onAppStateChange({ selectedElementIds: new Set() });
        if (appStateRef.current.editingElementId) {
          onAppStateChange({ editingElementId: null });
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const ids = elementsRef.current.filter(el => !el.isDeleted).map(el => el.id);
        onAppStateChange({ activeTool: 'select', selectedElementIds: new Set(ids) });
        return;
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'q') {
        onAppStateChange({ toolLocked: !appStateRef.current.toolLocked });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const ids = appStateRef.current.selectedElementIds;
        if (!ids.size) return;
        clipboardRef.current = elementsRef.current.filter(el => ids.has(el.id) && !el.isDeleted);
        pasteOffsetRef.current = 0;
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const clipboard = clipboardRef.current;
        if (!clipboard.length) return;
        pasteOffsetRef.current += 10;
        const off = pasteOffsetRef.current;
        const newEls: DrawingElement[] = clipboard.map(el => {
          const pasted = { ...el, id: generateId(), seed: generateSeed(), x: el.x + off, y: el.y + off };
          if (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') {
            (pasted as LinearElement | FreeDrawElement).points = (el as LinearElement | FreeDrawElement).points.map(
              ([px, py]) => [px + off, py + off] as [number, number],
            );
          }
          return pasted;
        });
        onCommitHistory(elementsRef.current);
        onElementsChange(prev => [...prev, ...newEls]);
        onAppStateChange({ selectedElementIds: new Set(newEls.map(el => el.id)), activeTool: 'select' });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        const { zoom, scrollX, scrollY } = appStateRef.current.viewTransform;
        onAppStateChange({ viewTransform: getNewZoom(zoom, -100, window.innerWidth / 2, window.innerHeight / 2, scrollX, scrollY, MIN_ZOOM, MAX_ZOOM) });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        const { zoom, scrollX, scrollY } = appStateRef.current.viewTransform;
        onAppStateChange({ viewTransform: getNewZoom(zoom, 100, window.innerWidth / 2, window.innerHeight / 2, scrollX, scrollY, MIN_ZOOM, MAX_ZOOM) });
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        onAppStateChange({ viewTransform: { scrollX: 0, scrollY: 0, zoom: 1 } });
        return;
      }

      const toolMap: Record<string, string> = {
        h: 'hand', v: 'select', r: 'rectangle', d: 'diamond',
        o: 'ellipse', a: 'arrow', l: 'line', p: 'freedraw', t: 'text', e: 'eraser', k: 'laser',
        '1': 'select', '2': 'rectangle', '3': 'diamond', '4': 'ellipse',
        '5': 'arrow', '6': 'line', '7': 'freedraw', '8': 'text', '0': 'eraser',
      };
      if (!e.ctrlKey && !e.metaKey && !e.altKey && toolMap[e.key]) {
        onAppStateChange({ activeTool: toolMap[e.key] as AppState['activeTool'] });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [deleteSelected, onAppStateChange, onElementsChange, onCommitHistory]);

  const cancelInteraction = useCallback((): void => {
    const current = interactionRef.current;
    if (current.type === 'drawing') {
      stagingRef.current = null;
      onDraft?.(null);
    }
    if (current.type === 'selecting') dragSelRef.current = null;
    if (current.type === 'erasing') trailActiveRef.current = false;
    if (current.type === 'laser') onLaserEnd?.();
    interactionRef.current = { type: 'idle' };
    scheduleRender();
  }, [onLaserEnd, onDraft, scheduleRender]);

  const readGesture = useCallback((): { dist: number; midX: number; midY: number } | null => {
    const canvas = canvasRef.current;
    const points = [...touchPointsRef.current.values()];
    if (!canvas || points.length < 2) return null;
    const rect = canvas.getBoundingClientRect();
    const [a, b] = points;
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      midX: (a.x + b.x) / 2 - rect.left,
      midY: (a.y + b.y) / 2 - rect.top,
    };
  }, []);

  const beginGesture = useCallback((): void => {
    const reading = readGesture();
    if (!reading) return;
    gestureStartRef.current = { ...reading, view: appStateRef.current.viewTransform };
  }, [readGesture]);

  const updateGesture = useCallback((): void => {
    const start = gestureStartRef.current;
    const now = readGesture();
    if (!start || !now || start.dist < 1) return;
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, start.view.zoom * (now.dist / start.dist)));
    const sceneX = (start.midX - start.view.scrollX) / start.view.zoom;
    const sceneY = (start.midY - start.view.scrollY) / start.view.zoom;
    onAppStateChange({
      viewTransform: { zoom, scrollX: now.midX - sceneX * zoom, scrollY: now.midY - sceneY * zoom },
    });
  }, [readGesture, onAppStateChange]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const nowMs = performance.now();
      if (e.pointerType !== 'touch' || nowMs - lastTouchAtRef.current > 2000) {
        touchPointsRef.current.clear();
        gestureActiveRef.current = false;
        gestureStartRef.current = null;
      }

      if (e.pointerType === 'touch') {
        lastTouchAtRef.current = nowMs;
        touchPointsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touchPointsRef.current.size >= 2) {
          canvasRef.current?.setPointerCapture(e.pointerId);
          e.preventDefault();
          if (!gestureActiveRef.current) {
            gestureActiveRef.current = true;
            cancelInteraction();
          }
          beginGesture();
          return;
        }
        if (gestureActiveRef.current) return;
      }

      if (e.button !== 0 && e.button !== 1) return;

      if (appStateRef.current.editingElementId) {
        commitTextEditRef.current();
        return;
      }

      canvasRef.current?.setPointerCapture(e.pointerId);
      e.preventDefault();

      const [sx, sy] = toScene(e.clientX, e.clientY);
      const state = appStateRef.current;
      const hitZoom = e.pointerType === 'touch' ? state.viewTransform.zoom / 2.5 : state.viewTransform.zoom;

      if (e.button === 1 || spaceHeldRef.current || state.activeTool === 'hand') {
        interactionRef.current = {
          type: 'panning',
          startX: e.clientX,
          startY: e.clientY,
          startScrollX: state.viewTransform.scrollX,
          startScrollY: state.viewTransform.scrollY,
        };
        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
        return;
      }

      const tool = state.activeTool;

      if (tool === 'laser') {
        interactionRef.current = { type: 'laser' };
        onLaserPoint?.(sx, sy);
        return;
      }

      if (tool === 'select') {
        if (state.selectedElementIds.size === 1) {
          const [selId] = [...state.selectedElementIds];
          const selEl = elementsRef.current.find(el => el.id === selId && !el.isDeleted);

          if (selEl && (selEl.type === 'line' || selEl.type === 'arrow')) {
            const linEl = selEl as LinearElement;
            const h = getHitLinearHandle(linEl, sx, sy, hitZoom);
            if (h) {
              let pts: Array<[number, number]> = linEl.points.map(p => [p[0], p[1]]);
              if (h.insert) {
                pts = [...pts.slice(0, h.pointIndex), [sx, sy], ...pts.slice(h.pointIndex)];
              }
              linearDragRef.current = { id: selId, pts, pointIndex: h.pointIndex };

              if (h.insert) {
                let target = { ...linEl, points: pts } as LinearElement;
                const b = getElementBounds(target);
                target = { ...target, x: b.x, y: b.y, width: b.width, height: b.height };
                invalidateShape(target);
                onElementsChange(els => els.map(el => (el.id === selId ? target : el)));
              }
              interactionRef.current = {
                type: 'linearPoint',
                elementId: selId,
                pointIndex: h.pointIndex,
                snapshot: [...elementsRef.current],
              };
              return;
            }
          }

          if (selEl && selEl.type !== 'line' && selEl.type !== 'arrow' && selEl.type !== 'freedraw') {
            const handles = getResizeHandles(
              selEl.x, selEl.y, selEl.width, selEl.height, selEl.angle,
              state.viewTransform.zoom,
            );
            const hit = getHitHandle(handles, sx, sy, hitZoom);
            if (hit) {
              if (hit === 'rotation') {
                const center = { x: selEl.x + selEl.width / 2, y: selEl.y + selEl.height / 2 };
                interactionRef.current = {
                  type: 'rotating',
                  elementId: selId,
                  center,
                  startAngle: Math.atan2(sy - center.y, sx - center.x),
                  originalAngle: selEl.angle,
                  snapshot: [...elementsRef.current],
                };
              } else {
                interactionRef.current = {
                  type: 'resizing',
                  elementId: selId,
                  handle: hit,
                  startX: sx,
                  startY: sy,
                  original: selEl,
                  snapshot: [...elementsRef.current],
                };
              }
              return;
            }
          }
        }

        const hit = getElementAtPoint(elementsRef.current, sx, sy, hitZoom);

        if (hit) {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            const next = new Set(state.selectedElementIds);
            if (next.has(hit.id)) next.delete(hit.id);
            else next.add(hit.id);
            onAppStateChange({ selectedElementIds: next });
          } else {
            if (!state.selectedElementIds.has(hit.id)) {
              onAppStateChange({ selectedElementIds: new Set([hit.id]) });
            }

            const ids = state.selectedElementIds.has(hit.id)
              ? [...state.selectedElementIds]
              : [hit.id];

            const originals = new Map<string, DrawingElement>();
            for (const id of ids) {
              const el = elementsRef.current.find(el => el.id === id);
              if (el) originals.set(id, el);
            }

            interactionRef.current = {
              type: 'moving',
              elementIds: ids,
              startX: sx,
              startY: sy,
              originals,
            };
          }
        } else {
          onAppStateChange({ selectedElementIds: new Set() });
          interactionRef.current = { type: 'selecting', startX: sx, startY: sy, x: sx, y: sy };
          dragSelRef.current = { x1: sx, y1: sy, x2: sx, y2: sy };
        }
        return;
      }

      if (tool === 'eraser') {
        eraserDidEraseRef.current = false;
        const snapshot = [...elementsRef.current];
        const hit = getElementAtPoint(elementsRef.current, sx, sy, hitZoom);
        if (hit && !hit.isDeleted) {
          eraserDidEraseRef.current = true;
          onElementsChange(
            elementsRef.current.map(el => (el.id === hit.id ? { ...el, isDeleted: true } : el)),
          );
        }
        trailActiveRef.current = true;
        trailPtsRef.current = [];
        if (wrapRef.current) {
          const rect = wrapRef.current.getBoundingClientRect();
          trailPtsRef.current.push([e.clientX - rect.left, e.clientY - rect.top, performance.now()]);
        }
        cancelAnimationFrame(trailAnimRef.current);
        trailAnimRef.current = requestAnimationFrame(runTrailFrame);
        interactionRef.current = { type: 'erasing', snapshot };
        return;
      }

      if (tool === 'text') {
        const hit = getElementAtPoint(elementsRef.current, sx, sy, hitZoom);
        if (hit && hit.type === 'text') {
          onAppStateChange({ editingElementId: hit.id, selectedElementIds: new Set([hit.id]) });
          return;
        }
        const el = newText(state, sx, sy);
        onCommitHistory(elementsRef.current);
        onElementsChange([...elementsRef.current, el]);
        onAppStateChange({
          editingElementId: el.id,
          selectedElementIds: new Set([el.id]),
        });
        return;
      }

      let newEl: DrawingElement | null = null;
      if (tool === 'rectangle') newEl = newRectangle(state, sx, sy);
      else if (tool === 'ellipse') newEl = newEllipse(state, sx, sy);
      else if (tool === 'diamond') newEl = newDiamond(state, sx, sy);
      else if (tool === 'arrow') newEl = newLinear(state, sx, sy, 'arrow');
      else if (tool === 'line') newEl = newLinear(state, sx, sy, 'line');
      else if (tool === 'freedraw') newEl = newFreeDraw(state, sx, sy);

      if (newEl) {
        stagingRef.current = newEl;
        interactionRef.current = { type: 'drawing', element: newEl, startX: sx, startY: sy };
      }
    },
    [toScene, onAppStateChange, onElementsChange, onCommitHistory, onLaserPoint, runTrailFrame, cancelInteraction, beginGesture],
  );

  const updateCursor = useCallback((sx: number, sy: number, state: AppState, els: DrawingElement[]): void => {
    if (!canvasRef.current) return;
    const tool = state.activeTool;
    if (tool === 'hand') {
      canvasRef.current.style.cursor = 'grab';
      return;
    }
    if (tool === 'eraser') {
      canvasRef.current.style.cursor = 'none';
      return;
    }
    if (tool !== 'select') {
      canvasRef.current.style.cursor = tool === 'text' ? 'text' : 'crosshair';
      return;
    }

    if (state.selectedElementIds.size === 1) {
      const [selId] = [...state.selectedElementIds];
      const selEl = els.find(el => el.id === selId && !el.isDeleted);
      if (selEl && selEl.type !== 'line' && selEl.type !== 'arrow' && selEl.type !== 'freedraw') {
        const handles = getResizeHandles(
          selEl.x, selEl.y, selEl.width, selEl.height, selEl.angle,
          state.viewTransform.zoom,
        );
        const hit = getHitHandle(handles, sx, sy, state.viewTransform.zoom);
        if (hit === 'rotation') { canvasRef.current.style.cursor = 'grab'; return; }
        if (hit) {
          const cursors: Record<string, string> = {
            nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
            n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
          };
          canvasRef.current.style.cursor = cursors[hit] || 'move';
          return;
        }
      }
    }

    const hit = getElementAtPoint(els, sx, sy, state.viewTransform.zoom);
    canvasRef.current.style.cursor = hit ? 'move' : 'default';
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      if (e.pointerType === 'touch' && touchPointsRef.current.has(e.pointerId)) {
        lastTouchAtRef.current = performance.now();
        touchPointsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (gestureActiveRef.current) {
          if (touchPointsRef.current.size >= 2) updateGesture();
          return;
        }
      }

      if (appStateRef.current.activeTool === 'eraser' && wrapRef.current) {
        const rect = wrapRef.current.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        if (eraserCursorRef.current) {
          eraserCursorRef.current.style.left = `${cx - 10}px`;
          eraserCursorRef.current.style.top = `${cy - 10}px`;
          eraserCursorRef.current.style.display = 'block';
        }
        if (trailActiveRef.current) {
          trailPtsRef.current.push([cx, cy, performance.now()]);
        }
      }

      const [sx, sy] = toScene(e.clientX, e.clientY);
      onPointerScenePosition?.(sx, sy);
      const interaction = interactionRef.current;
      const state = appStateRef.current;

      if (interaction.type === 'laser') {
        onLaserPoint?.(sx, sy);
        return;
      }

      if (interaction.type === 'idle') {
        updateCursor(sx, sy, state, elementsRef.current);
        return;
      }

      if (interaction.type === 'erasing') {
        const hit = getElementAtPoint(elementsRef.current, sx, sy, state.viewTransform.zoom);
        if (hit && !hit.isDeleted) {
          eraserDidEraseRef.current = true;
          onElementsChange(
            elementsRef.current.map(el => (el.id === hit.id ? { ...el, isDeleted: true } : el)),
          );
        }
        return;
      }

      if (interaction.type === 'panning') {
        const dx = e.clientX - interaction.startX;
        const dy = e.clientY - interaction.startY;
        onAppStateChange({
          viewTransform: {
            ...state.viewTransform,
            scrollX: interaction.startScrollX + dx,
            scrollY: interaction.startScrollY + dy,
          },
        });
        return;
      }

      if (interaction.type === 'selecting') {
        interactionRef.current = { ...interaction, x: sx, y: sy };
        dragSelRef.current = { x1: interaction.startX, y1: interaction.startY, x2: sx, y2: sy };
        scheduleRender();
        return;
      }

      if (interaction.type === 'moving') {
        const dx = sx - interaction.startX;
        const dy = sy - interaction.startY;
        const next = elementsRef.current.map(el => {
          if (!interaction.elementIds.includes(el.id)) return el;
          const orig = interaction.originals.get(el.id);
          if (!orig) return el;
          const updated = { ...el } as DrawingElement;
          if (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') {
            const origL = orig as LinearElement | FreeDrawElement;
            (updated as LinearElement | FreeDrawElement).points = origL.points.map(
              ([px, py]) => [px + dx, py + dy],
            );
            const b = getElementBounds(updated);
            updated.x = b.x;
            updated.y = b.y;
            updated.width = b.width;
            updated.height = b.height;
          } else {
            updated.x = orig.x + dx;
            updated.y = orig.y + dy;
          }
          invalidateShape(updated);
          return updated;
        });
        onElementsChange(next);
        return;
      }

      if (interaction.type === 'linearPoint') {
        const drag = linearDragRef.current;
        if (drag) {
          const pts: Array<[number, number]> = drag.pts.map((p, i) =>
            i === drag.pointIndex ? [sx, sy] : p,
          );
          drag.pts = pts;
          const el = elementsRef.current.find(e => e.id === drag.id);
          if (el && (el.type === 'line' || el.type === 'arrow')) {
            let updated = { ...(el as LinearElement), points: pts } as LinearElement;
            const b = getElementBounds(updated);
            updated = { ...updated, x: b.x, y: b.y, width: b.width, height: b.height };
            invalidateShape(updated);
            onElementsChange(els => els.map(e => (e.id === drag.id ? updated : e)));
          }
        }
        return;
      }

      if (interaction.type === 'rotating') {
        const { center, startAngle, originalAngle, elementId } = interaction;
        const currentAngle = Math.atan2(sy - center.y, sx - center.x);
        const delta = currentAngle - startAngle;
        const el = elementsRef.current.find(el => el.id === elementId);
        if (el) {
          const updated = { ...el, angle: originalAngle + delta } as DrawingElement;
          invalidateShape(updated);
          onElementsChange(
            elementsRef.current.map(e => (e.id === elementId ? updated : e)),
          );
        }
        return;
      }

      if (interaction.type === 'resizing') {
        const { handle, startX, startY, original, elementId } = interaction;
        const dx = sx - startX;
        const dy = sy - startY;

        let { x, y, width, height } = original;
        const cos = Math.cos(-original.angle);
        const sin = Math.sin(-original.angle);
        const ldx = cos * dx - sin * dy;
        const ldy = sin * dx + cos * dy;

        switch (handle) {
          case 'se': width = Math.max(4, original.width + ldx); height = Math.max(4, original.height + ldy); break;
          case 'sw': width = Math.max(4, original.width - ldx); x = original.x + original.width - width; height = Math.max(4, original.height + ldy); break;
          case 'ne': width = Math.max(4, original.width + ldx); height = Math.max(4, original.height - ldy); y = original.y + original.height - height; break;
          case 'nw': width = Math.max(4, original.width - ldx); x = original.x + original.width - width; height = Math.max(4, original.height - ldy); y = original.y + original.height - height; break;
          case 'e': width = Math.max(4, original.width + ldx); break;
          case 'w': width = Math.max(4, original.width - ldx); x = original.x + original.width - width; break;
          case 's': height = Math.max(4, original.height + ldy); break;
          case 'n': height = Math.max(4, original.height - ldy); y = original.y + original.height - height; break;
        }

        const el = elementsRef.current.find(el => el.id === elementId);
        if (el) {
          let updated: DrawingElement;
          if (el.type === 'text') {
            const te = el as TextElement;
            const rawScale = height / Math.max(original.height, 1);
            const newFontSize = Math.max(8, Math.round((original as TextElement).fontSize * rawScale));
            const ctx = canvasRef.current?.getContext('2d');
            const dims = ctx
              ? measureText(te.text || ' ', newFontSize, ctx, te.fontFamily)
              : { width, height };
            updated = { ...te, x, y, fontSize: newFontSize, width: dims.width, height: dims.height };
          } else {
            updated = { ...el, x, y, width, height } as DrawingElement;
          }
          invalidateShape(updated);
          onElementsChange(
            elementsRef.current.map(e => (e.id === elementId ? updated : e)),
          );
        }
        return;
      }

      if (interaction.type === 'drawing') {
        const { element, startX, startY } = interaction;
        const updated: DrawingElement = { ...element };

        if (element.type === 'freedraw') {
          const fd = updated as FreeDrawElement;
          fd.points = [...(element as FreeDrawElement).points, [sx, sy]];
          fd.pressures = [...(element as FreeDrawElement).pressures, e.pressure || 0.5];
          const b = getElementBounds(updated);
          fd.x = b.x; fd.y = b.y; fd.width = b.width; fd.height = b.height;
        } else if (element.type === 'line' || element.type === 'arrow') {
          const linEl = updated as LinearElement;
          linEl.points = [(element as LinearElement).points[0], [sx, sy]];
          const b = getElementBounds(updated);
          linEl.x = b.x; linEl.y = b.y; linEl.width = b.width; linEl.height = b.height;
        } else {
          let w = sx - startX;
          let h = sy - startY;
          if (e.shiftKey) {
            const size = Math.max(Math.abs(w), Math.abs(h));
            w = w < 0 ? -size : size;
            h = h < 0 ? -size : size;
          }
          updated.x = w >= 0 ? startX : startX + w;
          updated.y = h >= 0 ? startY : startY + h;
          updated.width = Math.abs(w);
          updated.height = Math.abs(h);
        }

        invalidateShape(updated);
        stagingRef.current = updated;
        onDraft?.(updated);
        interactionRef.current = { ...interaction, element: updated };
        scheduleRender();
        return;
      }
    },
    [toScene, onAppStateChange, onElementsChange, onPointerScenePosition, onLaserPoint, onDraft, scheduleRender, updateCursor, updateGesture],
  );

  const onPointerUp = useCallback(
    (e?: React.PointerEvent<HTMLCanvasElement>): void => {
      if (e && e.pointerType === 'touch') {
        touchPointsRef.current.delete(e.pointerId);
        if (gestureActiveRef.current) {
          if (touchPointsRef.current.size < 2) gestureStartRef.current = null;
          if (touchPointsRef.current.size === 0) gestureActiveRef.current = false;
          return;
        }
      }

      const interaction = interactionRef.current;
      const state = appStateRef.current;

      if (interaction.type === 'laser') {
        interactionRef.current = { type: 'idle' };
        onLaserEnd?.();
        return;
      }

      if (interaction.type === 'panning') {
        if (canvasRef.current) {
          const tool = appStateRef.current.activeTool;
          canvasRef.current.style.cursor =
            tool === 'hand' || spaceHeldRef.current ? 'grab' : 'default';
        }
        interactionRef.current = { type: 'idle' };
        return;
      }

      if (interaction.type === 'selecting') {
        dragSelRef.current = null;
        const { startX, startY, x, y } = interaction;
        const selected = getElementsInRect(elementsRef.current, startX, startY, x - startX, y - startY);
        onAppStateChange({ selectedElementIds: new Set(selected.map(el => el.id)) });
        interactionRef.current = { type: 'idle' };
        scheduleRender();
        return;
      }

      if (interaction.type === 'moving') {
        const moved = elementsRef.current.some(el => {
          const orig = interaction.originals.get(el.id);
          return orig && (el.x !== orig.x || el.y !== orig.y);
        });
        if (moved) onCommitHistory([...interaction.originals.values()]);
        interactionRef.current = { type: 'idle' };
        return;
      }

      if (interaction.type === 'erasing') {
        trailActiveRef.current = false;
        if (eraserDidEraseRef.current) {
          onCommitHistory(interaction.snapshot);
          eraserDidEraseRef.current = false;
        }
        interactionRef.current = { type: 'idle' };
        return;
      }

      if (
        interaction.type === 'resizing' ||
        interaction.type === 'rotating' ||
        interaction.type === 'linearPoint'
      ) {
        onCommitHistory(interaction.snapshot);
        linearDragRef.current = null;
        interactionRef.current = { type: 'idle' };
        return;
      }

      if (interaction.type === 'drawing') {
        const el = interaction.element;
        stagingRef.current = null;
        onDraft?.(null);
        interactionRef.current = { type: 'idle' };

        const isLinear = el.type === 'line' || el.type === 'arrow';
        const linearTooShort =
          isLinear &&
          (() => {
            const p = (el as LinearElement).points;
            return Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) < (DRAG_THRESHOLD * 2) / state.viewTransform.zoom;
          })();

        const tooSmall =
          (el.type !== 'freedraw' && !isLinear && el.width < 2 && el.height < 2) ||
          el.type === 'text' ||
          linearTooShort;

        if (!tooSmall) {
          onCommitHistory(elementsRef.current);
          onElementsChange([...elementsRef.current, el]);
          if (!state.toolLocked) {
            onAppStateChange({
              activeTool: 'select',
              selectedElementIds: new Set([el.id]),
            });
          } else if (state.activeTool !== 'freedraw') {
            onAppStateChange({ selectedElementIds: new Set([el.id]) });
          }
        }

        scheduleRender();
        return;
      }
    },
    [onAppStateChange, onElementsChange, onCommitHistory, onLaserEnd, onDraft, scheduleRender],
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): void => {
      const [sx, sy] = toScene(e.clientX, e.clientY);
      const hit = getElementAtPoint(elementsRef.current, sx, sy, appStateRef.current.viewTransform.zoom);
      if (hit && hit.type === 'text') {
        onAppStateChange({ editingElementId: hit.id, selectedElementIds: new Set([hit.id]) });
      }
    },
    [toScene, onAppStateChange],
  );

  const onWheel = useCallback(
    (e: WheelEvent): void => {
      e.preventDefault();
      const state = appStateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = e.clientX - rect.left;
      const centerY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        const { zoom, scrollX, scrollY } = getNewZoom(
          state.viewTransform.zoom, e.deltaY, centerX, centerY,
          state.viewTransform.scrollX, state.viewTransform.scrollY,
          MIN_ZOOM, MAX_ZOOM,
        );
        onAppStateChange({ viewTransform: { zoom, scrollX, scrollY } });
      } else {
        onAppStateChange({
          viewTransform: {
            ...state.viewTransform,
            scrollX: state.viewTransform.scrollX - e.deltaX,
            scrollY: state.viewTransform.scrollY - e.deltaY,
          },
        });
      }
    },
    [onAppStateChange],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const editingEl = appState.editingElementId
    ? (elements.find(el => el.id === appState.editingElementId) as TextElement | undefined)
    : undefined;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commitTextEdit = useCallback((): void => {
    const { editingElementId } = appStateRef.current;
    if (!editingElementId) return;
    const el = elementsRef.current.find(e => e.id === editingElementId) as TextElement | undefined;
    if (!el) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const text = textareaRef.current?.value ?? '';
    const isEmpty = text.trim() === '';
    const dims = measureText(text || ' ', el.fontSize, ctx, el.fontFamily);
    const updated: TextElement = {
      ...el,
      text,
      width: dims.width,
      height: dims.height,
      isDeleted: isEmpty,
    };
    invalidateShape(updated);
    onElementsChange(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    onDraft?.(null);
    onAppStateChange({
      editingElementId: null,
      ...(appStateRef.current.toolLocked
        ? {}
        : { activeTool: 'select' as const }),
      selectedElementIds: isEmpty ? new Set<string>() : new Set([updated.id]),
    });
  }, [onElementsChange, onAppStateChange, onDraft]);

  const emitTextDraft = useCallback((value: string): void => {
    const ctx = canvasRef.current?.getContext('2d');
    const { editingElementId } = appStateRef.current;
    const el = elementsRef.current.find(e => e.id === editingElementId) as TextElement | undefined;
    if (!onDraft || !ctx || !el) return;
    const dims = measureText(value || ' ', el.fontSize, ctx, el.fontFamily);
    onDraft({ ...el, text: value, width: dims.width, height: dims.height });
  }, [onDraft]);

  useEffect(() => {
    commitTextEditRef.current = commitTextEdit;
  }, [commitTextEdit]);

  const textareaStyle = (() => {
    if (!editingEl) return undefined;
    const { scrollX, scrollY, zoom } = appState.viewTransform;
    return {
      left: editingEl.x * zoom + scrollX,
      top: editingEl.y * zoom + scrollY,
      fontSize: editingEl.fontSize * zoom,
      color: editingEl.strokeColor,
      fontFamily: FONT_FAMILY_CSS[editingEl.fontFamily] ?? FONT_FAMILY_CSS['hand-drawn'],
      textAlign: editingEl.textAlign,
      lineHeight: '1.35',
      opacity: editingEl.opacity / 100,
      minWidth: Math.max(editingEl.width * zoom, 20),
      minHeight: editingEl.fontSize * zoom * 1.35,
      filter: 'var(--theme-filter)',
      outline: `${Math.max(1, zoom)}px dashed #6366f1`,
      outlineOffset: '2px',
    };
  })();

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ filter: 'var(--theme-filter)', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          if (eraserCursorRef.current) eraserCursorRef.current.style.display = 'none';
          onPointerUp();
        }}
        onDoubleClick={onDoubleClick}
      />

      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5, width: '100%', height: '100%' }}
      >
        <path ref={trailPathRef} fill="rgba(0,0,0,0.18)" d="" />
      </svg>

      {appState.activeTool === 'eraser' && (
        <div
          ref={eraserCursorRef}
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 20,
            height: 20,
            border: '2.5px solid #1e1e1e',
            backgroundColor: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
            display: 'none',
            top: 0,
            left: 0,
            zIndex: 10,
          }}
        />
      )}
      {editingEl && textareaStyle && (
        <textarea
          key={editingEl.id}
          ref={textareaRef}
          autoFocus
          className="absolute resize-none bg-transparent border-none p-0 m-0 overflow-hidden whitespace-pre"
          style={textareaStyle}
          defaultValue={editingEl.text}
          rows={1}
          onChange={e => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
            emitTextDraft(e.target.value);
          }}
          onBlur={commitTextEdit}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); commitTextEdit(); }
          }}
        />
      )}
    </div>
  );
}
