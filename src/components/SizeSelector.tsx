// Size selector component for configuring sprite and screen dimensions

import React, { useState, useEffect } from 'react';
import { Monitor, Image, Check, X, Folder } from 'lucide-react';
import { ProjectItem } from '../types';

interface SizeSelectorProps {
  type: 'sprite' | 'screen';
  currentWidth: number;
  currentHeight: number;
  onSizeChange: (width: number, height: number) => void;
  onCancel?: () => void;
  isOpen: boolean;
  mode?: 'create' | 'resize';
  // For create mode
  onCreateWithDetails?: (width: number, height: number, name: string, parentId?: string) => void;
  defaultName?: string;
  parentId?: string;
  availableFolders?: ProjectItem[];
}

const SPRITE_PRESETS = [
  { label: '8×8 (Tiny)', width: 8, height: 8 },
  { label: '16×16 (Small)', width: 16, height: 16 },
  { label: '32×32 (Medium)', width: 32, height: 32 },
  { label: '64×64 (Large)', width: 64, height: 64 }
];

const SCREEN_PRESETS = [
  { label: 'Fullscreen (128×64)', width: 128, height: 64 },
  { label: 'Half Screen (64×64)', width: 64, height: 64 },
  { label: 'Quarter Screen (64×32)', width: 64, height: 32 }
];

