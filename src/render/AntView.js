import { Sprite } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { ANT_TUNING } from "../config/tuning.js";

export class AntView {
  constructor(ant, spriteLibrary) {
    this.ant = ant;
    this.spriteLibrary = spriteLibrary;
    this.sprite = new Sprite(spriteLibrary[ant.visualState][0]);
    this.sprite.anchor.set(0.5, 0.82);
    this.sprite.scale.set(-ant.facing, 1);
    this.currentTexture = null;
  }

  sync(elapsedTime) {
    this.sprite.position.set(this.ant.position.x, this.ant.position.y);
    this.sprite.scale.set(-this.ant.facing, 1);
    this.sprite.rotation = this.ant.visualState === "grasping" ? 0 : 0;

    const frames = this.spriteLibrary[this.ant.visualState];
    const fps = ANT_TUNING.animationFps[this.ant.visualState] || 1;
    const frameIndex = Math.floor((elapsedTime * fps) + this.ant.visual.animationOffset * frames.length + this.ant.visual.frameSeed) % frames.length;
    const texture = frames[frameIndex];

    if (texture !== this.currentTexture) {
      this.sprite.texture = texture;
      this.currentTexture = texture;
    }
  }
}
