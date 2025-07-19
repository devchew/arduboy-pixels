// Canvas management hook for drawing operations

import { useRef, useCallback, useEffect, useState } from 'react';
import { Point, DrawingTool, CanvasState, HistoryState } from '../types';
import * as DrawingUtils from '../utils/drawing';

interface UseCanvasProps {
  pixels: boolean[][];
  onPixelsChange: (pixels: boolean[][]) => void;
  width: number;
  height: number;
}

export function useCanvas({ pixels, onPixelsChange, width, height }: UseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 8,
    offsetX: 0,
    offsetY: 0,
    showGrid: true,
    tool: "pencil",
    eraserSize: 1,
    brushSize: 1,
    brushStyle: "square",
    pencilColor: "black",
  });

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewPixels, setPreviewPixels] = useState<boolean[][] | null>(null);

  // Add current state to history
  const addToHistory = useCallback(
    (newPixels: boolean[][]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        pixels: DrawingUtils.clonePixelGrid(newPixels),
        timestamp: Date.now(),
      });

      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex((prev) => prev + 1);
      }

      setHistory(newHistory);
    },
    [history, historyIndex]
  );

  // Undo operation
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      const previousState = history[historyIndex - 1];
      onPixelsChange(DrawingUtils.clonePixelGrid(previousState.pixels));
    }
  }, [history, historyIndex, onPixelsChange]);

  // Redo operation
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      const nextState = history[historyIndex + 1];
      onPixelsChange(DrawingUtils.clonePixelGrid(nextState.pixels));
    }
  }, [history, historyIndex, onPixelsChange]);

  // Convert screen coordinates to pixel coordinates
  const screenToPixel = useCallback(
    (screenX: number, screenY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((screenX - rect.left) / canvasState.zoom);
      const y = Math.floor((screenY - rect.top) / canvasState.zoom);

      return { x, y };
    },
    [canvasState]
  );

  // Handle drawing operations
  const draw = useCallback(
    (point: Point, tool: DrawingTool, isErasing: boolean = false) => {
      const newPixels = DrawingUtils.clonePixelGrid(pixels);

      switch (tool) {
        case "pencil": {
          // Draw with brush size and style, using selected color
          const size = canvasState.brushSize;
          const style = canvasState.brushStyle;
          const pixelValue = canvasState.pencilColor === "black";

          if (size === 1) {
            DrawingUtils.setPixelAtPoint(newPixels, point, pixelValue);
          } else {
            // Apply brush pattern based on style
            for (
              let dy = -Math.floor(size / 2);
              dy <= Math.floor(size / 2);
              dy++
            ) {
              for (
                let dx = -Math.floor(size / 2);
                dx <= Math.floor(size / 2);
                dx++
              ) {
                const targetPoint = { x: point.x + dx, y: point.y + dy };

                if (style === "round") {
                  // Round brush: check if point is within circle radius
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  if (distance <= size / 2) {
                    DrawingUtils.setPixelAtPoint(
                      newPixels,
                      targetPoint,
                      pixelValue
                    );
                  }
                } else {
                  // Square brush: draw all points in square
                  DrawingUtils.setPixelAtPoint(
                    newPixels,
                    targetPoint,
                    pixelValue
                  );
                }
              }
            }
          }
          break;
        }

        case "eraser": {
          // Draw a square eraser
          const size = canvasState.eraserSize;
          for (
            let dy = -Math.floor(size / 2);
            dy <= Math.floor(size / 2);
            dy++
          ) {
            for (
              let dx = -Math.floor(size / 2);
              dx <= Math.floor(size / 2);
              dx++
            ) {
              DrawingUtils.setPixelAtPoint(
                newPixels,
                { x: point.x + dx, y: point.y + dy },
                false
              );
            }
          }
          break;
        }

        case "fill":
          DrawingUtils.floodFill(
            newPixels,
            point,
            !DrawingUtils.getPixelAtPoint(pixels, point)
          );
          break;
      }

      onPixelsChange(newPixels);
    },
    [
      pixels,
      onPixelsChange,
      canvasState.eraserSize,
      canvasState.brushSize,
      canvasState.brushStyle,
      canvasState.pencilColor,
    ]
  );

  // Handle shape preview
  const updateShapePreview = useCallback((currentPoint: Point) => {
    if (!startPoint) return;
    
    const preview = DrawingUtils.clonePixelGrid(pixels);
    
    switch (canvasState.tool) {
      case 'line':
        DrawingUtils.drawLine(preview, startPoint, currentPoint, true);
        break;
        
      case 'rectangle':
        DrawingUtils.drawRectangle(preview, startPoint, currentPoint, true, false);
        break;
        
      case 'filled-rectangle':
        DrawingUtils.drawRectangle(preview, startPoint, currentPoint, true, true);
        break;
        
      case 'circle': {
        const radius = Math.sqrt((currentPoint.x - startPoint.x) ** 2 + (currentPoint.y - startPoint.y) ** 2);
        DrawingUtils.drawCircle(preview, startPoint, Math.round(radius), true, false);
        break;
      }
        
      case 'filled-circle': {
        const filledRadius = Math.sqrt((currentPoint.x - startPoint.x) ** 2 + (currentPoint.y - startPoint.y) ** 2);
        DrawingUtils.drawCircle(preview, startPoint, Math.round(filledRadius), true, true);
        break;
      }
        
      case 'invert':
        DrawingUtils.invertPixels(preview, startPoint, currentPoint);
        break;
    }
    
    setPreviewPixels(preview);
  }, [pixels, startPoint, canvasState.tool]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = screenToPixel(e.clientX, e.clientY);
    setIsDrawing(true);
    setStartPoint(point);
    
    if (canvasState.tool === 'pencil' || canvasState.tool === 'eraser' || canvasState.tool === 'fill') {
      addToHistory(pixels);
      draw(point, canvasState.tool);
    }
  }, [screenToPixel, canvasState.tool, addToHistory, pixels, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = screenToPixel(e.clientX, e.clientY);
    
    if (isDrawing) {
      if (canvasState.tool === 'pencil' || canvasState.tool === 'eraser') {
        draw(point, canvasState.tool);
      } else if (startPoint) {
        updateShapePreview(point);
      }
    }
  }, [screenToPixel, isDrawing, canvasState.tool, draw, startPoint, updateShapePreview]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const point = screenToPixel(e.clientX, e.clientY);
    
    if (canvasState.tool !== 'pencil' && canvasState.tool !== 'eraser' && canvasState.tool !== 'fill') {
      addToHistory(pixels);
      const newPixels = DrawingUtils.clonePixelGrid(pixels);
      
      switch (canvasState.tool) {
        case 'line':
          DrawingUtils.drawLine(newPixels, startPoint, point, true);
          break;
          
        case 'rectangle':
          DrawingUtils.drawRectangle(newPixels, startPoint, point, true, false);
          break;
          
        case 'filled-rectangle':
          DrawingUtils.drawRectangle(newPixels, startPoint, point, true, true);
          break;
          
        case 'circle': {
          const radius = Math.sqrt((point.x - startPoint.x) ** 2 + (point.y - startPoint.y) ** 2);
          DrawingUtils.drawCircle(newPixels, startPoint, Math.round(radius), true, false);
          break;
        }
          
        case 'filled-circle': {
          const filledRadius = Math.sqrt((point.x - startPoint.x) ** 2 + (point.y - startPoint.y) ** 2);
          DrawingUtils.drawCircle(newPixels, startPoint, Math.round(filledRadius), true, true);
          break;
        }
          
        case 'invert':
          DrawingUtils.invertPixels(newPixels, startPoint, point);
          break;
      }
      
      onPixelsChange(newPixels);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setPreviewPixels(null);
  }, [isDrawing, startPoint, screenToPixel, canvasState.tool, addToHistory, pixels, onPixelsChange]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{
        pixels: DrawingUtils.clonePixelGrid(pixels),
        timestamp: Date.now()
      }]);
      setHistoryIndex(0);
    }
  }, [pixels, history.length]);

  return {
    canvasRef,
    canvasState,
    setCanvasState,
    previewPixels,
    isDrawing,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}