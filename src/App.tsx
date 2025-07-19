// Main application component

import React, { useState, useCallback } from 'react';
import { Download, Upload, Save, FolderOpen, Settings } from 'lucide-react';
import { FileExplorer } from './components/FileExplorer';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PreviewWindow } from './components/PreviewWindow';
import { ExportDialog } from './components/ExportDialog';
import { useProject } from './hooks/useProject';
import { useCanvas } from './hooks/useCanvas';
import { DrawingTool, BrushStyle, SpriteData } from "./types";

function App() {
  const {
    project,
    activeItem,
    createSprite,
    createScreen,
    createSpriteWithSize,
    createScreenWithSize,
    createFolder,
    addItem,
    addItemWithSize,
    updateItem,
    resizeItem,
    deleteItem,
    duplicateItem,
    setActiveItemById,
    updateActiveSprite,
    exportProjectData,
    importProjectData,
    newProject,
    moveItem,
  } = useProject();

  const [canvasSettings, setCanvasSettings] = useState({
    zoom: 8,
    showGrid: true,
    tool: "pencil" as DrawingTool,
    eraserSize: 1,
    brushSize: 1,
    brushStyle: "square" as BrushStyle,
  });

  const [showExportDialog, setShowExportDialog] = useState(false);

  // Canvas hook for undo/redo functionality
  const canvasHook = useCanvas({
    pixels: activeItem?.spriteData?.pixels || [],
    onPixelsChange: (pixels) => {
      if (activeItem?.spriteData) {
        updateActiveSprite({ pixels });
      }
    },
    width: activeItem?.spriteData?.width || 128,
    height: activeItem?.spriteData?.height || 64,
  });

  const handleItemCreate = useCallback(
    (type: "sprite" | "screen" | "folder", parentId?: string) => {
      let item;
      switch (type) {
        case "sprite":
          item = createSprite("New Sprite", 8, 8, parentId);
          break;
        case "screen":
          item = createScreen("New Screen", parentId);
          break;
        case "folder":
          item = createFolder("New Folder", parentId);
          break;
      }
      addItem(item);
      if (item.spriteData) {
        setActiveItemById(item.id);
      }
    },
    [createSprite, createScreen, createFolder, addItem, setActiveItemById]
  );

  const handleItemCreateWithSize = useCallback(
    (
      type: "sprite" | "screen",
      width: number,
      height: number,
      parentId?: string
    ) => {
      addItemWithSize(type, width, height, parentId);
    },
    [addItemWithSize]
  );

  const handleItemCreateWithDetails = useCallback(
    (
      type: "sprite" | "screen",
      width: number,
      height: number,
      name: string,
      parentId?: string
    ) => {
      let item;
      if (type === "sprite") {
        item = createSpriteWithSize(name, width, height, parentId);
      } else {
        item = createScreenWithSize(name, width, height, parentId);
      }
      addItem(item);
      if (item.spriteData) {
        setActiveItemById(item.id);
      }
    },
    [createSpriteWithSize, createScreenWithSize, addItem, setActiveItemById]
  );
  const handleItemRename = useCallback(
    (itemId: string, name: string) => {
      updateItem(itemId, { name });
      const item = project.items.find((i) => i.id === itemId);
      if (item?.spriteData) {
        updateItem(itemId, {
          spriteData: { ...item.spriteData, name },
        });
      }
    },
    [updateItem, project.items]
  );

  const handleItemResize = useCallback(
    (itemId: string, width: number, height: number) => {
      resizeItem(itemId, width, height);
    },
    [resizeItem]
  );
  const handleProjectExport = useCallback(() => {
    const data = exportProjectData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportProjectData, project.name]);

  const handleProjectImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result as string;
          if (importProjectData(data)) {
            // Success feedback could be added here
          } else {
            alert("Failed to import project. Please check the file format.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [importProjectData]);

  const handlePixelsChange = useCallback(
    (pixels: boolean[][]) => {
      if (activeItem?.spriteData) {
        updateActiveSprite({ pixels });
      }
    },
    [activeItem, updateActiveSprite]
  );

  // Recursively collect all sprites from the project, including those in folders
  const getAllSprites = (items: typeof project.items): SpriteData[] => {
    const sprites: SpriteData[] = [];

    const collectSprites = (itemList: typeof project.items) => {
      for (const item of itemList) {
        if (item.spriteData) {
          sprites.push(item.spriteData);
        }
        if (item.children) {
          collectSprites(item.children);
        }
      }
    };

    collectSprites(items);
    return sprites;
  };

  const sprites = getAllSprites(project.items);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Arduboy Sprite Editor</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {project.name}
                {project.isModified && (
                  <span className="text-yellow-400 ml-1">*</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={newProject}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
              title="New Project"
            >
              <FolderOpen size={14} className="mr-1" />
              New
            </button>

            <button
              onClick={handleProjectImport}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
              title="Import Project"
            >
              <Upload size={14} className="mr-1" />
              Import
            </button>

            <button
              onClick={handleProjectExport}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
              title="Export Project"
            >
              <Save size={14} className="mr-1" />
              Export
            </button>

            <button
              onClick={() => setShowExportDialog(true)}
              disabled={!activeItem?.spriteData && sprites.length === 0}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm flex items-center"
              title="Export to Arduino Code"
            >
              <Download size={14} className="mr-1" />
              Export Code
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <FileExplorer
          items={project.items}
          activeItemId={activeItem?.id}
          onItemSelect={setActiveItemById}
          onItemCreate={handleItemCreate}
          onItemCreateWithSize={handleItemCreateWithSize}
          onItemCreateWithDetails={handleItemCreateWithDetails}
          onItemDelete={deleteItem}
          onItemDuplicate={duplicateItem}
          onItemRename={handleItemRename}
          onItemResize={handleItemResize}
          onItemMove={moveItem}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeItem?.spriteData ? (
            <>
              {/* Toolbar */}
              <Toolbar
                activeTool={canvasSettings.tool}
                onToolChange={(tool) =>
                  setCanvasSettings((prev) => ({ ...prev, tool }))
                }
                zoom={canvasSettings.zoom}
                onZoomChange={(zoom) =>
                  setCanvasSettings((prev) => ({ ...prev, zoom }))
                }
                showGrid={canvasSettings.showGrid}
                onToggleGrid={() =>
                  setCanvasSettings((prev) => ({
                    ...prev,
                    showGrid: !prev.showGrid,
                  }))
                }
                eraserSize={canvasSettings.eraserSize}
                onEraserSizeChange={(size) =>
                  setCanvasSettings((prev) => ({ ...prev, eraserSize: size }))
                }
                brushSize={canvasSettings.brushSize}
                onBrushSizeChange={(size) =>
                  setCanvasSettings((prev) => ({ ...prev, brushSize: size }))
                }
                brushStyle={canvasSettings.brushStyle}
                onBrushStyleChange={(style) =>
                  setCanvasSettings((prev) => ({ ...prev, brushStyle: style }))
                }
                canUndo={canvasHook.canUndo}
                canRedo={canvasHook.canRedo}
                onUndo={canvasHook.undo}
                onRedo={canvasHook.redo}
              />

              {/* Canvas */}
              <Canvas
                pixels={activeItem.spriteData.pixels}
                onPixelsChange={handlePixelsChange}
                width={activeItem.spriteData.width}
                height={activeItem.spriteData.height}
                tool={canvasSettings.tool}
                zoom={canvasSettings.zoom}
                showGrid={canvasSettings.showGrid}
                eraserSize={canvasSettings.eraserSize}
                brushSize={canvasSettings.brushSize}
                brushStyle={canvasSettings.brushStyle}
                onUndo={canvasHook.undo}
                onRedo={canvasHook.redo}
                onToolChange={(tool) =>
                  setCanvasSettings((prev) => ({
                    ...prev,
                    tool: tool as DrawingTool,
                  }))
                }
                onToggleGrid={() =>
                  setCanvasSettings((prev) => ({
                    ...prev,
                    showGrid: !prev.showGrid,
                  }))
                }
              />
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-semibold mb-2">
                  Welcome to Arduboy Sprite Editor
                </h2>
                <p className="text-lg mb-6">
                  Create pixel-perfect sprites for your Arduboy games
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => handleItemCreate("sprite")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                  >
                    Create New Sprite
                  </button>
                  <button
                    onClick={() => handleItemCreate("screen")}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                  >
                    Create New Screen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Window */}
        <PreviewWindow sprite={activeItem?.spriteData || null} />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        sprites={sprites}
        activeSprite={activeItem?.spriteData || null}
        projectName={project.name}
      />
    </div>
  );
}

export default App;