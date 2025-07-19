// File explorer sidebar component

import React, { useState, useCallback } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Image, 
  Monitor, 
  Plus, 
  Trash2, 
  Copy, 
  Edit3,
  MoreVertical,
  Settings
} from 'lucide-react';
import { ProjectItem } from '../types';
import { SizeSelector } from './SizeSelector';

interface FileExplorerProps {
  items: ProjectItem[];
  activeItemId?: string;
  onItemSelect: (id: string) => void;
  onItemCreate: (type: 'sprite' | 'screen' | 'folder', parentId?: string) => void;
  onItemCreateWithSize: (type: 'sprite' | 'screen', width: number, height: number, parentId?: string) => void;
  onItemDelete: (id: string) => void;
  onItemDuplicate: (id: string) => void;
  onItemRename: (id: string, name: string) => void;
  onItemResize: (id: string, width: number, height: number) => void;
}

export function FileExplorer({
  items,
  activeItemId,
  onItemSelect,
  onItemCreate,
  onItemCreateWithSize,
  onItemDelete,
  onItemDuplicate,
  onItemRename,
  onItemResize
}: FileExplorerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);
  const [sizeSelector, setSizeSelector] = useState<{
    isOpen: boolean;
    type: 'sprite' | 'screen';
    mode: 'create' | 'resize';
    itemId?: string;
    currentWidth: number;
    currentHeight: number;
    parentId?: string;
  } | null>(null);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRename = useCallback((itemId: string, newName: string) => {
    onItemRename(itemId, newName);
    setRenamingItem(null);
  }, [onItemRename]);

  const handleCreateWithSize = useCallback((type: 'sprite' | 'screen', parentId?: string) => {
    const defaultWidth = type === 'sprite' ? 8 : 128;
    const defaultHeight = type === 'sprite' ? 8 : 64;
    
    setSizeSelector({
      isOpen: true,
      type,
      mode: 'create',
      currentWidth: defaultWidth,
      currentHeight: defaultHeight,
      parentId
    });
  }, []);

  const handleResizeItem = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item?.spriteData) return;
    
    setSizeSelector({
      isOpen: true,
      type: item.type as 'sprite' | 'screen',
      mode: 'resize',
      itemId,
      currentWidth: item.spriteData.width,
      currentHeight: item.spriteData.height
    });
  }, [items]);

  const handleSizeChange = useCallback((width: number, height: number) => {
    if (!sizeSelector) return;
    
    if (sizeSelector.mode === 'create') {
      onItemCreateWithSize(sizeSelector.type, width, height, sizeSelector.parentId);
    } else if (sizeSelector.mode === 'resize' && sizeSelector.itemId) {
      onItemResize(sizeSelector.itemId, width, height);
    }
    
    setSizeSelector(null);
  }, [sizeSelector, onItemCreateWithSize, onItemResize]);

  const handleSizeCancel = useCallback(() => {
    setSizeSelector(null);
  }, []);
  const renderItem = (item: ProjectItem, depth: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.id === activeItemId;
    const isRenaming = renamingItem === item.id;

    const getIcon = () => {
      switch (item.type) {
        case 'folder':
          return isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
        case 'screen':
          return <Monitor size={16} />;
        case 'sprite':
          return <Image size={16} />;
      }
    };

    return (
      <div key={item.id}>
        <div
          className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 ${
            isActive ? 'bg-blue-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
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
                if (e.key === 'Enter') {
                  handleRename(item.id, e.currentTarget.value);
                } else if (e.key === 'Escape') {
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

        {item.type === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, depth + 1))}
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
              onClick={() => onItemCreate('folder')}
              className="p-1 hover:bg-gray-700 rounded"
              title="New Folder"
            >
              <Folder size={14} />
            </button>
            <button
              onClick={() => handleCreateWithSize('sprite')}
              className="p-1 hover:bg-gray-700 rounded"
              title="New Sprite"
            >
              <Image size={14} />
            </button>
            <button
              onClick={() => handleCreateWithSize('screen')}
              className="p-1 hover:bg-gray-700 rounded"
              title="New Screen"
            >
              <Monitor size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No items yet</p>
            <p className="text-xs mt-1">Create a sprite or screen to get started</p>
          </div>
        ) : (
          items.map(item => renderItem(item))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0"
            onClick={closeContextMenu}
          />
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
              const item = items.find(i => i.id === contextMenu.itemId);
              return item?.spriteData && (
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
        />
      )}
    </>
  );
}