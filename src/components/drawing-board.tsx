import React, { useState, useCallback, useEffect } from 'react';

import type { DrawingElement, AppState, LayerOp } from '@/types';
import { INITIAL_APP_STATE, MIN_ZOOM, MAX_ZOOM } from '@/utils/constants';
import { getNewZoom, recomputeTextSize } from '@/utils/element-utils';
import { useHistory } from '@/hooks/use-history';
import { cn } from '@/lib/utils';
import { CanvasBoard } from '@/components/canvas-board';
import { Toolbar } from '@/components/toolbar';
import { StylePanel } from '@/components/style-panel';
import { MainMenu } from '@/components/main-menu';
import { IconButton } from '@/components/icon-button';
import { UndoIcon, RedoIcon, ZoomInIcon, ZoomOutIcon } from '@/components/icons';

const STORAGE_KEY = 'excalidraw-clone:prefs';
const ELEMENTS_KEY = 'excalidraw-clone:elements';

function loadPrefs(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const out: Partial<AppState> = {};
    if (p.theme === 'light' || p.theme === 'dark' || p.theme === 'system') out.theme = p.theme;
    if (typeof p.canvasBackground === 'string') out.canvasBackground = p.canvasBackground;
    return out;
  } catch {
    return {};
  }
}

function loadElements(): DrawingElement[] {
  try {
    const raw = localStorage.getItem(ELEMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DrawingElement[]) : [];
  } catch {
    return [];
  }
}

