import { useEffect, useRef } from 'react';
import type { OfficeCharacterName } from '@/scene/office/cast';
import { portraitCanvas, PORTRAIT_W, PORTRAIT_H } from '@/scene/office/portraitArt';

export interface SpritePortraitProps {
  character: OfficeCharacterName;
  /** Logical UI size multiplier; the backing canvas remains high resolution. */
  scale?: number;
  background?: string;
}

export function SpritePortrait({ character, scale = 2, background = 'transparent' }: SpritePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = Math.round(PORTRAIT_W * scale);
  const height = Math.round(PORTRAIT_H * scale);
  const density = Math.max(2, window.devicePixelRatio || 1);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let cancelled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    void portraitCanvas(character).then(portrait => {
      if (cancelled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (background !== 'transparent') {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(portrait, 0, 0, canvas.width, canvas.height);
    }).catch(() => { /* Failed artwork stays empty; never fall back to retired pixel art. */ });
    return () => { cancelled = true; };
  }, [character, width, height, density, background]);
  return <canvas ref={canvasRef} width={Math.round(width * density)} height={Math.round(height * density)}
    aria-hidden="true" style={{ width, height, imageRendering: 'auto' }} />;
}
