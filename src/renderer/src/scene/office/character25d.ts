import frontUrl from '@/assets/office-2.5d/characters-front-v2.png?url';
import backUrl from '@/assets/office-2.5d/characters-back-v2.png?url';
import atlases from '@/assets/office-2.5d/characters-atlases-v2.json';
import profiles from '@/assets/office-2.5d/characters-profiles.json';
import directions from '@/assets/office-2.5d/characters-directions-v2.json';
import type { OfficeCharacterName } from './cast';

/** Native texture dimensions; the scene controls the displayed world size. */
export const SCENE_W = 128;
export const SCENE_H = 224;
const BODY_HEIGHT = 208;
type FrameRect = readonly number[];
const imageCache = new Map<string, Promise<HTMLImageElement>>();
const frameCache = new Map<string, Promise<HTMLCanvasElement[][]>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  let pending = imageCache.get(url);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { imageCache.delete(url); reject(new Error('Could not load Zuri character artwork.')); };
      image.src = url;
    });
    imageCache.set(url, pending);
  }
  return pending;
}

/** Runtime garment variation only. Generated PNG files remain unchanged.
 * Blue fabric is isolated by channel differences; skin, hair and shoes retain
 * their original colors and every alpha value is preserved. */
function colorGarment(ctx: CanvasRenderingContext2D, garment: string): void {
  const pixels = ctx.getImageData(0, 0, SCENE_W, SCENE_H);
  const palette = [1, 3, 5].map(offset => parseInt(garment.slice(offset, offset + 2), 16));
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2], a = pixels.data[i + 3];
    if (a < 16 || b - r <= 8 || b <= g * 1.015 || b <= r * 1.08) continue;
    const shade = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 105;
    for (let channel = 0; channel < 3; channel++) {
      pixels.data[i + channel] = Math.min(255, Math.round(palette[channel] * shade));
    }
  }
  ctx.putImageData(pixels, 0, 0);
}

function renderFrame(image: HTMLImageElement, rect: FrameRect, referenceHeight: number, garment: string, mirror: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('A canvas is required to render Zuri characters.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const scale = Math.min(BODY_HEIGHT / referenceHeight, (SCENE_W - 2) / rect[2]);
  const width = rect[2] * scale;
  const height = rect[3] * scale;
  if (mirror) { ctx.translate(SCENE_W, 0); ctx.scale(-1, 1); }
  ctx.drawImage(image, rect[0], rect[1], rect[2], rect[3], (SCENE_W - width) / 2, SCENE_H - height, width, height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  colorGarment(ctx, garment);
  return canvas;
}

/** Reference-camera rows: south/front, north/back, east/profile, reflected west.
 * Each row is idle, stride A/B, seated A/B, read A/B. Pods and café seats face
 * north or south; side rows retain a front seated fallback. Read aliases seated
 * hands. The scene owns perspective size and chair alignment, not this loader. */
export function getCharacterCanvases(name: OfficeCharacterName): Promise<HTMLCanvasElement[][]> {
  const key = name in profiles ? name : 'jim';
  let pending = frameCache.get(key);
  if (!pending) {
    pending = Promise.all([loadImage(frontUrl), loadImage(backUrl)]).then(images => {
      const profile = profiles[key];
      return directions.map(row => {
        const reference = atlases[0].frames[profile.base * 6 + row.idle[1]][3];
        const rendered = new Map<string, HTMLCanvasElement>();
        const pose = ([atlas, column]: number[], seated = false): HTMLCanvasElement => {
          const id = `${atlas}:${column}`;
          let canvas = rendered.get(id);
          if (!canvas) {
            const rect = atlases[atlas].frames[profile.base * 6 + column];
            canvas = renderFrame(images[atlas], rect, seated ? reference : rect[3], profile.garment, row.mirror);
            rendered.set(id, canvas);
          }
          return canvas;
        };
        const seated = row.seated.map(frame => pose(frame, true));
        return [pose(row.idle), ...row.walk.map(frame => pose(frame)), ...seated, ...seated];
      });
    }).catch(error => { frameCache.delete(key); throw error; });
    frameCache.set(key, pending);
  }
  return pending;
}
