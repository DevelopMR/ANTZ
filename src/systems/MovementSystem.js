import { ANT_TUNING, SIMULATION_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class MovementSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.stateCycle = ["standing", "walking", "reaching", "walking", "grasping"];
  }

  update(ants, deltaTime, mapSystem) {
    for (const ant of ants) {
      this.#updatePosture(ant, deltaTime);
      this.#integrateMotion(ant, deltaTime, mapSystem);
      this.#containWithinWorld(ant);
    }
  }

  #updatePosture(ant, deltaTime) {
    ant.movement.postureTimer -= deltaTime;

    if (ant.movement.postureTimer <= 0) {
      const nextIndex = Math.floor(this.random() * this.stateCycle.length);
      ant.visualState = this.stateCycle[nextIndex];
      ant.movement.postureTimer = this.#randomRange(
        ANT_TUNING.postureDurationMin,
        ANT_TUNING.postureDurationMax
      );
    }
  }

  #integrateMotion(ant, deltaTime, mapSystem) {
    const xIntent = ant.brainState?.xVel ?? 0;
    const yIntent = ant.brainState?.yVel ?? 0;
    const postureSpeedScale = ant.visualState === "walking"
      ? 1
      : ant.visualState === "reaching"
        ? 0.45
        : ant.visualState === "standing"
          ? 0.5
          : 0.2;

    const xForce = ANT_TUNING.forwardDrive * ant.traits.forwardBias * xIntent * postureSpeedScale;

    ant.movement.desiredDirection = xIntent;
    ant.velocity.x += xForce * deltaTime;
    ant.velocity.x *= SIMULATION_TUNING.linearDamping;
    ant.velocity.y = yIntent;

    ant.velocity.x = clamp(ant.velocity.x, -ANT_TUNING.maxSpeed, ANT_TUNING.maxSpeed);
    const currentX = ant.position.x;
    const nextX = currentX + ant.velocity.x * deltaTime;
    const resolvedX = mapSystem.constrainHorizontalMovement(ant, currentX, nextX);

    if (resolvedX !== nextX) {
      ant.velocity.x *= 0.15;
      ant.movement.desiredDirection *= -0.45;
    }

    if (Math.abs(ant.velocity.x) > 0.02) {
      ant.facing = ant.velocity.x >= 0 ? 1 : -1;
    }

    ant.position.x = resolvedX;
    ant.position.y = ant.movement.groundY;
  }

  #containWithinWorld(ant) {
    const minX = 24;
    const maxX = 1280 - 24;

    if (ant.position.x <= minX) {
      ant.position.x = minX;
      ant.facing = 1;
    } else if (ant.position.x >= maxX) {
      ant.position.x = maxX;
      ant.facing = -1;
    }
  }

  #randomRange(min, max) {
    return min + (max - min) * this.random();
  }
}
