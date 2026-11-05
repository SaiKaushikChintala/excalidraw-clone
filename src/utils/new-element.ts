import type {
  AppState,
  DrawingElementBase,
  RectangleElement,
  EllipseElement,
  DiamondElement,
  LinearElement,
  FreeDrawElement,
  TextElement,
} from '@/types';
import { DEFAULT_FONT_SIZE } from '@/utils/constants';

let _idCounter = 0;

export function generateId(): string {
  return `el_${Date.now()}_${_idCounter++}`;
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);
}

function base(state: AppState, x: number, y: number): Omit<DrawingElementBase, 'type'> {
  return {
    id: generateId(),
    x,
    y,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: state.strokeColor,
    backgroundColor: state.backgroundColor,
    fillStyle: state.fillStyle,
    strokeWidth: state.strokeWidth,
    strokeStyle: state.strokeStyle,
    roughness: state.roughness,
    roundness: state.roundness,
    opacity: state.opacity,
    seed: generateSeed(),
    isDeleted: false,
    version: 1,
    versionNonce: generateSeed(),
  };
}

export function newRectangle(state: AppState, x: number, y: number): RectangleElement {
  return { ...base(state, x, y), type: 'rectangle' };
}

export function newEllipse(state: AppState, x: number, y: number): EllipseElement {
  return { ...base(state, x, y), type: 'ellipse' };
}

export function newDiamond(state: AppState, x: number, y: number): DiamondElement {
  return { ...base(state, x, y), type: 'diamond' };
}

export function newLinear(
  state: AppState,
  x: number,
  y: number,
  type: 'line' | 'arrow',
): LinearElement {
  return {
    ...base(state, x, y),
    backgroundColor: 'transparent',
    type,
    points: [[x, y], [x, y]],
    arrowType: state.arrowType,
    arrowheadEnd: type === 'arrow' ? state.arrowheadEnd : 'none',
  };
}

export function newFreeDraw(state: AppState, x: number, y: number): FreeDrawElement {
  return {
    ...base(state, x, y),
    type: 'freedraw',
    points: [[x, y]],
    pressures: [0.5],
  };
}

export function newText(state: AppState, x: number, y: number): TextElement {
  const fontSize = state.fontSize || DEFAULT_FONT_SIZE;
  return {
    ...base(state, x, y),
    backgroundColor: 'transparent',
    type: 'text',
    text: '',
    fontSize,
    fontFamily: state.fontFamily,
    textAlign: state.textAlign,
    width: 10,
    height: fontSize * 1.35,
  };
}
