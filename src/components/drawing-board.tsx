import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { SetStateAction } from 'react';

import type {
  DrawingElement,
  AppState,
  LayerOp,
  RemoteSelection,
  PeerEvent,
  LaserPoint,
  LocalState,
  Toast,
} from '@/types';
import { INITIAL_APP_STATE, MIN_ZOOM, MAX_ZOOM } from '@/utils/constants';
import { getNewZoom, recomputeTextSize } from '@/utils/element-utils';
import { generateRoomId } from '@/utils/new-element';
import { reindexToOrder, sortByIndex } from '@/utils/order-utils';
import { LaserTrailStore } from '@/utils/laser-trails';
import {
  mergeRemoteElements,
  normalizeLoadedElements,
  stampLocalChanges,
} from '@/utils/collab-utils';
import { useHistory } from '@/hooks/use-history';
import { useCollaboration } from '@/hooks/use-collaboration';
import { useThemeColor } from '@/hooks/use-theme-color';
import { cn } from '@/lib/utils';
import { CanvasBoard } from '@/components/canvas-board';
import { Toolbar } from '@/components/toolbar';
import { StylePanel } from '@/components/style-panel';
import { MainMenu } from '@/components/main-menu';
import { IconButton } from '@/components/icon-button';
import { CollabPanel } from '@/components/collab-panel';
import { CollabCursors } from '@/components/collab-cursors';
import { CollabAvatars } from '@/components/collab-avatars';
import { LaserLayer } from '@/components/laser-layer';
import { ToastStack } from '@/components/toast-stack';
import { UndoIcon, RedoIcon, ZoomInIcon, ZoomOutIcon, PaletteIcon } from '@/components/icons';

const STORAGE_KEY = 'excalidraw-clone:prefs';
const ELEMENTS_KEY = 'excalidraw-clone:elements';
const ROOM_HASH_RE = /^#room=([A-Za-z0-9_-]{6,64})$/;
const TOAST_DURATION_MS = 3000;

