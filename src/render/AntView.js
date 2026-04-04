import { Sprite } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { ANT_TUNING } from "../config/tuning.js";

export class AntView {
  constructor(ant, spriteLibrary) {
    this.ant = ant;
    this.spriteLibrary = spriteLibrary;
    this.sprite = new Sprite(spriteLibrary[ant.visualState][0]);
    this.sprite.anchor.set(0.5, 0.82);
    this.currentTexture = this.sprite.texture;
    this.lastX = Number.NaN;
    this.lastY = Number.NaN;
    this.lastFacing = null;
    this.lastAnimationTick = -1;
    this.lastState = null;
    this.lastScale = null;
    this.lastRotation = null;
  }

  sync(elapsedTime) {
    if (this.ant.position.x !== this.lastX || this.ant.position.y !== this.lastY) {
      this.sprite.position.set(this.ant.position.x, this.ant.position.y);
      this.lastX = this.ant.position.x;
      this.lastY = this.ant.position.y;
    }

    const sizeScale = this.ant.visualState === "grasping" ? 0.6 : 0.75;
    const targetRotation = this.ant.movement?.verticalState === "falling"
      ? this.ant.facing * (Math.PI * 0.42)
      : 0;

    if (this.ant.facing !== this.lastFacing || sizeScale !== this.lastScale) {
      this.sprite.scale.set(-this.ant.facing * sizeScale, sizeScale);
      this.lastFacing = this.ant.facing;
      this.lastScale = sizeScale;
    }

    if (targetRotation !== this.lastRotation) {
      this.sprite.rotation = targetRotation;
      this.lastRotation = targetRotation;
    }

    const animationTick = Math.floor(elapsedTime * ANT_TUNING.animationTickRate);
    if (animationTick === this.lastAnimationTick && this.ant.visualState === this.lastState) {
      return;
    }

    const frames = this.spriteLibrary[this.ant.visualState];
    const fps = ANT_TUNING.animationFps[this.ant.visualState] || 1;
    const frameProgress = animationTick * (fps / ANT_TUNING.animationTickRate);
    const frameIndex = Math.floor(
      frameProgress + this.ant.visual.animationOffset * frames.length + this.ant.visual.frameSeed
    ) % frames.length;

    const texture = frames[frameIndex];
    if (texture !== this.currentTexture) {
      this.sprite.texture = texture;
      this.currentTexture = texture;
    }

    this.lastAnimationTick = animationTick;
    this.lastState = this.ant.visualState;
  }
}
