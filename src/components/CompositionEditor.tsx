// Composition editor view that combines canvas and layer panel

import { useState, useEffect } from "react";
import { CompositionData, ProjectItem } from "../types";
import { CompositionCanvas } from "./CompositionCanvas";
import { CompositionLayerPanel } from "./CompositionLayerPanel";

interface CompositionEditorProps {
  composition: CompositionData;
  sprites: ProjectItem[];
  onCompositionUpdate: (updates: Partial<CompositionData>) => void;
  onAddLayer: (spriteId: string, x?: number, y?: number) => void;
  onRemoveLayer: (layerId: string) => void;
  onUpdateLayer: (
    layerId: string,
    updates: Partial<CompositionData["layers"][0]>
  ) => void;
  onDuplicateLayer?: (layerId: string) => void;
}

export function CompositionEditor({
  composition,
  sprites,
  onCompositionUpdate,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayer,
  onDuplicateLayer,
}: CompositionEditorProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(composition.zoom || 1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Save zoom level to composition data when it changes
  useEffect(() => {
    if (composition.zoom !== zoom) {
      onCompositionUpdate({ zoom });
    }
  }, [zoom, composition.zoom, onCompositionUpdate]);

  // Helper function to round zoom to prevent UI breaking
  const roundZoom = (value: number): number => {
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  };

  // Helper function to find next available grid position
  const findNextGridPosition = (
    spriteWidth: number,
    spriteHeight: number,
    gridSize: number = 8
  ): { x: number; y: number } => {
    const maxCols = Math.floor(composition.width / gridSize);
    const maxRows = Math.floor(composition.height / gridSize);

    // Get all occupied positions
    const occupiedPositions = new Set<string>();
    composition.layers.forEach((layer) => {
      const sprite = sprites.find((s) => s.id === layer.spriteId);
      if (sprite?.spriteData) {
        const startCol = Math.floor(layer.x / gridSize);
        const endCol = Math.floor(
          (layer.x + sprite.spriteData.width) / gridSize
        );
        const startRow = Math.floor(layer.y / gridSize);
        const endRow = Math.floor(
          (layer.y + sprite.spriteData.height) / gridSize
        );

        for (let row = startRow; row <= endRow && row < maxRows; row++) {
          for (let col = startCol; col <= endCol && col < maxCols; col++) {
            occupiedPositions.add(`${col},${row}`);
          }
        }
      }
    });

    // Find first available position
    const spriteCols = Math.ceil(spriteWidth / gridSize);
    const spriteRows = Math.ceil(spriteHeight / gridSize);

    for (let row = 0; row <= maxRows - spriteRows; row++) {
      for (let col = 0; col <= maxCols - spriteCols; col++) {
        let canPlace = true;
        for (let r = row; r < row + spriteRows && canPlace; r++) {
          for (let c = col; c < col + spriteCols && canPlace; c++) {
            if (occupiedPositions.has(`${c},${r}`)) {
              canPlace = false;
            }
          }
        }
        if (canPlace) {
          return { x: col * gridSize, y: row * gridSize };
        }
      }
    }

    // If no space found, place at origin
    return { x: 0, y: 0 };
  };

  // Keyboard shortcuts for zoom and duplication
  useEffect(() => {
    const handleDuplicateLayer = () => {
      if (selectedLayerId && onDuplicateLayer) {
        onDuplicateLayer(selectedLayerId);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((prev) => roundZoom(Math.min(8, prev + 0.25)));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoom((prev) => roundZoom(Math.max(0.25, prev - 0.25)));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoom(1); // Reset to 100%
        } else if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          handleDuplicateLayer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayerId, onDuplicateLayer]);

  // Calculate fit-to-screen zoom
  const handleZoomFit = () => {
    // Assuming a typical canvas container size
    const containerWidth = 800;
    const containerHeight = 600;
    const zoomX = containerWidth / composition.width;
    const zoomY = containerHeight / composition.height;
    const fitZoom = Math.min(zoomX, zoomY, 4); // Cap at 4x for readability
    setZoom(roundZoom(Math.max(0.25, fitZoom)));
  };

  return (
    <div className="flex h-full">
      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg font-semibold">
                {composition.name}
              </h2>
              <p className="text-gray-400 text-sm">
                Canvas: {composition.width}×{composition.height} pixels
              </p>
            </div>

            {/* Canvas size controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="canvas-width" className="text-sm text-gray-400">
                  Width:
                </label>
                <input
                  id="canvas-width"
                  type="number"
                  min="64"
                  max="1024"
                  value={composition.width}
                  onChange={(e) =>
                    onCompositionUpdate({
                      width: parseInt(e.target.value) || 256,
                    })
                  }
                  className="w-20 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="canvas-height"
                  className="text-sm text-gray-400"
                >
                  Height:
                </label>
                <input
                  id="canvas-height"
                  type="number"
                  min="64"
                  max="1024"
                  value={composition.height}
                  onChange={(e) =>
                    onCompositionUpdate({
                      height: parseInt(e.target.value) || 256,
                    })
                  }
                  className="w-20 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                />
              </div>

              {/* Zoom controls */}
              <div className="flex items-center space-x-2 border-l border-gray-600 pl-4">
                <label className="text-sm text-gray-400">Zoom:</label>
                <button
                  onClick={() =>
                    setZoom(roundZoom(Math.max(0.25, zoom - 0.25)))
                  }
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
                  disabled={zoom <= 0.25}
                  title="Zoom Out (Ctrl + -)"
                >
                  -
                </button>
                <span className="text-sm text-white w-12 text-center">
                  {roundZoom(zoom)}x
                </span>
                <button
                  onClick={() => setZoom(roundZoom(Math.min(8, zoom + 0.25)))}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
                  disabled={zoom >= 8}
                  title="Zoom In (Ctrl + +)"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                  title="Reset Zoom (Ctrl + 0)"
                >
                  100%
                </button>
                <button
                  onClick={handleZoomFit}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                  title="Fit to Screen"
                >
                  Fit
                </button>
                {/* Zoom presets */}
                <div className="border-l border-gray-600 pl-2 ml-2 flex space-x-1">
                  {[0.25, 0.5, 2, 4].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setZoom(preset)}
                      className={`px-1.5 py-1 text-xs rounded transition-colors ${
                        zoom === preset
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                      title={`Zoom to ${preset * 100}%`}
                    >
                      {preset * 100}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">Grid:</label>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-2 py-1 text-sm rounded ${
                    showGrid
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  {showGrid ? "On" : "Off"}
                </button>
              </div>

              {/* Snap to grid toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">Snap:</label>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={`px-2 py-1 text-sm rounded ${
                    snapToGrid
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                  title="Snap sprites to grid when dragging"
                >
                  {snapToGrid ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-900 overflow-hidden">
          <CompositionCanvas
            composition={composition}
            sprites={sprites}
            selectedLayerId={selectedLayerId}
            onLayerSelect={setSelectedLayerId}
            onLayerUpdate={onUpdateLayer}
            zoom={zoom}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            onZoomChange={setZoom}
          />
        </div>
      </div>

      {/* Layer panel */}
      <CompositionLayerPanel
        layers={composition.layers}
        sprites={sprites}
        selectedLayerId={selectedLayerId}
        onLayerSelect={setSelectedLayerId}
        onLayerUpdate={onUpdateLayer}
        onLayerRemove={onRemoveLayer}
        onLayerAdd={onAddLayer}
        onLayerDuplicate={onDuplicateLayer}
      />
    </div>
  );
}
