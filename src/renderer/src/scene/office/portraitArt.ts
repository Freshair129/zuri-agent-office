import type { OfficeCharacterName } from './cast';
import { getCharacterCanvases } from './character25d';

// Logical layout sizes stay stable; rendering uses high-resolution generated art.
export const PORTRAIT_W = 18;
export const PORTRAIT_H = 28;
export { SCENE_W, SCENE_H } from './character25d';

/** A bust crop from the same person and garment palette used on the floor. */
export async function portraitCanvas(name: OfficeCharacterName): Promise<HTMLCanvasElement> {
  const frames = await getCharacterCanvases(name);
  const canvas = document.createElement('canvas');
  canvas.width = 144; canvas.height = 224;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('A canvas is required to render Zuri portraits.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(frames[0][0], 16, 8, 96, 149, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function paintPortrait(ctx: CanvasRenderingContext2D, name: OfficeCharacterName, scale = 2): Promise<void> {
  const portrait = await portraitCanvas(name);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, PORTRAIT_W * scale, PORTRAIT_H * scale);
  ctx.drawImage(portrait, 0, 0, PORTRAIT_W * scale, PORTRAIT_H * scale);
}
