const NAME_KEY = 'excalidraw-clone:collab-name';
const MAX_NAME_LENGTH = 24;

const ADJECTIVES = [
  'Gentle', 'Brave', 'Clever', 'Swift', 'Quiet', 'Sunny', 'Witty', 'Lucky',
  'Mellow', 'Bold', 'Calm', 'Eager', 'Jolly', 'Keen', 'Nimble', 'Plucky',
  'Zesty', 'Cosmic', 'Dapper', 'Fuzzy', 'Humble', 'Snappy', 'Breezy', 'Cheery',
];

const ANIMALS = [
  'Fox', 'Otter', 'Panda', 'Falcon', 'Koala', 'Lynx', 'Heron', 'Gecko',
  'Badger', 'Dolphin', 'Owl', 'Walrus', 'Beaver', 'Cobra', 'Ferret', 'Hawk',
  'Llama', 'Moose', 'Newt', 'Raven', 'Seal', 'Tiger', 'Wombat', 'Yak',
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function hashToInteger(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function randomName(): string {
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
}

export function sanitizeName(value: string): string {
  return value.replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
}

export function displayName(name: string): string {
  return name.trim() || 'Anonymous';
}

export function loadStoredName(): string | null {
  try {
    const stored = localStorage.getItem(NAME_KEY);
    return stored && stored.trim() ? sanitizeName(stored) : null;
  } catch {
    return null;
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    void 0;
  }
}

export const COLLAB_COLORS = [
  '#e03131', '#1971c2', '#2f9e44', '#e67700', '#9c36b5', '#0c8599',
  '#d6336c', '#5f3dc4', '#5c940d', '#e8590c', '#087f5b', '#495057',
] as const;

export function isValidColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function initialColorFor(id: string): string {
  return COLLAB_COLORS[hashToInteger(id) % COLLAB_COLORS.length];
}

export function pickFreeColor(taken: string[], preferred: string): string {
  const used = new Set(taken.map(c => c.toLowerCase()));
  if (!used.has(preferred.toLowerCase())) return preferred;
  return COLLAB_COLORS.find(c => !used.has(c)) ?? preferred;
}

export function initialsOf(name: string): string {
  const firstChars = displayName(name)
    .split(' ')
    .map(word => word.match(/[\p{L}\p{N}]/u)?.[0] ?? '')
    .filter(Boolean);
  return (firstChars.slice(0, 2).join('') || '?').toUpperCase();
}
