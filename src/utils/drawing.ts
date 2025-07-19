// Drawing utility functions for the canvas

import { Point, SpriteData } from '../types';

export function createEmptyPixelGrid(width: number, height: number): boolean[][] {
  return Array(height).fill(null).map(() => Array(width).fill(false));
}

export function clonePixelGrid(pixels: boolean[][]): boolean[][] {
  return pixels.map(row => [...row]);
}

export function getPixelAtPoint(pixels: boolean[][], point: Point): boolean {
  if (point.y < 0 || point.y >= pixels.length || point.x < 0 || point.x >= pixels[0].length) {
    return false;
  }
  return pixels[point.y][point.x];
}

export function setPixelAtPoint(pixels: boolean[][], point: Point, value: boolean): void {
  if (point.y >= 0 && point.y < pixels.length && point.x >= 0 && point.x < pixels[0].length) {
    pixels[point.y][point.x] = value;
  }
}

export function drawLine(pixels: boolean[][], start: Point, end: Point, value: boolean): void {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const sx = start.x < end.x ? 1 : -1;
  const sy = start.y < end.y ? 1 : -1;
  let err = dx - dy;

  let x = start.x;
  let y = start.y;

  while (true) {
    setPixelAtPoint(pixels, { x, y }, value);

    if (x === end.x && y === end.y) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

export function drawRectangle(
  pixels: boolean[][], 
  start: Point, 
  end: Point, 
  value: boolean, 
  filled: boolean = false
): void {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        setPixelAtPoint(pixels, { x, y }, value);
      }
    }
  } else {
    // Draw outline
    for (let x = minX; x <= maxX; x++) {
      setPixelAtPoint(pixels, { x, y: minY }, value);
      setPixelAtPoint(pixels, { x, y: maxY }, value);
    }
    for (let y = minY; y <= maxY; y++) {
      setPixelAtPoint(pixels, { x: minX, y }, value);
      setPixelAtPoint(pixels, { x: maxX, y }, value);
    }
  }
}

export function drawCircle(
  pixels: boolean[][], 
  center: Point, 
  radius: number, 
  value: boolean, 
  filled: boolean = false
): void {
  if (filled) {
    for (let y = center.y - radius; y <= center.y + radius; y++) {
      for (let x = center.x - radius; x <= center.x + radius; x++) {
        const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
        if (distance <= radius) {
          setPixelAtPoint(pixels, { x, y }, value);
        }
      }
    }
  } else {
    // Bresenham's circle algorithm
    let x = radius;
    let y = 0;
    let err = 0;

    while (x >= y) {
      setPixelAtPoint(pixels, { x: center.x + x, y: center.y + y }, value);
      setPixelAtPoint(pixels, { x: center.x + y, y: center.y + x }, value);
      setPixelAtPoint(pixels, { x: center.x - y, y: center.y + x }, value);
      setPixelAtPoint(pixels, { x: center.x - x, y: center.y + y }, value);
      setPixelAtPoint(pixels, { x: center.x - x, y: center.y - y }, value);
      setPixelAtPoint(pixels, { x: center.x - y, y: center.y - x }, value);
      setPixelAtPoint(pixels, { x: center.x + y, y: center.y - x }, value);
      setPixelAtPoint(pixels, { x: center.x + x, y: center.y - y }, value);

      if (err <= 0) {
        y += 1;
        err += 2 * y + 1;
      }
      if (err > 0) {
        x -= 1;
        err -= 2 * x + 1;
      }
    }
  }
}

export function floodFill(pixels: boolean[][], start: Point, targetValue: boolean): void {
  const originalValue = getPixelAtPoint(pixels, start);
  if (originalValue === targetValue) return;

  const stack: Point[] = [start];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const point = stack.pop()!;
    const key = `${point.x},${point.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);

    if (getPixelAtPoint(pixels, point) !== originalValue) continue;
    
    setPixelAtPoint(pixels, point, targetValue);

    // Add adjacent points
    const adjacent = [
      { x: point.x + 1, y: point.y },
      { x: point.x - 1, y: point.y },
      { x: point.x, y: point.y + 1 },
      { x: point.x, y: point.y - 1 }
    ];

    for (const adj of adjacent) {
      if (!visited.has(`${adj.x},${adj.y}`) && 
          adj.x >= 0 && adj.x < pixels[0].length && 
          adj.y >= 0 && adj.y < pixels.length) {
        stack.push(adj);
      }
    }
  }
}

export function invertPixels(pixels: boolean[][], start: Point, end: Point): void {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (y >= 0 && y < pixels.length && x >= 0 && x < pixels[0].length) {
        pixels[y][x] = !pixels[y][x];
      }
    }
  }
}