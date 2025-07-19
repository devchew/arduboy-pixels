// Project management hook

import { useState, useCallback, useEffect } from 'react';
import { Project, ProjectItem, SpriteData } from '../types';
import { createEmptyPixelGrid } from '../utils/drawing';

const STORAGE_KEY = 'arduboy-sprite-editor-project';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export function useProject() {
  const [project, setProject] = useState<Project>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load project from storage:", e);
      }
    }

    return createNewProject();
  });

  const [activeItem, setActiveItem] = useState<ProjectItem | null>(() => {
    if (project.activeItemId) {
      return findItemById(project.items, project.activeItemId) || null;
    }
    return null;
  });

  // Auto-save project
  useEffect(() => {
    const interval = setInterval(() => {
      if (project.isModified) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        setProject((prev) => ({ ...prev, isModified: false }));
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [project.isModified]);

  // Save immediately when project changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const markAsModified = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      isModified: true,
      lastModified: new Date(),
    }));
  }, []);

  const createSprite = useCallback(
    (
      name: string,
      width: number = 128,
      height: number = 64,
      parentId?: string
    ): ProjectItem => {
      const sprite: SpriteData = {
        id: generateId(),
        name,
        width,
        height,
        pixels: createEmptyPixelGrid(width, height),
      };

      const item: ProjectItem = {
        id: generateId(),
        name,
        type: "sprite",
        parentId,
        spriteData: sprite,
      };

      return item;
    },
    []
  );

  const createScreen = useCallback(
    (name: string, parentId?: string): ProjectItem => {
      return createSprite(name, 128, 64, parentId);
    },
    [createSprite]
  );

  const createSpriteWithSize = useCallback(
    (
      name: string,
      width: number,
      height: number,
      parentId?: string
    ): ProjectItem => {
      return createSprite(name, width, height, parentId);
    },
    [createSprite]
  );

  const createScreenWithSize = useCallback(
    (
      name: string,
      width: number,
      height: number,
      parentId?: string
    ): ProjectItem => {
      return createSprite(name, width, height, parentId);
    },
    [createSprite]
  );
  const createFolder = useCallback(
    (name: string, parentId?: string): ProjectItem => {
      return {
        id: generateId(),
        name,
        type: "folder",
        parentId,
        children: [],
        isExpanded: true,
      };
    },
    []
  );

  const createUniqueItemName = useCallback(
    (baseName: string, parentId?: string): string => {
      return generateUniqueName(baseName, project.items, parentId);
    },
    [project.items]
  );

  const addItem = useCallback(
    (item: ProjectItem) => {
      setProject((prev) => ({
        ...prev,
        items: addItemToTree(prev.items, item, item.parentId),
      }));
      markAsModified();
    },
    [markAsModified]
  );

  const setActiveItemById = useCallback(
    (itemId: string | null) => {
      if (!itemId) {
        setActiveItem(null);
        setProject((prev) => ({ ...prev, activeItemId: undefined }));
        return;
      }

      const item = findItemById(project.items, itemId);
      if (item) {
        setActiveItem(item);
        setProject((prev) => ({ ...prev, activeItemId: itemId }));
      }
    },
    [project.items]
  );

  const addItemWithSize = useCallback(
    (
      type: "sprite" | "screen",
      width: number,
      height: number,
      parentId?: string
    ) => {
      const baseName = type === "sprite" ? "New Sprite" : "New Screen";
      const uniqueName = generateUniqueName(baseName, project.items, parentId);
      const item =
        type === "sprite"
          ? createSpriteWithSize(uniqueName, width, height, parentId)
          : createScreenWithSize(uniqueName, width, height, parentId);

      addItem(item);
      if (item.spriteData) {
        setActiveItemById(item.id);
      }
    },
    [
      createSpriteWithSize,
      createScreenWithSize,
      addItem,
      setActiveItemById,
      project.items,
    ]
  );
  const updateItem = useCallback(
    (itemId: string, updates: Partial<ProjectItem>) => {
      setProject((prev) => ({
        ...prev,
        items: updateItemInTree(prev.items, itemId, updates),
      }));
      markAsModified();
    },
    [markAsModified]
  );

  const resizeItem = useCallback(
    (itemId: string, width: number, height: number) => {
      const item = findItemById(project.items, itemId);
      if (!item?.spriteData) return;

      // Create new pixel grid with the new dimensions
      const newPixels = createEmptyPixelGrid(width, height);

      // Copy existing pixels that fit in the new dimensions
      const oldPixels = item.spriteData.pixels;
      const copyWidth = Math.min(width, item.spriteData.width);
      const copyHeight = Math.min(height, item.spriteData.height);

      for (let y = 0; y < copyHeight; y++) {
        for (let x = 0; x < copyWidth; x++) {
          if (oldPixels[y] && oldPixels[y][x] !== undefined) {
            newPixels[y][x] = oldPixels[y][x];
          }
        }
      }

      const updatedSpriteData: SpriteData = {
        ...item.spriteData,
        width,
        height,
        pixels: newPixels,
      };

      updateItem(itemId, { spriteData: updatedSpriteData });

      // Update active item if it's the one being resized
      if (activeItem?.id === itemId) {
        setActiveItem((prev) =>
          prev
            ? {
                ...prev,
                spriteData: updatedSpriteData,
              }
            : null
        );
      }
    },
    [project.items, updateItem, activeItem]
  );
  const deleteItem = useCallback(
    (itemId: string) => {
      setProject((prev) => ({
        ...prev,
        items: removeItemFromTree(prev.items, itemId),
        activeItemId:
          prev.activeItemId === itemId ? undefined : prev.activeItemId,
      }));

      if (activeItem?.id === itemId) {
        setActiveItem(null);
      }

      markAsModified();
    },
    [activeItem, markAsModified]
  );

  const duplicateItem = useCallback(
    (itemId: string) => {
      const item = findItemById(project.items, itemId);
      if (!item) return;

      const baseName = `${item.name} Copy`;
      const uniqueName = generateUniqueName(
        baseName,
        project.items,
        item.parentId
      );

      const duplicated: ProjectItem = {
        ...item,
        id: generateId(),
        name: uniqueName,
        spriteData: item.spriteData
          ? {
              ...item.spriteData,
              id: generateId(),
              name: uniqueName,
            }
          : undefined,
      };

      addItem(duplicated);
    },
    [project.items, addItem]
  );

  const updateActiveSprite = useCallback(
    (updates: Partial<SpriteData>) => {
      if (!activeItem?.spriteData) return;

      const updatedSprite = { ...activeItem.spriteData, ...updates };
      updateItem(activeItem.id, { spriteData: updatedSprite });

      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              spriteData: updatedSprite,
            }
          : null
      );
    },
    [activeItem, updateItem]
  );

  const exportProjectData = useCallback(() => {
    return JSON.stringify(project, null, 2);
  }, [project]);

  const importProjectData = useCallback(
    (data: string) => {
      try {
        const imported = JSON.parse(data);
        setProject(imported);
        setActiveItem(null);
        markAsModified();
        return true;
      } catch (e) {
        console.error("Failed to import project:", e);
        return false;
      }
    },
    [markAsModified]
  );

  const newProject = useCallback(() => {
    const fresh = createNewProject();
    setProject(fresh);
    setActiveItem(null);
  }, []);

  const moveItem = useCallback(
    (itemId: string, newParentId?: string) => {
      setProject((prev) => {
        // Find the item to move
        const itemToMove = findItemById(prev.items, itemId);
        if (!itemToMove) return prev;

        // Remove item from its current location
        const itemsWithoutMoved = removeItemFromTree(prev.items, itemId);

        // Update the item's parentId
        const updatedItem = { ...itemToMove, parentId: newParentId };

        // Add item to new location
        const newItems = addItemToTree(
          itemsWithoutMoved,
          updatedItem,
          newParentId
        );

        return {
          ...prev,
          items: newItems,
          isModified: true,
        };
      });
      markAsModified();
    },
    [markAsModified]
  );

  return {
    project,
    activeItem,
    createSprite,
    createScreen,
    createSpriteWithSize,
    createScreenWithSize,
    createFolder,
    createUniqueItemName,
    addItem,
    addItemWithSize,
    updateItem,
    resizeItem,
    deleteItem,
    duplicateItem,
    moveItem,
    setActiveItemById,
    updateActiveSprite,
    exportProjectData,
    importProjectData,
    newProject,
    markAsModified,
  };
}

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateUniqueName(
  baseName: string,
  items: ProjectItem[],
  parentId?: string
): string {
  // Get all items in the same scope (same parent)
  const getAllItemsRecursively = (itemList: ProjectItem[]): ProjectItem[] => {
    let allItems: ProjectItem[] = [];
    for (const item of itemList) {
      allItems.push(item);
      if (item.children) {
        allItems = allItems.concat(getAllItemsRecursively(item.children));
      }
    }
    return allItems;
  };

  const allItems = getAllItemsRecursively(items);
  const siblingsInScope = allItems.filter((item) => item.parentId === parentId);
  const existingNames = siblingsInScope.map((item) => item.name);

  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Find the next available number
  let counter = 1;
  let candidateName = `${baseName}-${counter}`;

  while (existingNames.includes(candidateName)) {
    counter++;
    candidateName = `${baseName}-${counter}`;
  }

  return candidateName;
}

function createNewProject(): Project {
  return {
    id: generateId(),
    name: 'New Project',
    items: [],
    lastModified: new Date(),
    isModified: false
  };
}

function findItemById(items: ProjectItem[], id: string): ProjectItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateItemInTree(items: ProjectItem[], id: string, updates: Partial<ProjectItem>): ProjectItem[] {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return {
        ...item,
        children: updateItemInTree(item.children, id, updates)
      };
    }
    return item;
  });
}

function removeItemFromTree(items: ProjectItem[], id: string): ProjectItem[] {
  return items.filter(item => {
    if (item.id === id) return false;
    if (item.children) {
      item.children = removeItemFromTree(item.children, id);
    }
    return true;
  });
}

function addItemToTree(items: ProjectItem[], itemToAdd: ProjectItem, parentId?: string): ProjectItem[] {
  if (!parentId) {
    // Add to root level
    return [...items, itemToAdd];
  }
  
  return items.map(item => {
    if (item.id === parentId && item.type === 'folder') {
      return {
        ...item,
        children: [...(item.children || []), itemToAdd]
      };
    }
    if (item.children) {
      return {
        ...item,
        children: addItemToTree(item.children, itemToAdd, parentId)
      };
    }
    return item;
  });
}