// Composition canvas component for arranging sprites and screens

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  CompositionData,
  CompositionLayer,
  SpriteData,
  ProjectItem,
  Point,
} from "../types";

interface CompositionCanvasProps {
  composition: CompositionData;
  sprites: ProjectItem[]; // All available sprites and screens in the project
  onLayerUpdate: (layerId: string, updates: Partial<CompositionLayer>) => void;
  onLayerSelect: (layerId: string | null) => void;
  selectedLayerId: string | null;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  onZoomChange: (zoom: number) => void;
}

export function CompositionCanvas({
  composition,
  sprites,
  onLayerUpdate,
  onLayerSelect,
  selectedLayerId,
  zoom,
  showGrid,
  snapToGrid,
  onZoomChange,
}: CompositionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<Point | null>(null);

  // Helper function to get sprite data by ID
  const getSpriteData = useCallback(
    (spriteId: string): SpriteData | null => {
      const sprite = sprites.find((s) => s.id === spriteId);
      return sprite?.spriteData || null;
    },
    [sprites]
  );

  // Helper function to snap coordinates to grid
  const snapToGridFn = useCallback(
    (value: number, gridSize: number = 8): number => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid]
  );

  // Render the composition
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Helper function to get sprite data
    const getSpriteById = (spriteId: string): SpriteData | null => {
      const sprite = sprites.find((s) => s.id === spriteId);
      return sprite?.spriteData || null;
    };

    // Set canvas size
    canvas.width = composition.width * zoom;
    canvas.height = composition.height * zoom;

    // Clear canvas
    ctx.fillStyle =
      composition.backgroundColor === "black"
        ? "#000000"
        : composition.backgroundColor === "white"
        ? "#ffffff"
        : "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid && zoom >= 2) {
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;

      // Vertical lines
      for (let x = 0; x <= composition.width; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, composition.height * zoom);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= composition.height; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(composition.width * zoom, y * zoom);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // Sort layers by zIndex and render
    const sortedLayers = [...composition.layers].sort(
      (a, b) => a.zIndex - b.zIndex
    );

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      const spriteData = getSpriteById(layer.spriteId);
      if (!spriteData) continue;

      // Draw sprite pixels
      ctx.fillStyle = "#000000";
      for (let y = 0; y < spriteData.height; y++) {
        for (let x = 0; x < spriteData.width; x++) {
          if (spriteData.pixels[y] && spriteData.pixels[y][x]) {
            ctx.fillRect(
              (layer.x + x) * zoom,
              (layer.y + y) * zoom,
              zoom,
              zoom
            );
          }
        }
      }

      // Draw selection outline if selected
      if (layer.id === selectedLayerId) {
        ctx.strokeStyle = "#0080ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          layer.x * zoom,
          layer.y * zoom,
          spriteData.width * zoom,
          spriteData.height * zoom
        );
        ctx.setLineDash([]);
      }
    }
  }, [composition, sprites, selectedLayerId, zoom, showGrid]);

  // Handle mouse events for layer selection and dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);

      // If there's a selected layer, check if we clicked on it first (for dragging)
      if (selectedLayerId) {
        const selectedLayer = composition.layers.find(
          (l) => l.id === selectedLayerId && l.visible
        );
        if (selectedLayer) {
          const spriteData = getSpriteData(selectedLayer.spriteId);
          if (
            spriteData &&
            x >= selectedLayer.x &&
            x < selectedLayer.x + spriteData.width &&
            y >= selectedLayer.y &&
            y < selectedLayer.y + spriteData.height
          ) {
            // Start dragging the selected layer
            setIsDragging(true);
            setDragOffset({ x: x - selectedLayer.x, y: y - selectedLayer.y });
            return;
          }
        }
      }

      // Find the topmost layer at this position for selection
      const sortedLayers = [...composition.layers]
        .sort((a, b) => b.zIndex - a.zIndex) // Reverse order to check top layers first
        .filter((layer) => layer.visible);

      for (const layer of sortedLayers) {
        const spriteData = getSpriteData(layer.spriteId);
        if (!spriteData) continue;

        if (
          x >= layer.x &&
          x < layer.x + spriteData.width &&
          y >= layer.y &&
          y < layer.y + spriteData.height
        ) {
          onLayerSelect(layer.id);
          return;
        }
      }

      // No layer clicked, deselect
      onLayerSelect(null);
    },
    [composition.layers, getSpriteData, onLayerSelect, selectedLayerId, zoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);
      setMousePosition({ x, y });

      // Update cursor style based on what's under the mouse
      if (selectedLayerId && !isDragging) {
        const selectedLayer = composition.layers.find(
          (l) => l.id === selectedLayerId && l.visible
        );
        if (selectedLayer) {
          const spriteData = getSpriteData(selectedLayer.spriteId);
          if (
            spriteData &&
            x >= selectedLayer.x &&
            x < selectedLayer.x + spriteData.width &&
            y >= selectedLayer.y &&
            y < selectedLayer.y + spriteData.height
          ) {
            canvas.style.cursor = "move";
          } else {
            canvas.style.cursor = "default";
          }
        }
      } else if (!isDragging) {
        canvas.style.cursor = "default";
      }

      if (isDragging && selectedLayerId) {
        canvas.style.cursor = "move";
        let newX = x - dragOffset.x;
        let newY = y - dragOffset.y;

        // Apply snapping to grid if enabled
        newX = snapToGridFn(newX);
        newY = snapToGridFn(newY);

        // Constrain to composition bounds
        const selectedLayer = composition.layers.find(
          (l) => l.id === selectedLayerId
        );
        const spriteData = selectedLayer
          ? getSpriteData(selectedLayer.spriteId)
          : null;

        if (spriteData) {
          const constrainedX = Math.max(
            0,
            Math.min(composition.width - spriteData.width, newX)
          );
          const constrainedY = Math.max(
            0,
            Math.min(composition.height - spriteData.height, newY)
          );

          onLayerUpdate(selectedLayerId, { x: constrainedX, y: constrainedY });
        }
      }
    },
    [
      isDragging,
      selectedLayerId,
      dragOffset,
      composition,
      getSpriteData,
      onLayerUpdate,
      zoom,
      snapToGridFn,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = "default";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setMousePosition(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = "default";
    }
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(8, zoom + delta));
      onZoomChange(newZoom);
    },
    [zoom, onZoomChange]
  );

  return (
    <div className="flex-1 bg-gray-900 overflow-auto">
      <div className="p-4">
        <div className="bg-white inline-block p-2 rounded shadow-lg">
          <canvas
            ref={canvasRef}
            className="cursor-crosshair border border-gray-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* Canvas Info */}
        <div className="mt-2 text-sm text-gray-400">
          <p>
            Composition: {composition.width} × {composition.height}
          </p>
          <p>
            Layers: {composition.layers.length} | Zoom: {zoom}x
          </p>
          {mousePosition && (
            <p>
              Position: {mousePosition.x}, {mousePosition.y}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
