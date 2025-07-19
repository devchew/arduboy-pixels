// Panel for managing composition layers

import { useState } from "react";
import { CompositionLayer, ProjectItem } from "../types";

interface CompositionLayerPanelProps {
  layers: CompositionLayer[];
  sprites: ProjectItem[];
  selectedLayerId: string | null;
  onLayerSelect: (layerId: string | null) => void;
  onLayerUpdate: (layerId: string, updates: Partial<CompositionLayer>) => void;
  onLayerRemove: (layerId: string) => void;
  onLayerAdd: (spriteId: string, x?: number, y?: number) => void;
}

export function CompositionLayerPanel({
  layers,
  sprites,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerRemove,
  onLayerAdd,
}: CompositionLayerPanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Get sprite data by ID
  const getSpriteData = (spriteId: string) => {
    const sprite = sprites.find((s) => s.id === spriteId);
    return sprite?.spriteData || null;
  };

  // Available sprites/screens to add (exclude already added ones)
  const availableSprites = sprites.filter(
    (sprite) =>
      sprite.spriteData && !layers.some((layer) => layer.spriteId === sprite.id)
  );

  // Sort layers by zIndex (top to bottom in UI = high to low zIndex)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleMoveUp = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const higherLayers = layers.filter((l) => l.zIndex > layer.zIndex);
    if (higherLayers.length === 0) return; // Already at top

    const nextHigherLayer = higherLayers.reduce((closest, current) =>
      current.zIndex < closest.zIndex ? current : closest
    );

    // Swap z-indices
    onLayerUpdate(layerId, { zIndex: nextHigherLayer.zIndex });
    onLayerUpdate(nextHigherLayer.id, { zIndex: layer.zIndex });
  };

  const handleMoveDown = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const lowerLayers = layers.filter((l) => l.zIndex < layer.zIndex);
    if (lowerLayers.length === 0) return; // Already at bottom

    const nextLowerLayer = lowerLayers.reduce((closest, current) =>
      current.zIndex > closest.zIndex ? current : closest
    );

    // Swap z-indices
    onLayerUpdate(layerId, { zIndex: nextLowerLayer.zIndex });
    onLayerUpdate(nextLowerLayer.id, { zIndex: layer.zIndex });
  };

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Layers</h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2 py-1 hover:bg-gray-700 rounded text-gray-300 text-lg font-bold"
            title="Add Layer"
          >
            +
          </button>

          {showAddMenu && (
            <>
              <div
                className="fixed inset-0"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded shadow-lg py-1 z-50 min-w-[200px]">
                {availableSprites.length === 0 ? (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No available sprites
                  </div>
                ) : (
                  availableSprites.map((sprite) => (
                    <button
                      key={sprite.id}
                      onClick={() => {
                        onLayerAdd(sprite.id);
                        setShowAddMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-600 text-gray-300"
                    >
                      {sprite.name}
                      {sprite.spriteData && (
                        <span className="text-xs text-gray-500 ml-2">
                          {sprite.spriteData.width}×{sprite.spriteData.height}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {sortedLayers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No layers yet</p>
            <p className="text-xs mt-1">Click + to add sprites</p>
          </div>
        ) : (
          sortedLayers.map((layer, index) => {
            const spriteData = getSpriteData(layer.spriteId);
            const sprite = sprites.find((s) => s.id === layer.spriteId);
            const isSelected = layer.id === selectedLayerId;
            const isTopLayer = index === 0;
            const isBottomLayer = index === sortedLayers.length - 1;

            return (
              <div
                key={layer.id}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-blue-600 border-blue-500"
                    : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                }`}
                onClick={() => onLayerSelect(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerUpdate(layer.id, { visible: !layer.visible });
                        }}
                        className="text-gray-400 hover:text-white text-sm w-6 h-6 flex items-center justify-center"
                        title={layer.visible ? "Hide layer" : "Show layer"}
                      >
                        {layer.visible ? "👁" : "🚫"}
                      </button>
                      <span className="text-white text-sm truncate">
                        {sprite?.name || "Unknown"}
                      </span>
                    </div>

                    {spriteData && (
                      <div className="text-xs text-gray-400 mt-1 ml-8">
                        {spriteData.width}×{spriteData.height} at ({layer.x},{" "}
                        {layer.y})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(layer.id);
                      }}
                      disabled={isTopLayer}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs border border-gray-600 rounded"
                      title="Move Up"
                    >
                      ↑
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(layer.id);
                      }}
                      disabled={isBottomLayer}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs border border-gray-600 rounded"
                      title="Move Down"
                    >
                      ↓
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerRemove(layer.id);
                        if (isSelected) {
                          onLayerSelect(null);
                        }
                      }}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 text-sm border border-gray-600 rounded"
                      title="Remove Layer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Layer Properties */}
      {selectedLayerId &&
        (() => {
          const selectedLayer = layers.find((l) => l.id === selectedLayerId);
          if (!selectedLayer) return null;

          return (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-white font-medium mb-3">Layer Properties</h4>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor={`layer-x-${selectedLayer.id}`}
                      className="block text-xs text-gray-400 mb-1"
                    >
                      X Position
                    </label>
                    <input
                      id={`layer-x-${selectedLayer.id}`}
                      type="number"
                      value={selectedLayer.x}
                      onChange={(e) =>
                        onLayerUpdate(selectedLayer.id, {
                          x: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`layer-y-${selectedLayer.id}`}
                      className="block text-xs text-gray-400 mb-1"
                    >
                      Y Position
                    </label>
                    <input
                      id={`layer-y-${selectedLayer.id}`}
                      type="number"
                      value={selectedLayer.y}
                      onChange={(e) =>
                        onLayerUpdate(selectedLayer.id, {
                          y: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`layer-z-${selectedLayer.id}`}
                    className="block text-xs text-gray-400 mb-1"
                  >
                    Z-Index (Layer Order)
                  </label>
                  <input
                    id={`layer-z-${selectedLayer.id}`}
                    type="number"
                    value={selectedLayer.zIndex}
                    onChange={(e) =>
                      onLayerUpdate(selectedLayer.id, {
                        zIndex: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                  />
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
