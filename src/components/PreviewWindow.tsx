// Preview window component for actual size display

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { SpriteData } from '../types';

interface PreviewWindowProps {
  sprite: SpriteData | null;
}

export function PreviewWindow({ sprite }: PreviewWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(200); // ms per frame

  // Animation playback
  useEffect(() => {
    if (!sprite?.isAnimation || !sprite.frames || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % sprite.frames!.length);
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, animationSpeed, sprite?.frames?.length, sprite?.isAnimation]);

  // Render preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sprite) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to actual Arduboy screen size
    canvas.width = sprite.width;
    canvas.height = sprite.height;

    // Get pixels to display
    let pixelsToShow = sprite.pixels;
    if (sprite.isAnimation && sprite.frames && sprite.frames.length > 0) {
      pixelsToShow = sprite.frames[currentFrame]?.pixels || sprite.pixels;
    }

    // Clear canvas (white background)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw black pixels
    ctx.fillStyle = '#000000';
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        if (pixelsToShow[y] && pixelsToShow[y][x]) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [sprite, currentFrame]);

  if (!sprite) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-white font-semibold mb-4">Preview</h3>
        <div className="bg-gray-700 rounded p-4 text-center">
          <p className="text-gray-400 text-sm">No sprite selected</p>
        </div>
      </div>
    );
  }

  const isAnimation = sprite.isAnimation && sprite.frames && sprite.frames.length > 1;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
      <h3 className="text-white font-semibold mb-4">Preview</h3>
      
      {/* Sprite Info */}
      <div className="mb-4 text-sm text-gray-300">
        <p><strong>Name:</strong> {sprite.name}</p>
        <p><strong>Size:</strong> {sprite.width} × {sprite.height}</p>
        {isAnimation && (
          <p><strong>Frames:</strong> {sprite.frames!.length}</p>
        )}
      </div>

      {/* Preview Canvas */}
      <div className="mb-4">
        <div className="bg-white p-2 rounded inline-block">
          <canvas
            ref={canvasRef}
            className="border border-gray-300"
            style={{ 
              imageRendering: 'pixelated',
              transform: 'scale(2)', // 2x scale for better visibility
              transformOrigin: 'top left',
              width: sprite.width,
              height: sprite.height
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Actual size (2x scale for visibility)</p>
      </div>

      {/* Animation Controls */}
      {isAnimation && (
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentFrame(0)}
              className="p-1 hover:bg-gray-700 rounded text-gray-300"
              title="First Frame"
            >
              <SkipBack size={16} />
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 hover:bg-gray-700 rounded text-gray-300"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={() => setCurrentFrame(sprite.frames!.length - 1)}
              className="p-1 hover:bg-gray-700 rounded text-gray-300"
              title="Last Frame"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-300">
              Frame {currentFrame + 1} of {sprite.frames!.length}
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-300">
              Speed: {animationSpeed}ms
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex justify-center space-x-2">
            <button
              onClick={() => {
                const prev = currentFrame > 0 ? currentFrame - 1 : sprite.frames!.length - 1;
                setCurrentFrame(prev);
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
            >
              Previous
            </button>
            <button
              onClick={() => {
                const next = (currentFrame + 1) % sprite.frames!.length;
                setCurrentFrame(next);
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Pixel Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Statistics</h4>
        <div className="text-xs text-gray-400 space-y-1">
          {(() => {
            const pixels = sprite.isAnimation && sprite.frames && sprite.frames[currentFrame] 
              ? sprite.frames[currentFrame].pixels 
              : sprite.pixels;
            
            const totalPixels = sprite.width * sprite.height;
            const blackPixels = pixels.flat().filter(p => p).length;
            const whitePixels = totalPixels - blackPixels;
            
            return (
              <>
                <p>Total: {totalPixels} pixels</p>
                <p>Black: {blackPixels} ({Math.round(blackPixels / totalPixels * 100)}%)</p>
                <p>White: {whitePixels} ({Math.round(whitePixels / totalPixels * 100)}%)</p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}