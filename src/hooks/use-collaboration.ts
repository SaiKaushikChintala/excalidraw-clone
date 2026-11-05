import { useState, useRef, useEffect, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import type {
  DrawingElement,
  CollabStatus,
  CollabPeer,
  CollabCursor,
  PeerEvent,
  LaserPoint,
  LocalState,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { parseIncomingElements, SCENE_CHUNK_SIZE } from '@/utils/collab-utils';
import {
  displayName,
  initialColorFor,
  isValidColor,
  loadStoredName,
  pickFreeColor,
  randomName,
  saveName,
  sanitizeName,
} from '@/utils/collab-names';

const FLUSH_INTERVAL_MS = 60;
const CURSOR_INTERVAL_MS = 50;
const LASER_INTERVAL_MS = 25;
const DRAFT_INTERVAL_MS = 50;
const DRAFT_END_DELAY_MS = 150;
const NAME_TRACK_DELAY_MS = 400;
const JOIN_TOAST_GRACE_MS = 1500;
const MAX_SELECTION_IDS = 500;

type PresenceMeta = { name: string; color: string };

type Props = {
  roomId: string | null;
  getElements: () => DrawingElement[];
  applyRemote: (incoming: DrawingElement[]) => void;
  getLocalState: () => LocalState;
  onPeerEvent?: (event: PeerEvent, name: string) => void;
  onPeerLaser?: (peerId: string, point: LaserPoint | null) => void;
};

type Collaboration = {
  configured: boolean;
  status: CollabStatus;
  me: CollabPeer;
  peers: CollabPeer[];
  cursors: Record<string, CollabCursor>;
  selections: Record<string, string[]>;
  drafts: Record<string, DrawingElement>;
  setName: (name: string) => void;
  queueElements: (els: DrawingElement[]) => void;
  sendCursor: (x: number, y: number) => void;
  sendSelection: (ids: string[]) => void;
  sendLaser: (x: number, y: number, color: string) => void;
  endLaser: () => void;
  sendDraft: (el: DrawingElement | null) => void;
};

const NO_CURSORS: Record<string, CollabCursor> = {};

const NO_SELECTIONS: Record<string, string[]> = {};
const NO_DRAFTS: Record<string, DrawingElement> = {};

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function useCollaboration({
  roomId,
  getElements,
  applyRemote,
  getLocalState,
  onPeerEvent,
  onPeerLaser,
}: Props): Collaboration {
  const [selfId] = useState(() => crypto.randomUUID());
  const [name, setNameState] = useState(() => loadStoredName() ?? randomName());
  const [color, setColor] = useState(() => initialColorFor(selfId));
  const [status, setStatus] = useState<CollabStatus>('connecting');
  const [peers, setPeers] = useState<CollabPeer[]>([]);
  const [cursors, setCursors] = useState<Record<string, CollabCursor>>({});
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [drafts, setDrafts] = useState<Record<string, DrawingElement>>({});

  const nameRef = useRef(name);
  const colorRef = useRef(color);
  const getLocalStateRef = useRef(getLocalState);
  const onPeerEventRef = useRef(onPeerEvent);
  const onPeerLaserRef = useRef(onPeerLaser);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const connectedRef = useRef(false);
  const subscribedAtRef = useRef(0);
  const pendingRef = useRef(new Map<string, DrawingElement>());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorSentRef = useRef(0);
  const lastLaserSentRef = useRef(0);
  const lastDraftSentRef = useRef(0);
  const pendingDraftRef = useRef<DrawingElement | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getLocalStateRef.current = getLocalState;
    onPeerEventRef.current = onPeerEvent;
    onPeerLaserRef.current = onPeerLaser;
  }, [getLocalState, onPeerEvent, onPeerLaser]);

  useEffect(() => {
    nameRef.current = name;
    const timer = setTimeout(() => {
      if (connectedRef.current) {
        void channelRef.current?.track({ name: displayName(name), color: colorRef.current });
      }
    }, NAME_TRACK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [name]);

  const setName = useCallback((value: string): void => {
    const clean = sanitizeName(value);
    setNameState(clean);
    saveName(clean);
  }, []);

  const send = useCallback((event: string, payload: Record<string, unknown>): void => {
    const channel = channelRef.current;
    if (!channel || !connectedRef.current) return;
    void channel.send({ type: 'broadcast', event, payload: { from: selfId, ...payload } });
  }, [selfId]);

  const announceLocalState = useCallback((): void => {
    const { selection } = getLocalStateRef.current();
    send('selection', { ids: selection.slice(0, MAX_SELECTION_IDS) });
  }, [send]);

  const flushPending = useCallback((): void => {
    flushTimerRef.current = null;
    if (!connectedRef.current) return;
    const els = [...pendingRef.current.values()];
    pendingRef.current.clear();
    for (let i = 0; i < els.length; i += SCENE_CHUNK_SIZE) {
      send('elements', { els: els.slice(i, i + SCENE_CHUNK_SIZE) });
    }
  }, [send]);

  const queueElements = useCallback((els: DrawingElement[]): void => {
    if (!channelRef.current) return;
    for (const el of els) pendingRef.current.set(el.id, el);
    if (flushTimerRef.current === null) {
      flushTimerRef.current = setTimeout(flushPending, FLUSH_INTERVAL_MS);
    }
  }, [flushPending]);

  const sendCursor = useCallback((x: number, y: number): void => {
    const now = performance.now();
    if (now - lastCursorSentRef.current < CURSOR_INTERVAL_MS) return;
    lastCursorSentRef.current = now;
    send('cursor', { x, y });
  }, [send]);

  const sendSelection = useCallback((ids: string[]): void => {
    send('selection', { ids: ids.slice(0, MAX_SELECTION_IDS) });
  }, [send]);

  const sendLaser = useCallback((x: number, y: number, laserColor: string): void => {
    const now = performance.now();
    if (now - lastLaserSentRef.current < LASER_INTERVAL_MS) return;
    lastLaserSentRef.current = now;
    send('laser', { x, y, c: laserColor });
  }, [send]);

  const endLaser = useCallback((): void => {
    lastLaserSentRef.current = 0;
    send('laser-end', {});
  }, [send]);

  const sendDraft = useCallback((el: DrawingElement | null): void => {
    if (el === null) {
      pendingDraftRef.current = null;
      if (draftTimerRef.current !== null) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
      lastDraftSentRef.current = 0;
      if (draftEndTimerRef.current !== null) clearTimeout(draftEndTimerRef.current);
      draftEndTimerRef.current = setTimeout(() => {
        draftEndTimerRef.current = null;
        send('draft-end', {});
      }, DRAFT_END_DELAY_MS);
      return;
    }

    if (draftEndTimerRef.current !== null) {
      clearTimeout(draftEndTimerRef.current);
      draftEndTimerRef.current = null;
    }
    const now = performance.now();
    const wait = DRAFT_INTERVAL_MS - (now - lastDraftSentRef.current);
    if (wait <= 0) {
      lastDraftSentRef.current = now;
      send('draft', { el });
      return;
    }
    pendingDraftRef.current = el;
    if (draftTimerRef.current === null) {
      draftTimerRef.current = setTimeout(() => {
        draftTimerRef.current = null;
        const latest = pendingDraftRef.current;
        pendingDraftRef.current = null;
        if (latest) {
          lastDraftSentRef.current = performance.now();
          send('draft', { el: latest });
        }
      }, wait);
    }
  }, [send]);

  useEffect(() => {
    if (!roomId || !supabase) return;

    const pending = pendingRef.current;
    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: selfId } },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'elements' }, ({ payload }) => {
      const incoming = parseIncomingElements(payload);
      applyRemote(incoming);

      const from = (payload as { from?: unknown } | null)?.from;
      if (typeof from !== 'string' || incoming.length === 0) return;
      const arrivedIds = new Set(incoming.map(el => el.id));
      setDrafts(prev => {
        const draft = prev[from];
        if (!draft || !arrivedIds.has(draft.id)) return prev;
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });

    channel.on('broadcast', { event: 'request-scene' }, () => {
      const all = getElements();
      for (let i = 0; i < all.length; i += SCENE_CHUNK_SIZE) {
        send('elements', { els: all.slice(i, i + SCENE_CHUNK_SIZE) });
      }
      announceLocalState();
    });

    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      const { from, x, y } = (payload ?? {}) as { from?: unknown; x?: unknown; y?: unknown };
      if (typeof from !== 'string' || !isFiniteNumber(x) || !isFiniteNumber(y)) return;
      setCursors(prev => ({ ...prev, [from]: { x, y } }));
    });

    channel.on('broadcast', { event: 'selection' }, ({ payload }) => {
      const { from, ids } = (payload ?? {}) as { from?: unknown; ids?: unknown };
      if (typeof from !== 'string' || !Array.isArray(ids)) return;
      const clean = ids
        .filter((id): id is string => typeof id === 'string' && id.length <= 64)
        .slice(0, MAX_SELECTION_IDS);
      setSelections(prev => ({ ...prev, [from]: clean }));
    });

    channel.on('broadcast', { event: 'draft' }, ({ payload }) => {
      const { from, el } = (payload ?? {}) as { from?: unknown; el?: unknown };
      if (typeof from !== 'string') return;
      const [draft] = parseIncomingElements({ els: [el] });
      if (draft) setDrafts(prev => ({ ...prev, [from]: draft }));
    });

    channel.on('broadcast', { event: 'draft-end' }, ({ payload }) => {
      const { from } = (payload ?? {}) as { from?: unknown };
      if (typeof from !== 'string') return;
      setDrafts(prev => {
        if (!(from in prev)) return prev;
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });

    channel.on('broadcast', { event: 'laser' }, ({ payload }) => {
      const { from, x, y, c } = (payload ?? {}) as Record<string, unknown>;
      if (typeof from !== 'string' || !isFiniteNumber(x) || !isFiniteNumber(y)) return;
      if (!isValidColor(c)) return;
      onPeerLaserRef.current?.(from, { x, y, color: c });
    });

    channel.on('broadcast', { event: 'laser-end' }, ({ payload }) => {
      const { from } = (payload ?? {}) as { from?: unknown };
      if (typeof from === 'string') onPeerLaserRef.current?.(from, null);
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceMeta>();
      const others: CollabPeer[] = Object.entries(state)
        .filter(([id]) => id !== selfId)
        .map(([id, metas]) => ({
          id,
          name: displayName(String(metas[0]?.name ?? '')).slice(0, 40),
          color: isValidColor(metas[0]?.color) ? metas[0].color : initialColorFor(id),
        }));
      setPeers(others);

      const alive = new Set(others.map(p => p.id));
      setCursors(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => alive.has(id))));
      setSelections(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => alive.has(id))));
      setDrafts(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => alive.has(id))));

      const clash = others.some(
        p => p.color.toLowerCase() === colorRef.current.toLowerCase() && p.id < selfId,
      );
      if (clash) {
        const next = pickFreeColor(others.map(p => p.color), colorRef.current);
        if (next !== colorRef.current) {
          colorRef.current = next;
          setColor(next);
          void channel.track({ name: displayName(nameRef.current), color: next });
        }
      }
    });

    const peerName = (presences: Array<Record<string, unknown>>): string =>
      displayName(String(presences[0]?.name ?? '')).slice(0, 40);

    channel.on('presence', { event: 'join' }, ({ key, currentPresences, newPresences }) => {
      if (key === selfId || currentPresences.length > 0) return;
      if (performance.now() - subscribedAtRef.current < JOIN_TOAST_GRACE_MS) return;
      onPeerEventRef.current?.('joined', peerName(newPresences));
    });

    channel.on('presence', { event: 'leave' }, ({ key, currentPresences, leftPresences }) => {
      if (key === selfId || currentPresences.length > 0) return;
      onPeerEventRef.current?.('left', peerName(leftPresences));
    });

    channel.subscribe(async state => {
      if (state === 'SUBSCRIBED') {
        connectedRef.current = true;
        subscribedAtRef.current = performance.now();
        setStatus('connected');
        await channel.track({ name: displayName(nameRef.current), color: colorRef.current });
        send('request-scene', {});
        announceLocalState();
        if (pending.size > 0 && flushTimerRef.current === null) {
          flushTimerRef.current = setTimeout(flushPending, FLUSH_INTERVAL_MS);
        }
      } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
        connectedRef.current = false;
        setStatus('error');
      } else if (state === 'CLOSED') {
        connectedRef.current = false;
      }
    });

    return () => {
      connectedRef.current = false;
      channelRef.current = null;
      if (flushTimerRef.current !== null) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
      if (draftTimerRef.current !== null) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
      if (draftEndTimerRef.current !== null) clearTimeout(draftEndTimerRef.current);
      draftEndTimerRef.current = null;
      pendingDraftRef.current = null;
      pending.clear();
      void supabase?.removeChannel(channel);
      setStatus('connecting');
      setPeers([]);
      setCursors({});
      setSelections({});
      setDrafts({});
    };
  }, [roomId, selfId, send, announceLocalState, getElements, applyRemote, flushPending]);

  const active = roomId !== null && supabase !== null;

  return {
    configured: supabase !== null,
    status: roomId === null ? 'idle' : supabase === null ? 'error' : status,
    me: { id: selfId, name, color },
    peers: active ? peers : [],
    cursors: active ? cursors : NO_CURSORS,
    selections: active ? selections : NO_SELECTIONS,
    drafts: active ? drafts : NO_DRAFTS,
    setName,
    queueElements,
    sendCursor,
    sendSelection,
    sendLaser,
    endLaser,
    sendDraft,
  };
}
