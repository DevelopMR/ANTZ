import { Sprite } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { ANT_TUNING } from "../config/tuning.js";

export class AntView {
  constructor(ant, spriteLibrary) {
    this.ant = ant;
    this.spriteLibrary = spriteLibrary;
    this.sprite = new Sprite(spriteLibrary[ant.visualState][0]);
    this.sprite.anchor.set(0.5, 0.82);
    this.sprite.scale.set(-ant.facing, 1);
    this.currentTexture = this.sprite.texture;
    this.lastX = Number.NaN;
    this.lastY = Number.NaN;
    this.lastFacing = null;
    this.lastAnimationTick = -1;
    this.lastState = null;
    this.lastAnimationMode = null;
    this.lastScale = null;
  }

  sync(elapsedTime, renderSettings = { animationMode: "animated" }) {
    if (this.ant.position.x !== this.lastX || this.ant.position.y !== this.lastY) {
      this.sprite.position.set(this.ant.position.x, this.ant.position.y);
      this.lastX = this.ant.position.x;
      this.lastY = this.ant.position.y;
    }

    const sizeScale = this.ant.visualState === "grasping" ? 0.5 : 0.8;

    if (this.ant.facing !== this.lastFacing || sizeScale !== this.lastScale) {
      this.sprite.scale.set(-this.ant.facing * sizeScale, sizeScale);
      this.lastFacing = this.ant.facing;
      this.lastScale = sizeScale;
    }

    const animationMode = renderSettings.animationMode || "animated";
    const animationTick = animationMode === "animated"
      ? Math.floor(elapsedTime * ANT_TUNING.animationTickRate)
      : -1;

    if (
      animationTick === this.lastAnimationTick &&
      this.ant.visualState === this.lastState &&
      animationMode === this.lastAnimationMode
    ) {
      return;
    }

    const frames = this.spriteLibrary[this.ant.visualState];
    let frameIndex;

    if (animationMode === "static") {
      frameIndex = Math.floor(frames.length / 2);
    } else {
      const fps = ANT_TUNING.animationFps[this.ant.visualState] || 1;
      const frameProgress = animationTick * (fps / ANT_TUNING.animationTickRate);
      frameIndex = Math.floor(
        frameProgress + this.ant.visual.animationOffset * frames.length + this.ant.visual.frameSeed
      ) % frames.length;
    }

    const texture = frames[frameIndex];
    if (texture !== this.currentTexture) {
      this.sprite.texture = texture;
      this.currentTexture = texture;
    }

    this.lastAnimationTick = animationTick;
    this.lastState = this.ant.visualState;
    this.lastAnimationMode = animationMode;
  }
}
