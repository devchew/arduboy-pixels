// File explorer sidebar component

import React, { useState, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  Image,
  Monitor,
  Layers,
  Trash2,
  Copy,
  Edit3,
  Settings,
} from "lucide-react";
import { ProjectItem } from "../types";
import { SizeSelector } from "./SizeSelector";

interface FileExplorerProps {
  items: ProjectItem[];
  activeItemId?: string;
  onItemSelect: (id: string) => void;
  onItemCreate: (
    type: "sprite" | "screen" | "folder" | "composition",
    parentId?: string
  ) => void;
  onItemCreateWithSize: (
    type: "sprite" | "screen",
    width: number,
    height: number,
    parentId?: string
  ) => void;
  onItemCreateWithDetails: (
    type: "sprite" | "screen",
    width: number,
    height: number,
    name: string,
    parentId?: string
  ) => void;
  onItemDelete: (id: string) => void;
  onItemDuplicate: (id: string) => void;
  onItemRename: (id: string, name: string) => void;
  onItemResize: (id: string, width: number, height: number) => void;
  onItemMove: (itemId: string, newParentId?: string) => void;
}

export function FileExplorer({
  items,
  activeItemId,
  onItemSelect,
  onItemCreate,
  onItemCreateWithSize,
  onItemCreateWithDetails,
  onItemDelete,
  onItemDuplicate,
  onItemRename,
  onItemResize,
  onItemMove,
}: FileExplorerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
  } | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "above" | "below" | "inside" | null
  >(null);
  const [sizeSelector, setSizeSelector] = useState<{
    isOpen: boolean;
    type: "sprite" | "screen";
    mode: "create" | "resize";
    itemId?: string;
    currentWidth: number;
    currentHeight: number;
    parentId?: string;
  } | null>(null);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRename = useCallback(
    (itemId: string, newName: string) => {
      onItemRename(itemId, newName);
      setRenamingItem(null);
    },
    [onItemRename]
  );

  const handleCreateWithSize = useCallback(
    (type: "sprite" | "screen", parentId?: string) => {
      const defaultWidth = type === "sprite" ? 8 : 128;
      const defaultHeight = type === "sprite" ? 8 : 64;

      setSizeSelector({
        isOpen: true,
        type,
        mode: "create",
        currentWidth: defaultWidth,
        currentHeight: defaultHeight,
        parentId,
      });
    },
    []
  );

  const handleResizeItem = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item?.spriteData) return;

      setSizeSelector({
        isOpen: true,
        type: item.type as "sprite" | "screen",
        mode: "resize",
        itemId,
        currentWidth: item.spriteData.width,
        currentHeight: item.spriteData.height,
      });
    },
    [items]
  );

  const handleSizeChange = useCallback(
    (width: number, height: number) => {
      if (!sizeSelector) return;

      if (sizeSelector.mode === "create") {
        onItemCreateWithSize(
          sizeSelector.type,
          width,
          height,
          sizeSelector.parentId
        );
      } else if (sizeSelector.mode === "resize" && sizeSelector.itemId) {
        onItemResize(sizeSelector.itemId, width, height);
      }

      setSizeSelector(null);
    },
    [sizeSelector, onItemCreateWithSize, onItemResize]
  );

  const handleCreateWithDetails = useCallback(
    (width: number, height: number, name: string, parentId?: string) => {
      if (!sizeSelector) return;

      onItemCreateWithDetails(sizeSelector.type, width, height, name, parentId);
      setSizeSelector(null);
    },
    [sizeSelector, onItemCreateWithDetails]
  );

  const getAvailableFolders = useCallback((): ProjectItem[] => {
    const collectFolders = (items: ProjectItem[]): ProjectItem[] => {
      let folders: ProjectItem[] = [];
      for (const item of items) {
        if (item.type === "folder") {
          folders.push(item);
          if (item.children) {
            folders = folders.concat(collectFolders(item.children));
          }
        }
      }
      return folders;
    };
    return collectFolders(items);
  }, [items]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  }, []);

  const handleDragOver = useCallback(
    (
      e: React.DragEvent,
      itemId: string,
      position: "above" | "below" | "inside"
    ) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverItem(itemId);
      setDragOverPosition(position);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null);
    setDragOverPosition(null);
  }, []);

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      targetItemId: string,
      position: "above" | "below" | "inside"
    ) => {
      e.preventDefault();
      const sourceItemId = e.dataTransfer.getData("text/plain");

      if (sourceItemId === targetItemId) return;

      // Prevent dropping an item into its own children
      const isDescendant = (parentId: string, childId: string): boolean => {
        const findItem = (
          items: ProjectItem[],
          id: string
        ): ProjectItem | null => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findItem(item.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const parent = findItem(items, parentId);
        if (!parent || !parent.children) return false;

        const checkChildren = (children: ProjectItem[]): boolean => {
          for (const child of children) {
            if (child.id === childId) return true;
            if (child.children && checkChildren(child.children)) return true;
          }
          return false;
        };

        return checkChildren(parent.children);
      };

      const targetItem = items.find((item) => item.id === targetItemId);
      if (!targetItem) return;

      let newParentId: string | undefined;

      if (position === "inside" && targetItem.type === "folder") {
        if (isDescendant(targetItemId, sourceItemId)) return;
        newParentId = targetItemId;
      } else {
        newParentId = targetItem.parentId;
      }

      onItemMove(sourceItemId, newParentId);

      setDraggedItem(null);
      setDragOverItem(null);
      setDragOverPosition(null);
    },
    [items, onItemMove]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
    setDragOverPosition(null);
  }, []);

  const handleSizeCancel = useCallback(() => {
    setSizeSelector(null);
  }, []);
  const renderItem = (item: ProjectItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.id === activeItemId;
    const isRenaming = renamingItem === item.id;
    const isDragging = draggedItem === item.id;
    const isDragOver = dragOverItem === item.id;

    const getIcon = () => {
      switch (item.type) {
        case "folder":
          return isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
        case "screen":
          return <Monitor size={16} />;
        case "sprite":
          return <Image size={16} />;
        case "composition":
          return <Layers size={16} />;
      }
    };

    // Visual nesting indicators
    const renderNestingLines = () => {
      if (depth === 0) return null;

      const lines = [];
      for (let i = 0; i < depth; i++) {
        lines.push(
          <div
            key={i}
            className="absolute border-l border-gray-600"
            style={{
              left: `${i * 16 + 16}px`,
              top: 0,
              bottom: 0,
              width: "1px",
            }}
          />
        );
      }

      // Horizontal connector line
      lines.push(
        <div
          key="connector"
          className="absolute border-l border-b border-gray-600"
          style={{
            left: `${(depth - 1) * 16 + 16}px`,
            top: "50%",
            width: "12px",
            height: "1px",
            borderTopWidth: 0,
            borderRightWidth: 0,
          }}
        />
      );

      return lines;
    };

    const handleItemDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      let position: "above" | "below" | "inside";
      if (item.type === "folder" && y > height * 0.25 && y < height * 0.75) {
        position = "inside";
      } else if (y < height * 0.5) {
        position = "above";
      } else {
        position = "below";
      }

      handleDragOver(e, item.id, position);
    };

    return (
      <div key={item.id} className="relative">
        {/* Nesting visual indicators */}
        {renderNestingLines()}

        {/* Drop indicator */}
        {isDragOver && dragOverPosition === "above" && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
        )}
        {isDragOver && dragOverPosition === "below" && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
        )}

        <div
          className={`flex items-center px-2 py-1 text-sm cursor-pointer transition-colors relative ${
            isActive ? "bg-blue-600 text-white" : "text-gray-300"
          } ${isDragging ? "opacity-50" : "hover:bg-gray-700"} ${
            isDragOver && dragOverPosition === "inside"
              ? "bg-blue-500/20 border border-blue-500"
              : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleItemDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id, dragOverPosition || "inside")}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (item.type === "folder") {
              toggleExpanded(item.id);
            } else {
              onItemSelect(item.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item.id)}
        >
          <span className="mr-2">{getIcon()}</span>

          {isRenaming ? (
            <input
              type="text"
              defaultValue={item.name}
              className="bg-gray-600 text-white px-1 py-0 text-xs rounded flex-1"
              autoFocus
              onBlur={(e) => handleRename(item.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename(item.id, e.currentTarget.value);
                } else if (e.key === "Escape") {
                  setRenamingItem(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{item.name}</span>
          )}

          {/* Size indicator for sprites/screens */}
          {item.spriteData && (
            <span className="text-xs text-gray-500 ml-2">
              {item.spriteData.width}×{item.spriteData.height}
            </span>
          )}
        </div>

        {item.type === "folder" && isExpanded && item.children && (
          <div>
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-64 bg-gray-800 text-gray-300 flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Project Explorer</h3>
            <div className="flex space-x-1">
              <button
                onClick={() => onItemCreate("folder")}
                className="p-1 hover:bg-gray-700 rounded"
                title="New Folder"
              >
                <Folder size={14} />
              </button>
              <button
                onClick={() => handleCreateWithSize("sprite")}
                className="p-1 hover:bg-gray-700 rounded"
                title="New Sprite"
              >
                <Image size={14} />
              </button>
              <button
                onClick={() => handleCreateWithSize("screen")}
                className="p-1 hover:bg-gray-700 rounded"
                title="New Screen"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => onItemCreate("composition")}
                className="p-1 hover:bg-gray-700 rounded"
                title="New Composition"
              >
                <Layers size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No items yet</p>
              <p className="text-xs mt-1">
                Create a sprite or screen to get started
              </p>
            </div>
          ) : (
            items.map((item) => renderItem(item))
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <>
            <div className="fixed inset-0" onClick={closeContextMenu} />
            <div
              className="fixed bg-gray-700 border border-gray-600 rounded shadow-lg py-1 z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                onClick={() => {
                  setRenamingItem(contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-600 flex items-center"
              >
                <Edit3 size={12} className="mr-2" />
                Rename
              </button>
              <button
                onClick={() => {
                  onItemDuplicate(contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-600 flex items-center"
              >
                <Copy size={12} className="mr-2" />
                Duplicate
              </button>
              <button
                onClick={() => {
                  onItemDelete(contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-1 text-left text-sm hover:bg-gray-600 text-red-400 flex items-center"
              >
                <Trash2 size={12} className="mr-2" />
                Delete
              </button>
              {(() => {
                const item = items.find((i) => i.id === contextMenu.itemId);
                return (
                  item?.spriteData && (
                    <button
                      onClick={() => {
                        handleResizeItem(contextMenu.itemId);
                        closeContextMenu();
                      }}
                      className="w-full px-3 py-1 text-left text-sm hover:bg-gray-600 flex items-center"
                    >
                      <Settings size={12} className="mr-2" />
                      Resize
                    </button>
                  )
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* Size Selector Dialog */}
      {sizeSelector && (
        <SizeSelector
          type={sizeSelector.type}
          currentWidth={sizeSelector.currentWidth}
          currentHeight={sizeSelector.currentHeight}
          onSizeChange={handleSizeChange}
          onCancel={handleSizeCancel}
          isOpen={sizeSelector.isOpen}
          mode={sizeSelector.mode}
          onCreateWithDetails={
            sizeSelector.mode === "create" ? handleCreateWithDetails : undefined
          }
          defaultName={
            sizeSelector.mode === "create"
              ? `New ${sizeSelector.type === "sprite" ? "Sprite" : "Screen"}`
              : undefined
          }
          parentId={sizeSelector.parentId}
          availableFolders={
            sizeSelector.mode === "create" ? getAvailableFolders() : []
          }
        />
      )}
    </>
  );
}