import { ANT_TUNING, NEURAL_TUNING, SIMULATION_TUNING } from "../config/tuning.js";

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
      this.#updateNeuralIntent(ant, deltaTime);
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

  #updateNeuralIntent(ant, deltaTime) {
    const turnSignal = ant.brainState?.turn ?? 0;
    ant.movement.desiredDirection += turnSignal * ant.traits.turnResponsiveness * NEURAL_TUNING.turnRate * deltaTime;
    ant.movement.desiredDirection = clamp(ant.movement.desiredDirection, -1, 1);

    if (Math.abs(ant.movement.desiredDirection) > 0.05) {
      ant.facing = ant.movement.desiredDirection >= 0 ? 1 : -1;
    }
  }

  #integrateMotion(ant, deltaTime, mapSystem) {
    const forwardSignal = ant.brainState?.forward ?? 0;
    const postureSpeedScale = ant.visualState === "walking"
      ? 1
      : ant.visualState === "reaching"
        ? 0.35
        : ant.visualState === "standing"
          ? 0.42
          : 0.18;

    const forwardForce =
      ANT_TUNING.forwardDrive *
      ant.traits.forwardBias *
      ant.movement.desiredDirection *
      forwardSignal *
      postureSpeedScale;

    ant.velocity.x += forwardForce * deltaTime;
    ant.velocity.x *= SIMULATION_TUNING.linearDamping;
    ant.velocity.y = 0;

    ant.velocity.x = clamp(ant.velocity.x, -ANT_TUNING.maxSpeed, ANT_TUNING.maxSpeed);
    const nextX = ant.position.x + ant.velocity.x * deltaTime;
    const resolvedX = mapSystem.constrainHorizontalMovement(ant, nextX);

    if (resolvedX !== nextX) {
      ant.velocity.x *= 0.15;
      ant.movement.desiredDirection *= -0.45;
    }

    ant.position.x = resolvedX;
    ant.position.y = ant.movement.groundY;
  }

  #containWithinWorld(ant) {
    const minX = 24;
    const maxX = 1280 - 24;

    if (ant.position.x <= minX) {
      ant.position.x = minX;
      ant.movement.desiredDirection = Math.abs(ant.movement.desiredDirection) || 0.6;
      ant.facing = 1;
    } else if (ant.position.x >= maxX) {
      ant.position.x = maxX;
      ant.movement.desiredDirection = -Math.abs(ant.movement.desiredDirection || 0.6);
      ant.facing = -1;
    }
  }

  #randomRange(min, max) {
    return min + (max - min) * this.random();
  }
}

