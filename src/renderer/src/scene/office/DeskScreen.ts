import { Container, Graphics } from 'pixi.js';
import type { TiledMapRenderer } from './TiledMapRenderer';

/** Small amber activity lamp beside the generated monitor. Its state is tied
 * to actual seating/work events; it does not repaint or replace the desk art. */
export class DeskScreen {
  readonly container = new Container();

  constructor(mapRenderer: TiledMapRenderer, seat: { x: number; y: number }) {
    const ts = mapRenderer.tileSize;
    const logical = { x: (seat.x + 0.5) * ts, y: (seat.y + 1) * ts };
    const point = mapRenderer.getDeskMonitorPoint(seat);
    const lamp = new Graphics().ellipse(0, 0, 2.5, 1.5).fill(0xe8820c);
    this.container.addChild(lamp);
    this.container.position.set(point.x, point.y);
    this.container.zIndex = Math.max(mapRenderer.depthAt(logical.x, logical.y) + 0.1, 900);
    this.container.visible = false;
    this.container.eventMode = 'none';
  }

  setOn(on: boolean): void { this.container.visible = on; }
  update(_dt: number): void { /* Static live-state indicator honors reduced motion. */ }
  destroy(): void { this.container.destroy({ children: true }); }
}
