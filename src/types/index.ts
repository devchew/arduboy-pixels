// Core type definitions for the Arduboy sprite editor

export interface Point {
  x: number;
  y: number;
}

export interface SpriteData {
  id: string;
  name: string;
  width: number;
  height: number;
  pixels: boolean[][]; // true = black pixel, false = white pixel
  frames?: SpriteFrame[];
  isAnimation?: boolean;
}

export interface SpriteFrame {
  id: string;
  pixels: boolean[][];
  duration?: number; // milliseconds
}

export interface ProjectItem {
  id: string;
  name: string;
  type: "sprite" | "screen" | "folder" | "composition";
  parentId?: string;
  children?: ProjectItem[];
  spriteData?: SpriteData;
  compositionData?: CompositionData;
  isExpanded?: boolean;
}

export interface CompositionLayer {
  id: string;
  spriteId: string; // Reference to a sprite or screen in the project
  x: number;
  y: number;
  zIndex: number; // Layer order, higher = on top
  visible: boolean;
  opacity?: number; // For future use
}

export interface CompositionData {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: CompositionLayer[];
  backgroundColor: "transparent" | "black" | "white";
  zoom?: number; // Store zoom level for composition
}

export interface Project {
  id: string;
  name: string;
  items: ProjectItem[];
  activeItemId?: string;
  lastModified: Date;
  isModified: boolean;
}

export type DrawingTool = 
  | 'pencil' 
  | 'eraser' 
  | 'fill' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'filled-rectangle' 
  | 'filled-circle'
  | 'invert';

export type BrushStyle = 'square' | 'round';

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  showGrid: boolean;
  tool: DrawingTool;
  eraserSize: number;
  brushSize: number;
  brushStyle: BrushStyle;
}

export interface HistoryState {
  pixels: boolean[][];
  timestamp: number;
}

export interface ExportOptions {
  format: 'progmem' | 'const' | 'raw';
  includeDimensions: boolean;
  includeFrameCount: boolean;
  variableName: string;
  compress: boolean;
}