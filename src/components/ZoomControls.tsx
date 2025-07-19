// Reusable zoom controls component with keyboard shortcuts

import { useEffect, useCallback } from "react";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomFit?: () => void;
  showFitButton?: boolean;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  presets?: number[];
  variant?: "composition" | "toolbar";
  enableScrollZoom?: boolean;
  scrollZoomTarget?: React.RefObject<HTMLElement>;
}

export function ZoomControls({
  zoom,
  onZoomChange,
  onZoomFit,
  showFitButton = false,
  minZoom = 0.25,
  maxZoom = 8,
  zoomStep = 0.25,
  presets = [0.25, 0.5, 2, 4],
  variant = "composition",
  enableScrollZoom = false,
  scrollZoomTarget,
}: ZoomControlsProps) {
  // Helper function to round zoom to prevent UI breaking
  const roundZoom = useCallback((value: number): number => {
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          onZoomChange(roundZoom(Math.min(maxZoom, zoom + zoomStep)));
        } else if (e.key === "-") {
          e.preventDefault();
          onZoomChange(roundZoom(Math.max(minZoom, zoom - zoomStep)));
        } else if (e.key === "0") {
          e.preventDefault();
          onZoomChange(1); // Reset to 100%
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoom, onZoomChange, minZoom, maxZoom, zoomStep, roundZoom]);

  // Scroll zoom functionality
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!enableScrollZoom) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
      onZoomChange(roundZoom(newZoom));
    },
    [
      enableScrollZoom,
      zoomStep,
      zoom,
      minZoom,
      maxZoom,
      onZoomChange,
      roundZoom,
    ]
  );

  useEffect(() => {
    if (!enableScrollZoom || !scrollZoomTarget?.current) return;

    const element = scrollZoomTarget.current;
    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [enableScrollZoom, scrollZoomTarget, handleWheel]);

  if (variant === "toolbar") {
    return (
      <>
        <button
          onClick={() =>
            onZoomChange(roundZoom(Math.max(minZoom, zoom - zoomStep)))
          }
          className="p-2 rounded hover:bg-gray-700 text-gray-300"
          disabled={zoom <= minZoom}
          title="Zoom Out (Ctrl + -)"
        >
          -
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300 min-w-12 text-center">
            {roundZoom(zoom)}x
          </span>
        </div>

        <button
          onClick={() =>
            onZoomChange(roundZoom(Math.min(maxZoom, zoom + zoomStep)))
          }
          className="p-2 rounded hover:bg-gray-700 text-gray-300"
          disabled={zoom >= maxZoom}
          title="Zoom In (Ctrl + +)"
        >
          +
        </button>

        {/* Toolbar-style presets */}
        <div className="flex items-center space-x-1 ml-2">
          {presets.slice(0, 4).map((preset) => (
            <button
              key={preset}
              onClick={() => onZoomChange(preset)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                zoom === preset
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
              title={`Zoom to ${preset}x`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </>
    );
  }

  // Default composition variant
  return (
    <div className="flex items-center space-x-2 border-l border-gray-600 pl-4">
      <label className="text-sm text-gray-400">Zoom:</label>
      <button
        onClick={() =>
          onZoomChange(roundZoom(Math.max(minZoom, zoom - zoomStep)))
        }
        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
        disabled={zoom <= minZoom}
        title="Zoom Out (Ctrl + -)"
      >
        -
      </button>
      <span className="text-sm text-white w-12 text-center">
        {roundZoom(zoom)}x
      </span>
      <button
        onClick={() =>
          onZoomChange(roundZoom(Math.min(maxZoom, zoom + zoomStep)))
        }
        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
        disabled={zoom >= maxZoom}
        title="Zoom In (Ctrl + +)"
      >
        +
      </button>
      <button
        onClick={() => onZoomChange(1)}
        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
        title="Reset Zoom (Ctrl + 0)"
      >
        100%
      </button>
      {showFitButton && onZoomFit && (
        <button
          onClick={onZoomFit}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
          title="Fit to Screen"
        >
          Fit
        </button>
      )}
      {/* Zoom presets */}
      <div className="border-l border-gray-600 pl-2 ml-2 flex space-x-1">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onZoomChange(preset)}
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
  );
}
