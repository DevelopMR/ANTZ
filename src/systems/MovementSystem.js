import { ANT_TUNING, SIMULATION_TUNING, WORLD_WIDTH } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export class MovementSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.stateCycle = ["standing", "walking", "reaching", "walking", "grasping"];
    this.tickCount = 0;
    this.precomputedDamping = {
      30: Math.pow(SIMULATION_TUNING.linearDamping, 2),
      60: SIMULATION_TUNING.linearDamping,
    };
  }

  update(ants, deltaTime, runtimeSettings = {}) {
    this.tickCount += 1;
    const isLowDetail = runtimeSettings.behaviorDetail === "low";

    for (const ant of ants) {
      const skipBehaviorWork = isLowDetail && ant.id % 2 !== this.tickCount % 2;

      if (!skipBehaviorWork) {
        this.#updatePosture(ant, deltaTime, runtimeSettings);
        this.#updateSteeringIntent(ant, deltaTime);
      }

      this.#integrateMotion(ant, deltaTime, runtimeSettings);
      this.#containWithinWorld(ant);
    }
  }

  #updatePosture(ant, deltaTime, runtimeSettings) {
    ant.movement.postureTimer -= deltaTime;

    if (ant.movement.postureTimer <= 0) {
      const nextIndex = Math.floor(this.random() * this.stateCycle.length);
      ant.visualState = this.stateCycle[nextIndex];
      const durationScale = runtimeSettings.behaviorDetail === "low" ? 1.6 : 1;
      ant.movement.postureTimer = this.#randomRange(
        ANT_TUNING.postureDurationMin * durationScale,
        ANT_TUNING.postureDurationMax * durationScale
      );
    }
  }

  #updateSteeringIntent(ant, deltaTime) {
    ant.movement.steeringNoiseTimer -= deltaTime;

    if (ant.movement.steeringNoiseTimer <= 0) {
      ant.movement.steeringNoiseTimer = this.#randomRange(
        ANT_TUNING.steeringNoiseIntervalMin,
        ANT_TUNING.steeringNoiseIntervalMax
      );
      ant.movement.steeringTarget = this.#randomRange(
        ANT_TUNING.steeringImpulseMin,
        ANT_TUNING.steeringImpulseMax
      ) * ant.movement.wanderStrength;
    }

    const stateTurnScale = ant.visualState === "walking"
      ? 0.9
      : ant.visualState === "reaching"
        ? 0.25
        : ant.visualState === "standing"
          ? 0.1
          : 0.08;

    ant.movement.desiredDirection += ant.movement.steeringTarget * stateTurnScale * deltaTime;
    ant.movement.desiredDirection = clamp(ant.movement.desiredDirection, -1, 1);

    if (Math.abs(ant.movement.desiredDirection) > 0.08) {
      ant.facing = ant.movement.desiredDirection >= 0 ? 1 : -1;
    }
  }

  #integrateMotion(ant, deltaTime, runtimeSettings) {
    const postureSpeedScale = ant.visualState === "walking"
      ? 1
      : ant.visualState === "reaching"
        ? 0.12
        : ant.visualState === "standing"
          ? 0
          : 0.03;

    const forwardForce =
      ANT_TUNING.forwardDrive *
      ant.traits.forwardBias *
      ant.movement.desiredDirection *
      postureSpeedScale;

    ant.velocity.x += forwardForce * deltaTime;

    if (runtimeSettings.movementMode === "precompute") {
      const simHz = runtimeSettings.simulationHz === 30 ? 30 : 60;
      ant.velocity.x *= this.precomputedDamping[simHz];
    } else {
      ant.velocity.x *= runtimeSettings.movementMode === "simplify"
        ? SIMULATION_TUNING.linearDamping
        : Math.pow(SIMULATION_TUNING.linearDamping, deltaTime * 60);
    }

    ant.velocity.y = 0;
    ant.velocity.x = clamp(ant.velocity.x, -ANT_TUNING.maxSpeed, ANT_TUNING.maxSpeed);
    ant.position.x += ant.velocity.x * deltaTime;
    ant.position.y = ant.movement.groundY;
  }

  #containWithinWorld(ant) {
    const minX = 24;
    const maxX = WORLD_WIDTH - 24;

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
