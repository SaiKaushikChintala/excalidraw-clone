import type { AppState } from '@/types';

export const COLORS = {
  stroke: ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00'] as const,
  background: ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99'] as const,
};

export const INITIAL_APP_STATE: AppState = {
  activeTool: 'select',
  toolLocked: false,
  selectedElementIds: new Set(),
  viewTransform: { scrollX: 0, scrollY: 0, zoom: 1 },
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  roundness: 'sharp' as const,
  arrowType: 'round' as const,
  arrowheadEnd: 'arrow' as const,
  fontFamily: 'hand-drawn' as const,
  fontSize: 20,
  textAlign: 'left' as const,
  opacity: 100,
  editingElementId: null,
  theme: 'system',
  canvasBackground: '#ffffff',
};

export const CANVAS_BACKGROUNDS = [
  { label: 'White', color: '#ffffff' },
  { label: 'Slate', color: '#f8f9fa' },
  { label: 'Blue', color: '#f5faff' },
  { label: 'Yellow', color: '#fffce8' },
  { label: 'Bronze', color: '#fdf8f6' },
] as const;

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 30;

export const HANDLE_SIZE = 8;
export const ROTATION_HANDLE_OFFSET = 24;
export const SELECTION_THRESHOLD = 8;
export const DRAG_THRESHOLD = 3;
export const DEFAULT_FONT_SIZE = 20;
