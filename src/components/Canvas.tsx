// Main drawing canvas component

import React, { useEffect, useRef } from 'react';
import { useCanvas } from '../hooks/useCanvas';

interface CanvasProps {
  pixels: boolean[][];
  onPixelsChange: (pixels: boolean[][]) => void;
  width: number;
  height: number;
  tool: string;
  zoom: number;
  showGrid: boolean;
  eraserSize: number;
  onUndo: () => void;
  onRedo: () => void;
  onToolChange: (tool: string) => void;
  onToggleGrid: () => void;
}

export function Canvas({
  pixels,
  onPixelsChange,
  width,
  height,
  tool,
  zoom,
  showGrid,
  eraserSize,
  onUndo,
  onRedo,
  onToolChange,
  onToggleGrid
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    canvasState,
    setCanvasState,
    previewPixels,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useCanvas({
    pixels,
    onPixelsChange,
    width,
    height
  });

  // Sync external props with internal state
  useEffect(() => {
    setCanvasState(prev => ({
      ...prev,
      tool: tool as any,
      zoom,
      showGrid,
      eraserSize
    }));
  }, [tool, zoom, showGrid, eraserSize, setCanvasState]);

  // Update canvas ref in the hook
  useEffect(() => {
    if (canvasRef.current) {
      // Ensure the canvas hook has access to the canvas ref
      Object.assign(canvasHook.canvasRef, { current: canvasRef.current });
    }
  }, [canvasHook.canvasRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              onRedo();
            } else {
              onUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            onRedo();
            break;
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'p':
            onToolChange('pencil');
            break;
          case 'e':
            onToolChange('eraser');
            break;
          case 'f':
            onToolChange('fill');
            break;
          case 'l':
            onToolChange('line');
            break;
          case 'r':
            onToolChange('rectangle');
            break;
          case 'c':
            onToolChange('circle');
            break;
          case 'i':
            onToolChange('invert');
            break;
          case 'g':
            onToggleGrid();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onToolChange, onToggleGrid]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayPixels = previewPixels || pixels;
    
    // Set canvas size
    canvas.width = width * zoom;
    canvas.height = height * zoom;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    ctx.fillStyle = '#000000';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (displayPixels[y] && displayPixels[y][x]) {
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
    }

    // Draw grid
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.5;

      // Vertical lines
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, height * zoom);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(width * zoom, y * zoom);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }, [pixels, previewPixels, width, height, zoom, showGrid]);

  // Handle mouse leave to stop drawing
  const handleMouseLeave = () => {
    // Reset any drawing state when mouse leaves canvas
  };

  return (
    <div ref={containerRef} className="flex-1 bg-gray-900 overflow-auto">
      <div className="p-4">
        <div className="bg-white inline-block p-2 rounded shadow-lg">
          <canvas
            ref={canvasRef}
            className="cursor-crosshair border border-gray-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
        
        {/* Canvas Info */}
        <div className="mt-2 text-sm text-gray-400">
          <p>Canvas: {width} × {height} pixels</p>
          <p>Zoom: {zoom}x | Tool: {tool}</p>
        </div>
      </div>
    </div>
  );
}