export function DrawingBoard(): React.JSX.Element {
  const [elements, setElements] = useState<DrawingElement[]>(() => loadElements());
  const [appState, setAppState] = useState<AppState>(() => ({
    ...INITIAL_APP_STATE,
    ...loadPrefs(),
  }));
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme: appState.theme, canvasBackground: appState.canvasBackground }),
      );
    } catch {
      void 0;
    }
  }, [appState.theme, appState.canvasBackground]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ELEMENTS_KEY,
        JSON.stringify(elements.filter(el => !el.isDeleted)),
      );
    } catch {
      void 0;
    }
  }, [elements]);

  const { pushHistory, undo, redo } = useHistory(elements, setElements);

  const updateAppState = useCallback((updates: Partial<AppState>): void => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleStyleChange = useCallback((updates: Partial<AppState>): void => {
    setAppState(prev => {
      const next = { ...prev, ...updates };
      if (prev.selectedElementIds.size > 0) {
        const styleKeys = [
          'strokeColor', 'backgroundColor', 'fillStyle',
          'strokeWidth', 'strokeStyle', 'roughness', 'roundness',
          'arrowType', 'arrowheadEnd', 'fontFamily', 'fontSize', 'textAlign', 'opacity',
        ] as const;
        const styleUpdates = Object.fromEntries(
          styleKeys
            .filter(k => k in updates)
            .map(k => [k, (updates as Record<string, unknown>)[k]]),
        );
        if (Object.keys(styleUpdates).length > 0) {
          setElements(els => {
            pushHistory(els);
            return els.map(el =>
              prev.selectedElementIds.has(el.id)
                ? recomputeTextSize({ ...el, ...styleUpdates } as DrawingElement)
                : el,
            );
          });
        }
      }
      return next;
    });
  }, [pushHistory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.shiftKey && e.key === 'z'))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const zoomIn = (): void => {
    const { zoom, scrollX, scrollY } = appState.viewTransform;
    const vt = getNewZoom(zoom, -100, window.innerWidth / 2, window.innerHeight / 2, scrollX, scrollY, MIN_ZOOM, MAX_ZOOM);
    updateAppState({ viewTransform: vt });
  };

  const zoomOut = (): void => {
    const { zoom, scrollX, scrollY } = appState.viewTransform;
    const vt = getNewZoom(zoom, 100, window.innerWidth / 2, window.innerHeight / 2, scrollX, scrollY, MIN_ZOOM, MAX_ZOOM);
    updateAppState({ viewTransform: vt });
  };

  const resetZoom = (): void => {
    updateAppState({ viewTransform: { scrollX: 0, scrollY: 0, zoom: 1 } });
  };

  const handleLayerChange = (op: LayerOp): void => {
    const ids = appState.selectedElementIds;
    if (ids.size === 0) return;
    pushHistory(elements);
    setElements(prev => {
      if (op === 'sendToBack') {
        return [...prev.filter(e => ids.has(e.id)), ...prev.filter(e => !ids.has(e.id))];
      }
      if (op === 'bringToFront') {
        return [...prev.filter(e => !ids.has(e.id)), ...prev.filter(e => ids.has(e.id))];
      }
      if (op === 'sendBackward') {
        const arr = [...prev];
        for (let i = 1; i < arr.length; i++) {
          if (ids.has(arr[i].id) && !ids.has(arr[i - 1].id)) {
            [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
          }
        }
        return arr;
      }
      const arr = [...prev];
      for (let i = arr.length - 2; i >= 0; i--) {
        if (ids.has(arr[i].id) && !ids.has(arr[i + 1].id)) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        }
      }
      return arr;
    });
  };

  const isDark = appState.theme === 'system' ? systemDark : appState.theme === 'dark';
  const zoomPct = Math.round(appState.viewTransform.zoom * 100);

  const DRAWING_TOOLS = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'freedraw', 'text'];
  const showStylePanel =
    DRAWING_TOOLS.includes(appState.activeTool) || appState.selectedElementIds.size > 0;

  const selectedEls = elements.filter(e => appState.selectedElementIds.has(e.id));
  const selectedType =
    selectedEls.length > 0
      ? (selectedEls.every(e => e.type === selectedEls[0].type)
          ? (selectedEls[0].type as AppState['activeTool'])
          : null)
      : null;

  const islandStyle = {
    backgroundColor: 'var(--ex-island-bg)',
    border: '1px solid var(--ex-island-border)',
    boxShadow: 'var(--ex-shadow)',
  };

  return (
    <div className={cn('relative w-full h-screen overflow-hidden', isDark && 'dark')}>

      <CanvasBoard
        elements={elements}
        appState={appState}
        onElementsChange={setElements}
        onAppStateChange={updateAppState}
        onCommitHistory={pushHistory}
      />

      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start">

        <div className="rounded-xl p-1" style={islandStyle}>
          <MainMenu appState={appState} onAppStateChange={updateAppState} />
        </div>

        {showStylePanel && (
          <div className="hidden md:block">
            <StylePanel
              appState={appState}
              selectedType={selectedType}
              onChange={handleStyleChange}
              onLayerChange={handleLayerChange}
            />
          </div>
        )}
      </div>

      <Toolbar
        activeTool={appState.activeTool}
        toolLocked={appState.toolLocked}
        onToolChange={tool => updateAppState({ activeTool: tool })}
        onLockToggle={() => updateAppState({ toolLocked: !appState.toolLocked })}
      />

      <div className="absolute bottom-20 right-3 md:bottom-3 md:left-3 md:right-auto z-20 flex flex-row gap-1">

        <div className="hidden md:flex items-center gap-0.5 rounded-xl px-1 py-1 select-none" style={islandStyle}>
          <IconButton title="Zoom out (Ctrl+−)" onClick={zoomOut} size="sm">
            <ZoomOutIcon size={14} />
          </IconButton>
          <button
            title="Reset zoom to 100%"
            onClick={resetZoom}
            className="px-2 py-1 text-xs font-mono rounded-lg min-w-12 text-center transition-colors hover:bg-(--ex-surface-high)"
            style={{ color: 'var(--ex-text-muted)' }}
          >
            {zoomPct}%
          </button>
          <IconButton title="Zoom in (Ctrl++)" onClick={zoomIn} size="sm">
            <ZoomInIcon size={14} />
          </IconButton>
        </div>

        <div className="flex items-center gap-0.5 rounded-xl px-1 py-1 select-none" style={islandStyle}>
          <IconButton title="Undo (Ctrl+Z)" onClick={undo} size="sm">
            <UndoIcon size={14} />
          </IconButton>
          <IconButton title="Redo (Ctrl+Y)" onClick={redo} size="sm">
            <RedoIcon size={14} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
