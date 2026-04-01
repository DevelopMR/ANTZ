import { ANT_TUNING } from "../config/tuning.js";

export class AntView {
  constructor(ant, graphicsFactory) {
    this.ant = ant;
    this.graphics = graphicsFactory();
  }

  sync(elapsedTime) {
    this.graphics.position.set(this.ant.position.x, this.ant.position.y);
    this.graphics.rotation = 0;
    this.graphics.scale.set(-this.ant.facing, 1);
    this.#drawAntShape(elapsedTime);
  }

  #drawAntShape(elapsedTime) {
    const g = this.graphics;
    const phase = elapsedTime * 8 + this.ant.visual.animationOffset;
    const walkSwing = Math.sin(phase + this.ant.visual.legPhase) * 2.4 * this.ant.visual.wiggleStrength;
    const reachWiggle = Math.cos(phase * 0.7) * 1.6 * this.ant.visual.wiggleStrength;
    const tension = Math.sin(phase * 0.45) * 0.8 * this.ant.visual.wiggleStrength;

    g.clear();
    g.lineStyle(1.5, 0x1a130d, 0.98);

    if (this.ant.visualState === "walking") {
      this.#drawWalkingAnt(g, walkSwing, reachWiggle);
    } else if (this.ant.visualState === "reaching") {
      this.#drawReachingAnt(g, reachWiggle);
    } else {
      this.#drawGraspingAnt(g, tension);
    }
  }

  #drawWalkingAnt(g, walkSwing, antennaWiggle) {
    this.#drawSideBody(g, 0);

    g.moveTo(-11, -1);
    g.lineTo(-16, -6 - antennaWiggle * 0.2);
    g.moveTo(-11, 2);
    g.lineTo(-17, 0.5);

    g.moveTo(-4, 1);
    g.lineTo(-9, 8 + walkSwing * 0.35);
    g.moveTo(1, 1);
    g.lineTo(-1, 10 - walkSwing * 0.2);
    g.moveTo(7, 0);
    g.lineTo(12, 8 + walkSwing * 0.25);

    g.moveTo(-1, 1);
    g.lineTo(-5, 9 - walkSwing * 0.3);
    g.moveTo(4, 1);
    g.lineTo(4, 10 + walkSwing * 0.2);
    g.moveTo(9, 1);
    g.lineTo(16, 9 - walkSwing * 0.25);
  }

  #drawReachingAnt(g, reachWiggle) {
    this.#drawSideBody(g, -1.5);

    g.moveTo(-11, -2);
    g.lineTo(-17, -7 - reachWiggle * 0.25);
    g.moveTo(-11, 1);
    g.lineTo(-18, -1.5);

    g.moveTo(-6, 0);
    g.lineTo(-14, -10 - reachWiggle);
    g.moveTo(-1, -1);
    g.lineTo(-8, -16 - reachWiggle * 1.1);

    g.moveTo(2, 1);
    g.lineTo(-1, 10);
    g.moveTo(7, 1);
    g.lineTo(6, 10);
    g.moveTo(10, 1);
    g.lineTo(18, 8 + reachWiggle * 0.2);
    g.moveTo(4, 0);
    g.lineTo(14, 2);
  }

  #drawGraspingAnt(g, tension) {
    g.beginFill(0x1f140f);
    g.drawEllipse(0, 11, ANT_TUNING.abdomenRadius, ANT_TUNING.abdomenRadius + 3);
    g.drawCircle(0, 0, ANT_TUNING.thoraxRadius + 1);
    g.drawCircle(0, -12, ANT_TUNING.headRadius + 1);
    g.endFill();

    g.moveTo(-2, -16);
    g.lineTo(-8, -22 - tension);
    g.moveTo(2, -16);
    g.lineTo(8, -22 - tension);

    g.moveTo(0, -1);
    g.lineTo(-18, -9 + tension);
    g.moveTo(0, -1);
    g.lineTo(18, -9 + tension);

    g.moveTo(0, 2);
    g.lineTo(-20, 6 - tension);
    g.moveTo(0, 2);
    g.lineTo(20, 6 - tension);

    g.moveTo(-1, 5);
    g.lineTo(-15, 19 + tension);
    g.moveTo(1, 5);
    g.lineTo(15, 19 + tension);
  }

  #drawSideBody(g, bodyTilt) {
    g.beginFill(0x1f140f);
    g.drawCircle(-12, -1, ANT_TUNING.headRadius);
    g.drawEllipse(-2, 0 + bodyTilt * 0.3, ANT_TUNING.thoraxRadius + 1, ANT_TUNING.thoraxRadius - 1);
    g.drawEllipse(11, 1 + bodyTilt, ANT_TUNING.abdomenRadius + 2, ANT_TUNING.abdomenRadius - 2);
    g.endFill();
  }
}

