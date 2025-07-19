// Export dialog component for generating Arduboy-compatible code

import React, { useState, useEffect } from "react";
import { X, Download, Copy, FileText } from "lucide-react";
import { SpriteData, ExportOptions } from "../types";
import { exportSprite, exportProject, generateMetadata } from "../utils/export";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sprites: SpriteData[];
  activeSprite: SpriteData | null;
  projectName: string;
}

export function ExportDialog({
  isOpen,
  onClose,
  sprites,
  activeSprite,
  projectName,
}: ExportDialogProps) {
  // Default to 'project' mode if there's no active sprite but there are sprites available
  const defaultMode = activeSprite
    ? "single"
    : sprites.length > 0
    ? "project"
    : "single";
  const [exportMode, setExportMode] = useState<"single" | "project">(
    defaultMode
  );
  const [options, setOptions] = useState<ExportOptions>({
    format: "progmem",
    includeDimensions: true,
    includeFrameCount: true,
    variableName: activeSprite
      ? activeSprite.name.toLowerCase().replace(/[^a-z0-9]/g, "_")
      : "sprite",
    compress: false,
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Update export mode when props change
  useEffect(() => {
    const defaultMode = activeSprite
      ? "single"
      : sprites.length > 0
      ? "project"
      : "single";
    setExportMode(defaultMode);
  }, [activeSprite, sprites.length]);

  const handleGenerate = () => {
    let code = "";

    if (exportMode === "single" && activeSprite) {
      code = exportSprite(activeSprite, options);
    } else if (exportMode === "project") {
      code = exportProject(sprites, projectName, {
        format: options.format,
        includeDimensions: options.includeDimensions,
      });
      code += "\n\n" + generateMetadata(sprites);
    }

    setGeneratedCode(code);
    setShowPreview(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleDownload = () => {
    const filename =
      exportMode === "single"
        ? `${options.variableName}.h`
        : `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_sprites.h`;

    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Export Sprites</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 space-x-6 overflow-hidden">
          {/* Settings Panel */}
          <div className="w-80 space-y-4">
            {/* Export Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Export Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="single"
                    checked={exportMode === "single"}
                    onChange={(e) => setExportMode(e.target.value as "single")}
                    className="mr-2"
                    disabled={!activeSprite}
                  />
                  <span className="text-gray-300">Single Sprite</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="project"
                    checked={exportMode === "project"}
                    onChange={(e) => setExportMode(e.target.value as "project")}
                    className="mr-2"
                    disabled={sprites.length === 0}
                  />
                  <span className="text-gray-300">Entire Project</span>
                </label>
              </div>
            </div>

            {/* Single Sprite Options */}
            {exportMode === "single" && activeSprite && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        format: e.target.value as any,
                      }))
                    }
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                  >
                    <option value="progmem">PROGMEM (Flash Storage)</option>
                    <option value="const">const (RAM)</option>
                    <option value="raw">Raw Data</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Variable Name
                  </label>
                  <input
                    type="text"
                    value={options.variableName}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        variableName: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                    placeholder="sprite_name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeDimensions}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          includeDimensions: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-gray-300">Include Dimensions</span>
                  </label>

                  {activeSprite.isAnimation && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.includeFrameCount}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            includeFrameCount: e.target.checked,
                          }))
                        }
                        className="mr-2"
                      />
                      <span className="text-gray-300">Include Frame Count</span>
                    </label>
                  )}
                </div>
              </>
            )}

            {/* Project Export Options */}
            {exportMode === "project" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        format: e.target.value as any,
                      }))
                    }
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                  >
                    <option value="progmem">PROGMEM (Flash Storage)</option>
                    <option value="const">const (RAM)</option>
                    <option value="raw">Raw Data</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeDimensions}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          includeDimensions: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-gray-300">Include Dimensions</span>
                  </label>
                </div>
              </>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={
                (exportMode === "single" && !activeSprite) ||
                (exportMode === "project" && sprites.length === 0)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded flex items-center justify-center"
            >
              <FileText size={16} className="mr-2" />
              Generate Code
            </button>

            {/* Info Panel */}
            <div className="bg-gray-700 rounded p-3 text-sm text-gray-300">
              <h4 className="font-semibold mb-2">Export Info</h4>
              {exportMode === "single" && activeSprite ? (
                <div className="space-y-1">
                  <p>Sprite: {activeSprite.name}</p>
                  <p>
                    Size: {activeSprite.width} × {activeSprite.height}
                  </p>
                  {activeSprite.isAnimation && (
                    <p>Frames: {activeSprite.frames?.length || 0}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p>Total Sprites: {sprites.length}</p>
                  <p>
                    Screens:{" "}
                    {
                      sprites.filter((s) => s.width === 128 && s.height === 64)
                        .length
                    }
                  </p>
                  <p>
                    Animations: {sprites.filter((s) => s.isAnimation).length}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Code Preview */}
          <div className="flex-1 flex flex-col">
            {showPreview ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-white">
                    Generated Code
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopyToClipboard}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center"
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownload}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                <pre className="flex-1 bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm font-mono">
                  {generatedCode}
                </pre>
              </>
            ) : (
              <div className="flex-1 bg-gray-700 rounded flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Click "Generate Code" to preview the export</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}