import { AnimatedSprite, Container, Texture } from 'pixi.js';
import { perspectiveActorHeight } from './projection';

export type Direction = 'down' | 'up' | 'right' | 'left';
export type AnimState = 'walk' | 'type' | 'read' | 'idle';
const DIRECTION_ROW: Record<Direction, number> = { down: 0, up: 1, right: 2, left: 3 };
export const CHARACTER_HEIGHT = 180;
export const SEATED_VISUAL_OFFSET_Y = 0;

/** Generated frames: four directions, seven poses per row. The bottom-center
 * container keeps the navigation ground contact. Seated artwork has a local
 * contact in the camera-matched seated frames. Only the body texture is scaled. */
export class CharacterSprite {
  readonly container = new Container();
  private sprite: AnimatedSprite;
  private currentDirection: Direction = 'down';
  private currentAnim: AnimState = 'idle';
  private seated = false;
  private reduced = false;

  constructor(private frames: Texture[][], private project: (x: number, y: number) => { x: number; y: number }) {
    this.sprite = new AnimatedSprite(this.getFrames());
    this.sprite.anchor.set(0.5, 1);
    this.sprite.scale.set(CHARACTER_HEIGHT / this.sprite.texture.height);
    this.sprite.animationSpeed = 0.12;
    this.container.addChild(this.sprite);
    this.sprite.play();
  }

  /** Retain the existing seating signal; detailed seated art replaces cropping. */
  setSeatedCrop(cropPx: number): void {
    const seated = cropPx > 0;
    if (this.seated === seated) return;
    this.seated = seated;
    this.refresh();
  }

  private getFrames(): Texture[] {
    const row = this.frames[DIRECTION_ROW[this.currentDirection]];
    const columns = this.currentAnim === 'walk' ? [1, 0, 2, 0]
      : this.seated ? (this.currentAnim === 'read' ? [5, 6] : this.currentAnim === 'type' ? [3, 4] : [3])
        : [0];
    return columns.map(col => row[col]);
  }

  private refresh(): void {
    this.sprite.textures = this.getFrames();
    this.sprite.scale.set(this.getHeight() / this.sprite.texture.height);
    this.sprite.y = this.seated ? SEATED_VISUAL_OFFSET_Y : 0;
    this.sprite.animationSpeed = this.currentAnim === 'walk' ? 0.12 : 0.035;
    if (this.reduced) this.sprite.gotoAndStop(0);
    else this.sprite.play();
  }

  setAnimation(anim: AnimState, direction: Direction): void {
    if (anim === this.currentAnim && direction === this.currentDirection) return;
    this.currentAnim = anim;
    this.currentDirection = direction;
    this.refresh();
  }

  setReducedMotion(reduced: boolean): void {
    if (this.reduced === reduced) return;
    this.reduced = reduced;
    this.refresh();
  }

  /** North-facing seated art needs the measured chair-height correction. Derive
   * scale from the current pose each time; never multiply the previous scale. */
  getHeight(): number {
    const seatedNorth = this.seated && this.currentAnim !== 'walk' && this.currentDirection === 'up';
    return perspectiveActorHeight(this.container.position) * (seatedNorth ? 1.15 : 1);
  }
  setPosition(x: number, y: number): void {
    this.container.position.copyFrom(this.project(x, y));
    this.sprite.scale.set(this.getHeight() / this.sprite.texture.height);
  }
  setAlpha(alpha: number): void { this.container.alpha = alpha; }
  destroy(): void { this.container.destroy({ children: true }); }
}
