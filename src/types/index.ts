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
  type: 'sprite' | 'screen' | 'folder';
  parentId?: string;
  children?: ProjectItem[];
  spriteData?: SpriteData;
  isExpanded?: boolean;
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

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  showGrid: boolean;
  tool: DrawingTool;
  eraserSize: number;
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