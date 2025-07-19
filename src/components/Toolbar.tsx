// Drawing tools toolbar component

import React from 'react';
import {
  Pencil,
  Eraser,
  PaintBucket,
  Minus,
  Square,
  Circle,
  RotateCcw,
  RotateCw,
  Grid3X3,
  Clover as Invert,
} from "lucide-react";
import { DrawingTool, BrushStyle } from "../types";
import { ZoomControls } from "./ZoomControls";

interface ToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushStyle: BrushStyle;
  onBrushStyleChange: (style: BrushStyle) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  enableScrollZoom?: boolean;
  scrollZoomTarget?: React.RefObject<HTMLElement>;
}

const tools: {
  id: DrawingTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}[] = [
  { id: "pencil", icon: <Pencil size={18} />, label: "Pencil", shortcut: "P" },
  { id: "eraser", icon: <Eraser size={18} />, label: "Eraser", shortcut: "E" },
  { id: "fill", icon: <PaintBucket size={18} />, label: "Fill", shortcut: "F" },
  { id: "line", icon: <Minus size={18} />, label: "Line", shortcut: "L" },
  {
    id: "rectangle",
    icon: <Square size={18} />,
    label: "Rectangle",
    shortcut: "R",
  },
  {
    id: "filled-rectangle",
    icon: <Square size={18} />,
    label: "Filled Rectangle",
  },
  { id: "circle", icon: <Circle size={18} />, label: "Circle", shortcut: "C" },
  { id: "filled-circle", icon: <Circle size={18} />, label: "Filled Circle" },
  {
    id: "invert",
    icon: <Invert size={18} />,
    label: "Invert Selection",
    shortcut: "I",
  },
];

export function Toolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  eraserSize,
  onEraserSizeChange,
  brushSize,
  onBrushSizeChange,
  brushStyle,
  onBrushStyleChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  enableScrollZoom,
  scrollZoomTarget,
}: ToolbarProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex items-center space-x-4">
        {/* History Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded ${
              canUndo
                ? "hover:bg-gray-700 text-gray-300"
                : "text-gray-600 cursor-not-allowed"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded ${
              canRedo
                ? "hover:bg-gray-700 text-gray-300"
                : "text-gray-600 cursor-not-allowed"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Drawing Tools */}
        <div className="flex items-center space-x-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-2 rounded ${
                activeTool === tool.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
              title={`${tool.label}${
                tool.shortcut ? ` (${tool.shortcut})` : ""
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Eraser Size (only shown when eraser is active) */}
        {activeTool === "eraser" && (
          <>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Size:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={eraserSize}
                onChange={(e) => onEraserSizeChange(parseInt(e.target.value))}
                className="w-16"
                title="Eraser Size"
              />
              <span className="text-sm text-gray-300 w-6">{eraserSize}</span>
            </div>
            <div className="w-px h-6 bg-gray-600" />
          </>
        )}

        {/* Brush Controls (only shown when pencil is active) */}
        {activeTool === "pencil" && (
          <>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Brush:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-16"
                title="Brush Size"
              />
              <span className="text-sm text-gray-300 w-6">{brushSize}</span>

              <div className="flex space-x-1">
                <button
                  onClick={() => onBrushStyleChange("square")}
                  className={`p-1 rounded text-xs ${
                    brushStyle === "square"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                  title="Square Brush"
                >
                  <Square size={14} />
                </button>
                <button
                  onClick={() => onBrushStyleChange("round")}
                  className={`p-1 rounded text-xs ${
                    brushStyle === "round"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                  title="Round Brush"
                >
                  <Circle size={14} />
                </button>
              </div>
            </div>
            <div className="w-px h-6 bg-gray-600" />
          </>
        )}

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <ZoomControls
            zoom={zoom}
            onZoomChange={onZoomChange}
            minZoom={1}
            maxZoom={128}
            zoomStep={1}
            presets={[1, 2, 4, 8, 64]}
            variant="toolbar"
            enableScrollZoom={enableScrollZoom}
            scrollZoomTarget={scrollZoomTarget}
          />

          <button
            onClick={onToggleGrid}
            className={`p-2 rounded ${
              showGrid
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
            title="Toggle Grid (G)"
          >
            <Grid3X3 size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        {/* Quick Actions */}
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">
            Ctrl+Z: Undo | Ctrl+Y: Redo | G: Grid
          </span>
        </div>
      </div>
    </div>
  );
}