function getRoomIdFromHash(): string | null {
  const match = ROOM_HASH_RE.exec(window.location.hash);
  return match ? match[1] : null;
}

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
  const [roomId, setRoomId] = useState<string | null>(getRoomIdFromHash);
  const [elements, setElementsState] = useState<DrawingElement[]>(() =>
    getRoomIdFromHash() ? [] : normalizeLoadedElements(loadElements()),
  );
  const elementsRef = useRef(elements);
  const roomIdRef = useRef(roomId);
  const touchedRef = useRef(new Set<string>());
  const queueElementsRef = useRef<(els: DrawingElement[]) => void>(() => {});
  const clearHistoryRef = useRef<() => void>(() => {});
  const [isHost, setIsHost] = useState(false);

  const setElements = useCallback((action: SetStateAction<DrawingElement[]>): void => {
    const prev = elementsRef.current;
    const next = typeof action === 'function' ? action(prev) : action;
    if (next === prev) return;
    const { elements: stamped, changed } = stampLocalChanges(prev, reindexToOrder(next));
    for (const el of changed) touchedRef.current.add(el.id);
    elementsRef.current = stamped;
    setElementsState(stamped);
    if (changed.length > 0) queueElementsRef.current(changed);
  }, []);

  const applyRemote = useCallback((incoming: DrawingElement[]): void => {
    const merged = mergeRemoteElements(elementsRef.current, incoming);
    if (!merged) return;
    const ordered = sortByIndex(merged);
    elementsRef.current = ordered;
    setElementsState(ordered);
  }, []);

  const getElements = useCallback((): DrawingElement[] => elementsRef.current, []);
  const isOwnElement = useCallback((id: string): boolean => touchedRef.current.has(id), []);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const [mobileStyleOpen, setMobileStyleOpen] = useState(false);

  const pushToast = useCallback((text: string): void => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev.slice(-2), { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION_MS);
  }, []);

  const handlePeerEvent = useCallback(
    (event: PeerEvent, name: string): void => {
      pushToast(event === 'joined' ? `${name} joined the session` : `${name} left the session`);
    },
    [pushToast],
  );

  const [laserStore] = useState(() => new LaserTrailStore());
  const selectionRef = useRef<Set<string>>(INITIAL_APP_STATE.selectedElementIds);

  const getLocalState = useCallback(
    (): LocalState => ({ selection: [...selectionRef.current] }),
    [],
  );

  const handlePeerLaser = useCallback(
    (peerId: string, point: LaserPoint | null): void => {
      if (point) laserStore.addPoint(peerId, point.x, point.y, point.color);
      else laserStore.endStroke(peerId);
    },
    [laserStore],
  );

  const collab = useCollaboration({
    roomId,
    getElements,
    applyRemote,
    getLocalState,
    onPeerEvent: handlePeerEvent,
    onPeerLaser: handlePeerLaser,
  });
  const { peers, selections, drafts, queueElements, sendSelection, sendLaser, endLaser, sendDraft } = collab;

  useEffect(() => {
    queueElementsRef.current = queueElements;
  }, [queueElements]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

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
    if (roomId) return;
    try {
      localStorage.setItem(
        ELEMENTS_KEY,
        JSON.stringify(elements.filter(el => !el.isDeleted)),
      );
    } catch {
      void 0;
    }
  }, [elements, roomId]);

  const { pushHistory, undo, redo, clearHistory } = useHistory(
    elements,
    setElements,
    roomId ? isOwnElement : undefined,
  );

  useEffect(() => {
    clearHistoryRef.current = clearHistory;
  }, [clearHistory]);

  const resetBoard = useCallback((next: DrawingElement[]): void => {
    elementsRef.current = next;
    setElementsState(next);
    touchedRef.current.clear();
    clearHistoryRef.current();
    setAppState(prev => ({ ...prev, selectedElementIds: new Set(), editingElementId: null }));
  }, []);

  const startSession = (): void => {
    window.history.replaceState(null, '', `#room=${generateRoomId()}`);
    touchedRef.current.clear();
    clearHistoryRef.current();
    setIsHost(true);
    setRoomId(getRoomIdFromHash());
  };

  const leaveSession = useCallback((): void => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    resetBoard(normalizeLoadedElements(loadElements()));
    setIsHost(false);
    setRoomId(null);
  }, [resetBoard]);

  useEffect(() => {
    const onHashChange = () => {
      const next = getRoomIdFromHash();
      if (next === roomIdRef.current) return;
      resetBoard(next === null ? normalizeLoadedElements(loadElements()) : []);
      setIsHost(false);
      setRoomId(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [resetBoard]);

  const updateAppState = useCallback((updates: Partial<AppState>): void => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    selectionRef.current = appState.selectedElementIds;
    if (roomId) sendSelection([...appState.selectedElementIds]);
  }, [appState.selectedElementIds, roomId, sendSelection]);

  const meColor = collab.me.color;

  const handleLaserPoint = useCallback(
    (x: number, y: number): void => {
      laserStore.addPoint('me', x, y, meColor);
      if (roomId) sendLaser(x, y, meColor);
    },
    [laserStore, meColor, roomId, sendLaser],
  );

  const handleLaserEnd = useCallback((): void => {
    laserStore.endStroke('me');
    if (roomId) endLaser();
  }, [laserStore, roomId, endLaser]);

  const remoteSelections = useMemo<RemoteSelection[]>(
    () =>
      peers
        .filter(p => (selections[p.id]?.length ?? 0) > 0)
        .map(p => ({ id: p.id, name: p.name, color: p.color, ids: selections[p.id] })),
    [peers, selections],
  );

  const remoteDrafts = useMemo<DrawingElement[]>(() => Object.values(drafts), [drafts]);

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
  }, [pushHistory, setElements]);

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
  useThemeColor(isDark, appState.canvasBackground);
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
    <div className={cn('relative w-full h-dvh overflow-hidden', isDark && 'dark')}>

      <CanvasBoard
        elements={elements}
        appState={appState}
        onElementsChange={setElements}
        onAppStateChange={updateAppState}
        onCommitHistory={pushHistory}
        onPointerScenePosition={roomId ? collab.sendCursor : undefined}
        onLaserPoint={handleLaserPoint}
        onLaserEnd={handleLaserEnd}
        remoteSelections={remoteSelections}
        remoteDrafts={remoteDrafts}
        onDraft={roomId ? sendDraft : undefined}
      />

      <LaserLayer store={laserStore} viewTransform={appState.viewTransform} />

      {roomId && (
        <CollabCursors
          peers={collab.peers}
          cursors={collab.cursors}
          viewTransform={appState.viewTransform}
        />
      )}

      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {roomId && <CollabAvatars me={collab.me} peers={collab.peers} />}
        <CollabPanel
          roomId={roomId}
          status={collab.status}
          configured={collab.configured}
          me={collab.me}
          peers={collab.peers}
          onNameChange={collab.setName}
          onStart={startSession}
          isHost={isHost}
          onLeave={leaveSession}
          onLinkCopied={() => pushToast('Link copied to clipboard')}
        />
      </div>

      <ToastStack toasts={toasts} />

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

      {showStylePanel && (
        <>
          <button
            onClick={() => setMobileStyleOpen(open => !open)}
            aria-label="Style options"
            aria-expanded={mobileStyleOpen}
            className="md:hidden absolute bottom-20 left-3 z-20 h-10 px-3 flex items-center gap-2 rounded-xl text-sm font-medium select-none"
            style={{ ...islandStyle, color: 'var(--ex-text)' }}
          >
            <PaletteIcon size={18} />
            Style
          </button>
          {mobileStyleOpen && (
            <div className="md:hidden absolute bottom-32 left-3 z-30 [&>div]:max-h-[50dvh]">
              <StylePanel
                appState={appState}
                selectedType={selectedType}
                onChange={handleStyleChange}
                onLayerChange={handleLayerChange}
              />
            </div>
          )}
        </>
      )}

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
