import { ANT_TUNING, SENSOR_TUNING, SIMULATION_TUNING } from "../config/tuning.js";

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
      this.#updateSteeringIntent(ant, deltaTime);
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

    const wedges = ant.sensorState.wedges;
    if (!wedges || wedges.length === 0) {
      ant.movement.desiredDirection += ant.movement.steeringTarget * 0.2 * deltaTime;
      ant.movement.desiredDirection = clamp(ant.movement.desiredDirection, -1, 1);
      return;
    }

    const frontPressure = (wedges[0].proximity + wedges[1].proximity + wedges[5].proximity) / 3;
    const leftOpen = ((1 - wedges[1].proximity) + (1 - wedges[2].proximity)) * 0.5;
    const rightOpen = ((1 - wedges[5].proximity) + (1 - wedges[4].proximity)) * 0.5;
    const leftSignal = ((wedges[1].colorScalar + wedges[2].colorScalar) * 0.5) - SENSOR_TUNING.colorRange.obstacle;
    const rightSignal = ((wedges[5].colorScalar + wedges[4].colorScalar) * 0.5) - SENSOR_TUNING.colorRange.obstacle;
    const scentBias = ant.sensorState.scalars.foodScent * 0.06 * ant.facing;

    const opennessBias = (rightOpen - leftOpen) * 0.85;
    const interestBias = (rightSignal - leftSignal) * 0.55;
    const obstacleBrake = frontPressure * 1.2;
    const noiseBias = ant.movement.steeringTarget * 0.11;

    ant.movement.desiredDirection += (opennessBias + interestBias + scentBias - obstacleBrake + noiseBias) * deltaTime;
    ant.movement.desiredDirection = clamp(ant.movement.desiredDirection, -1, 1);

    if (Math.abs(ant.movement.desiredDirection) > 0.05) {
      ant.facing = ant.movement.desiredDirection >= 0 ? 1 : -1;
    }
  }

  #integrateMotion(ant, deltaTime, mapSystem) {
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
