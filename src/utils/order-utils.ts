import { generateNKeysBetween } from 'fractional-indexing';

import type { DrawingElement } from '@/types';

function hasIndex(el: DrawingElement): el is DrawingElement & { index: string } {
  return typeof el.index === 'string' && el.index.length > 0;
}

function longestIncreasingPositions(els: DrawingElement[]): Set<number> {
  const candidates: number[] = [];
  els.forEach((el, i) => {
    if (hasIndex(el)) candidates.push(i);
  });

  const tails: number[] = [];
  const previous: number[] = new Array(candidates.length).fill(-1);

  for (let k = 0; k < candidates.length; k++) {
    const value = (els[candidates[k]] as DrawingElement & { index: string }).index;
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const midValue = (els[candidates[tails[mid]]] as DrawingElement & { index: string }).index;
      if (midValue < value) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) previous[k] = tails[lo - 1];
    tails[lo] = k;
  }

  const keep = new Set<number>();
  let k = tails.length > 0 ? tails[tails.length - 1] : -1;
  while (k >= 0) {
    keep.add(candidates[k]);
    k = previous[k];
  }
  return keep;
}

export function reindexToOrder(els: DrawingElement[]): DrawingElement[] {
  const keep = longestIncreasingPositions(els);
  if (keep.size === els.length) return els;

  const out = [...els];
  let i = 0;
  let lower: string | null = null;

  while (i < els.length) {
    if (keep.has(i)) {
      lower = els[i].index as string;
      i++;
      continue;
    }
    let j = i;
    while (j < els.length && !keep.has(j)) j++;
    const upper = j < els.length ? (els[j].index as string) : null;
    const keys = generateNKeysBetween(lower, upper, j - i);
    for (let k = i; k < j; k++) {
      out[k] = { ...els[k], index: keys[k - i] } as DrawingElement;
    }
    i = j;
  }

  return out;
}

function compareByIndex(a: DrawingElement, b: DrawingElement): number {
  const ai = a.index ?? '';
  const bi = b.index ?? '';
  if (ai !== bi) return ai < bi ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortByIndex(els: DrawingElement[]): DrawingElement[] {
  for (let i = 1; i < els.length; i++) {
    if (compareByIndex(els[i - 1], els[i]) > 0) return [...els].sort(compareByIndex);
  }
  return els;
}
