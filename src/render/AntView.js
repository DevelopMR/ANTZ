import { ANT_TUNING } from "../config/tuning.js";

export class AntView {
  constructor(ant, graphicsFactory) {
    this.ant = ant;
    this.graphics = graphicsFactory();
    this.#drawAntShape();
  }

  sync() {
    this.graphics.position.set(this.ant.position.x, this.ant.position.y);
    this.graphics.rotation = this.ant.rotation;
  }

  #drawAntShape() {
    const g = this.graphics;
    const spacing = ANT_TUNING.segmentSpacing;

    g.clear();

    g.lineStyle(1, 0x2a2117, 1);
    for (const yOffset of [-4, -2, 2, 4]) {
      g.moveTo(-spacing, 0);
      g.lineTo(-spacing - 5, yOffset);
      g.moveTo(0, 0);
      g.lineTo(-3, yOffset + 1);
      g.moveTo(spacing, 0);
      g.lineTo(spacing + 5, yOffset);
    }

    g.beginFill(0x1f140f);
    g.drawCircle(-spacing, 0, ANT_TUNING.radius - 1);
    g.drawCircle(0, 0, ANT_TUNING.radius);
    g.drawCircle(spacing, 0, ANT_TUNING.radius + 1);
    g.endFill();
  }
}