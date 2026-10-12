export type ToolType = 
  | 'select' 
  | 'pen' 
  | 'eraser' 
  | 'line' 
  | 'rectangle' 
  | 'ellipse' 
  | 'arrow' 
  | 'text' 
  | 'sticky-note' 
  | 'image' 
  | 'laser-pointer'
  | 'hand';

export type UserRole = 'teacher' | 'student';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface BaseElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface EraserElement extends BaseElement {
  type: 'eraser';
  points: Point[];
  strokeWidth: number;
}

export interface ShapeElement extends BaseElement {
  type: 'line' | 'rectangle' | 'ellipse' | 'arrow';
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
  startPoint?: Point;
  endPoint?: Point;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface StickyNoteElement extends BaseElement {
  type: 'sticky-note';
  content: string;
  color: string;
  fontSize: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  originalWidth: number;
  originalHeight: number;
}

export interface LaserPointerElement extends BaseElement {
  type: 'laser-pointer';
  points: Point[];
  color: string;
  fadeAt: number;
}

export type WhiteboardElement = 
  | PenElement 
  | EraserElement 
  | ShapeElement 
  | TextElement 
  | StickyNoteElement 
  | ImageElement 
  | LaserPointerElement;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  color: string;
  cursor?: Point;
  lastActive: number;
  isOnline: boolean;
}

export interface Room {
  id: string;
  name: string;
  teacherId: string;
  students: string[];
  createdAt: number;
  settings: RoomSettings;
}

export interface RoomSettings {
  allowStudentDraw: boolean;
  allowStudentChat: boolean;
  readOnly: boolean;
  gridEnabled: boolean;
  snapToGrid: boolean;
}

export interface CanvasState {
  elements: WhiteboardElement[];
  selectedIds: string[];
  transform: Transform;
  tool: ToolType;
  toolSettings: ToolSettings;
  history: WhiteboardElement[][];
  historyIndex: number;
}

export interface ToolSettings {
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  opacity: number;
  fontSize: number;
  fontFamily: string;
}

export interface WSMessage {
  type: string;
  payload: unknown;
  userId: string;
  roomId: string;
  timestamp: number;
}

export interface WSEvents {
  'join-room': { roomId: string; user: User };
  'leave-room': { roomId: string; userId: string };
  'user-joined': { user: User };
  'user-left': { userId: string };
  'cursor-move': { userId: string; cursor: Point; name: string; color: string };
  'element-create': { element: WhiteboardElement };
  'element-update': { element: WhiteboardElement };
  'element-delete': { elementId: string };
  'elements-sync': { elements: WhiteboardElement[] };
  'selection-change': { userId: string; selectedIds: string[] };
  'canvas-transform': { userId: string; transform: Transform };
  'tool-change': { userId: string; tool: ToolType; settings: ToolSettings };
  'clear-canvas': { userId: string };
  'undo': { userId: string };
  'redo': { userId: string };
  'chat-message': { userId: string; userName: string; message: string; timestamp: number };
  'room-settings-update': { settings: RoomSettings };
  'kick-user': { userId: string; targetId: string };
  'grant-permission': { userId: string; targetId: string; permission: 'draw' | 'chat' };
  'revoke-permission': { userId: string; targetId: string; permission: 'draw' | 'chat' };
  'error': { message: string; code: string };
}

export type WSMessageType = keyof WSEvents;

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
  autoSave: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  shortcutsEnabled: boolean;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  strokeColor: '#3b82f6',
  strokeWidth: 2,
  fillColor: 'transparent',
  opacity: 1,
  fontSize: 16,
  fontFamily: 'Inter',
};

export const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#eab308', '#ffffff', '#000000', '#64748b'
];

export const STROKE_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
export const FONT_FAMILIES = ['Inter', 'JetBrains Mono', 'Arial', 'Georgia', 'Verdana'];

export const GRID_SIZE = 20;