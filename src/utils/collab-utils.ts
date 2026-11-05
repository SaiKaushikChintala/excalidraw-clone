import type { DrawingElement } from '@/types';
import { generateSeed } from '@/utils/new-element';
import { reindexToOrder } from '@/utils/order-utils';

const ELEMENT_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'freedraw', 'text']);
const MAX_ELEMENTS_PER_MESSAGE = 200;

export const SCENE_CHUNK_SIZE = 40;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isPointList(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every(p => Array.isArray(p) && p.length === 2 && isFiniteNumber(p[0]) && isFiniteNumber(p[1]))
  );
}

function isValidElement(v: unknown): v is DrawingElement {
  if (typeof v !== 'object' || v === null) return false;
  const el = v as Record<string, unknown>;
  if (typeof el.id !== 'string' || el.id.length === 0 || el.id.length > 64) return false;
  if (typeof el.type !== 'string' || !ELEMENT_TYPES.has(el.type)) return false;
  if (typeof el.isDeleted !== 'boolean') return false;
  if (el.index !== undefined && (typeof el.index !== 'string' || el.index.length > 64)) return false;
  const numeric = ['x', 'y', 'width', 'height', 'angle', 'strokeWidth', 'roughness', 'opacity', 'seed', 'version', 'versionNonce'];
  if (!numeric.every(k => isFiniteNumber(el[k]))) return false;
  if (typeof el.strokeColor !== 'string' || typeof el.backgroundColor !== 'string') return false;
  if (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') {
    if (!isPointList(el.points)) return false;
  }
  if (el.type === 'freedraw' && !Array.isArray(el.pressures)) return false;
  if (el.type === 'text') {
    if (typeof el.text !== 'string' || !isFiniteNumber(el.fontSize)) return false;
  }
  return true;
}

export function parseIncomingElements(payload: unknown): DrawingElement[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const els = (payload as { els?: unknown }).els;
  if (!Array.isArray(els)) return [];
  return els.slice(0, MAX_ELEMENTS_PER_MESSAGE).filter(isValidElement);
}

export function normalizeLoadedElements(els: DrawingElement[]): DrawingElement[] {
  const withVersions = els.map(el => ({
    ...el,
    version: isFiniteNumber(el.version) ? el.version : 1,
    versionNonce: isFiniteNumber(el.versionNonce) ? el.versionNonce : generateSeed(),
  }));
  return reindexToOrder(withVersions);
}

function isNewer(incoming: DrawingElement, current: DrawingElement): boolean {
  if (incoming.version !== current.version) return incoming.version > current.version;
  return incoming.versionNonce < current.versionNonce;
}

export function mergeRemoteElements(
  current: DrawingElement[],
  incoming: DrawingElement[],
): DrawingElement[] | null {
  const indexById = new Map(current.map((el, i) => [el.id, i]));
  let next: DrawingElement[] | null = null;

  for (const el of incoming) {
    const i = indexById.get(el.id);
    if (i === undefined) {
      next ??= [...current];
      indexById.set(el.id, next.length);
      next.push(el);
    } else if (isNewer(el, (next ?? current)[i])) {
      next ??= [...current];
      next[i] = el;
    }
  }

  return next;
}

export function stampLocalChanges(
  prev: DrawingElement[],
  next: DrawingElement[],
): { elements: DrawingElement[]; changed: DrawingElement[] } {
  const prevById = new Map(prev.map(el => [el.id, el]));
  const nextIds = new Set<string>();
  const changed: DrawingElement[] = [];

  const elements = next.map(el => {
    nextIds.add(el.id);
    const old = prevById.get(el.id);
    if (old === el) return el;
    const stamped = {
      ...el,
      version: (old?.version ?? el.version ?? 0) + 1,
      versionNonce: generateSeed(),
    } as DrawingElement;
    changed.push(stamped);
    return stamped;
  });

  for (const old of prev) {
    if (nextIds.has(old.id)) continue;
    const tombstone = {
      ...old,
      isDeleted: true,
      version: old.version + 1,
      versionNonce: generateSeed(),
    } as DrawingElement;
    elements.push(tombstone);
    changed.push(tombstone);
  }

  return { elements, changed };
}

export function restoreOwnElements(
  current: DrawingElement[],
  snapshot: DrawingElement[],
  isOwn: (id: string) => boolean,
): DrawingElement[] {
  const snapshotById = new Map(snapshot.map(el => [el.id, el]));
  const currentIds = new Set(current.map(el => el.id));

  const restored = current.map(el => {
    if (!isOwn(el.id)) return el;
    return snapshotById.get(el.id) ?? ({ ...el, isDeleted: true } as DrawingElement);
  });

  for (const el of snapshot) {
    if (!currentIds.has(el.id)) restored.push(el);
  }

  return restored;
}