export function SizeSelector({
  type,
  currentWidth,
  currentHeight,
  onSizeChange,
  onCancel,
  isOpen,
  mode = 'create',
  onCreateWithDetails,
  defaultName,
  parentId,
  availableFolders = []
}: SizeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [customWidth, setCustomWidth] = useState<string>(currentWidth.toString());
  const [customHeight, setCustomHeight] = useState<string>(currentHeight.toString());
  const [errors, setErrors] = useState<{ width?: string; height?: string; name?: string }>({});
  
  // New state for create mode
  const [itemName, setItemName] = useState<string>(defaultName || `New ${type === 'sprite' ? 'Sprite' : 'Screen'}`);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(parentId || 'root');

  const presets = type === 'sprite' ? SPRITE_PRESETS : SCREEN_PRESETS;

  // Initialize preset selection based on current dimensions
  useEffect(() => {
    const matchingPreset = presets.find(
      preset => preset.width === currentWidth && preset.height === currentHeight
    );
    
    if (matchingPreset) {
      setSelectedPreset(`${matchingPreset.width}x${matchingPreset.height}`);
    } else {
      setSelectedPreset('custom');
    }
    
    setCustomWidth(currentWidth.toString());
    setCustomHeight(currentHeight.toString());
  }, [currentWidth, currentHeight, presets]);

  // Validate custom dimensions and name
  const validateDimensions = (width: string, height: string, name?: string) => {
    const newErrors: { width?: string; height?: string; name?: string } = {};
    
    const widthNum = parseInt(width);
    const heightNum = parseInt(height);
    
    if (!width || isNaN(widthNum) || widthNum <= 0) {
      newErrors.width = 'Width must be a positive integer';
    } else if (widthNum > 256) {
      newErrors.width = 'Width cannot exceed 256 pixels';
    }
    
    if (!height || isNaN(heightNum) || heightNum <= 0) {
      newErrors.height = 'Height must be a positive integer';
    } else if (heightNum > 256) {
      newErrors.height = 'Height cannot exceed 256 pixels';
    }
    
    // Additional validation for Arduboy constraints
    if (type === 'screen' && widthNum > 128) {
      newErrors.width = 'Screen width cannot exceed 128 pixels (Arduboy limit)';
    }
    
    if (type === 'screen' && heightNum > 64) {
      newErrors.height = 'Screen height cannot exceed 64 pixels (Arduboy limit)';
    }
    
    // Name validation for create mode
    if (mode === 'create' && name !== undefined) {
      if (!name || name.trim().length === 0) {
        newErrors.name = 'Name is required';
      } else if (name.trim().length > 50) {
        newErrors.name = 'Name cannot exceed 50 characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    
    if (presetKey !== 'custom') {
      const preset = presets.find(p => `${p.width}x${p.height}` === presetKey);
      if (preset) {
        setCustomWidth(preset.width.toString());
        setCustomHeight(preset.height.toString());
        setErrors({});
      }
    }
  };

  const handleCustomWidthChange = (value: string) => {
    setCustomWidth(value);
    setSelectedPreset('custom');
    validateDimensions(value, customHeight, mode === 'create' ? itemName : undefined);
  };

  const handleCustomHeightChange = (value: string) => {
    setCustomHeight(value);
    setSelectedPreset('custom');
    validateDimensions(customWidth, value, mode === 'create' ? itemName : undefined);
  };

  const handleNameChange = (value: string) => {
    setItemName(value);
    validateDimensions(customWidth, customHeight, value);
  };

  const handleApply = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    
    if (mode === 'create') {
      if (validateDimensions(customWidth, customHeight, itemName)) {
        if (onCreateWithDetails) {
          // Use the new detailed callback for create mode
          const finalParentId = selectedFolderId === 'root' ? undefined : selectedFolderId;
          onCreateWithDetails(width, height, itemName.trim(), finalParentId);
        } else {
          // Fallback to the old callback
          onSizeChange(width, height);
        }
      }
    } else {
      if (validateDimensions(customWidth, customHeight)) {
        onSizeChange(width, height);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    } else if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const isValid = Object.keys(errors).length === 0 && customWidth && customHeight;
  const hasChanges = parseInt(customWidth) !== currentWidth || parseInt(customHeight) !== currentHeight;
  
  // For create mode, allow apply even without changes (using default values)
  // For resize mode, only allow apply when there are actual changes
  const shouldEnableApply = isValid && (mode === 'create' || hasChanges);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]" onKeyDown={handleKeyDown}>
        <div className="flex items-center mb-4">
          {type === 'sprite' ? <Image size={20} className="mr-2" /> : <Monitor size={20} className="mr-2" />}
          <h3 className="text-lg font-semibold text-white">
            {mode === 'create' ? `Create ${type === 'sprite' ? 'Sprite' : 'Screen'}` : `${type === 'sprite' ? 'Sprite' : 'Screen'} Size`}
          </h3>
        </div>

        {/* Name and Folder Selection (Create Mode Only) */}
        {mode === 'create' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full bg-gray-700 text-white rounded px-3 py-2 border ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:outline-none`}
                placeholder={`${type === 'sprite' ? 'Sprite' : 'Screen'} name`}
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {availableFolders.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Folder size={14} className="inline mr-1" />
                  Folder
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  title="Select folder"
                >
                  <option value="root">Root (No folder)</option>
                  {availableFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Preset Options */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Size Presets
          </label>
          <div className="space-y-2">
            {presets.map((preset) => {
              const presetKey = `${preset.width}x${preset.height}`;
              return (
                <label key={presetKey} className="flex items-center">
                  <input
                    type="radio"
                    name="sizePreset"
                    value={presetKey}
                    checked={selectedPreset === presetKey}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="mr-2 text-blue-600"
                  />
                  <span className="text-gray-300">{preset.label}</span>
                </label>
              );
            })}
            <label className="flex items-center">
              <input
                type="radio"
                name="sizePreset"
                value="custom"
                checked={selectedPreset === 'custom'}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="mr-2 text-blue-600"
              />
              <span className="text-gray-300">Custom Size</span>
            </label>
          </div>
        </div>

        {/* Custom Size Inputs */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Dimensions
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
              <input
                type="number"
                min="1"
                max="256"
                value={customWidth}
                onChange={(e) => handleCustomWidthChange(e.target.value)}
                className={`w-full bg-gray-700 text-white rounded px-3 py-2 border ${
                  errors.width ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:outline-none`}
                placeholder="Width"
              />
              {errors.width && (
                <p className="text-red-400 text-xs mt-1">{errors.width}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
              <input
                type="number"
                min="1"
                max="256"
                value={customHeight}
                onChange={(e) => handleCustomHeightChange(e.target.value)}
                className={`w-full bg-gray-700 text-white rounded px-3 py-2 border ${
                  errors.height ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:outline-none`}
                placeholder="Height"
              />
              {errors.height && (
                <p className="text-red-400 text-xs mt-1">{errors.height}</p>
              )}
            </div>
          </div>
        </div>

        {/* Size Preview */}
        <div className="mb-6 p-3 bg-gray-700 rounded">
          <div className="text-sm text-gray-300 mb-2">Preview:</div>
          <div className="flex items-center justify-between">
            <span className="text-white font-mono">
              {customWidth} × {customHeight} pixels
            </span>
            <div className="text-xs text-gray-400">
              {type === 'sprite' && (
                <>
                  {parseInt(customWidth) * parseInt(customHeight) || 0} total pixels
                </>
              )}
              {type === 'screen' && (
                <>
                  {((parseInt(customWidth) || 0) / 128 * 100).toFixed(1)}% of Arduboy width
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center"
            >
              <X size={16} className="mr-1" />
              Cancel
            </button>
          )}
          <button
            onClick={handleApply}
            disabled={!shouldEnableApply}
            className={`px-4 py-2 rounded flex items-center ${
              shouldEnableApply
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Check size={16} className="mr-1" />
            Apply
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400">
          <p className="mb-1">
            <strong>Tips:</strong>
          </p>
          <ul className="space-y-1">
            <li>• Use presets for common sprite sizes</li>
            <li>• Arduboy screens are limited to 128×64 pixels</li>
            <li>• Larger sprites use more memory on the device</li>
            <li>• Press Enter to apply, Escape to cancel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}