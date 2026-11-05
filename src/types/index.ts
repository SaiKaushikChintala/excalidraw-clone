export type FillStyle = 'hachure' | 'cross-hatch' | 'solid';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowType = 'sharp' | 'round' | 'elbow';
export type Arrowhead = 'none' | 'arrow' | 'triangle';
export type FontFamily = 'hand-drawn' | 'normal' | 'code';
export type TextAlign = 'left' | 'center' | 'right';
export type ToolType =
  | 'hand'
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'eraser'
  | 'laser';

export type Roundness = 'sharp' | 'round';

export type DrawingElementBase = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  roundness: Roundness;
  opacity: number;
  seed: number;
  isDeleted: boolean;
  version: number;
  versionNonce: number;
  index?: string;
};

export type RectangleElement = DrawingElementBase & {
  type: 'rectangle';
};

export type EllipseElement = DrawingElementBase & {
  type: 'ellipse';
};

export type DiamondElement = DrawingElementBase & {
  type: 'diamond';
};

export type LinearElement = DrawingElementBase & {
  type: 'line' | 'arrow';
  points: Array<[number, number]>;
  arrowType: ArrowType;
  arrowheadEnd: Arrowhead;
};

export type FreeDrawElement = DrawingElementBase & {
  type: 'freedraw';
  points: Array<[number, number]>;
  pressures: number[];
};

export type TextElement = DrawingElementBase & {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
};

export type DrawingElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | LinearElement
  | FreeDrawElement
  | TextElement;

export type ViewTransform = {
  scrollX: number;
  scrollY: number;
  zoom: number;
};

export type AppState = {
  activeTool: ToolType;
  toolLocked: boolean;
  selectedElementIds: Set<string>;
  viewTransform: ViewTransform;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number;
  roundness: Roundness;
  arrowType: ArrowType;
  arrowheadEnd: Arrowhead;
  fontFamily: FontFamily;
  fontSize: number;
  textAlign: TextAlign;
  opacity: number;
  editingElementId: string | null;
  theme: 'light' | 'dark' | 'system';
  canvasBackground: string;
};

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotation';

export type LinearHandle = {
  x: number;
  y: number;
  pointIndex: number;
  insert: boolean;
};

export type LayerOp = 'sendToBack' | 'sendBackward' | 'bringForward' | 'bringToFront';

export type CollabStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type CollabPeer = {
  id: string;
  name: string;
  color: string;
};

export type CollabCursor = {
  x: number;
  y: number;
};

export type RemoteSelection = {
  id: string;
  name: string;
  color: string;
  ids: string[];
};

export type PeerEvent = 'joined' | 'left';

export type LaserPoint = { x: number; y: number; color: string };

export type LocalState = {
  selection: string[];
};

export type Toast = {
  id: number;
  text: string;
};
