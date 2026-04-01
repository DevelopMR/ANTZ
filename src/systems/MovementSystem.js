import { ANT_TUNING, SIMULATION_TUNING, WORLD_HEIGHT, WORLD_WIDTH } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapAngle(angle) {
  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }
  while (angle < -Math.PI) {
    angle += Math.PI * 2;
  }
  return angle;
}

export class MovementSystem {
  constructor(random = Math.random) {
    this.random = random;
  }

  update(ants, deltaTime) {
    for (const ant of ants) {
      this.#updateSteeringIntent(ant, deltaTime);
      this.#integrateMotion(ant, deltaTime);
      this.#containWithinWorld(ant, deltaTime);
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

    const steeringDelta = ant.movement.steeringTarget - ant.movement.desiredTurn;
    ant.movement.desiredTurn += steeringDelta * Math.min(1, ANT_TUNING.steeringSmoothing * deltaTime);
  }

  #integrateMotion(ant, deltaTime) {
    const desiredTurnRate =
      ant.movement.desiredTurn *
      ANT_TUNING.maxTurnRate *
      ant.traits.turnResponsiveness;

    ant.angularVelocity += (desiredTurnRate - ant.angularVelocity) * Math.min(1, 5 * deltaTime);
    ant.angularVelocity *= Math.pow(SIMULATION_TUNING.angularDamping, deltaTime * 60);
    ant.rotation = wrapAngle(ant.rotation + ant.angularVelocity * deltaTime);

    const forwardForce = ANT_TUNING.forwardDrive * ant.traits.forwardBias;
    ant.velocity.x += Math.cos(ant.rotation) * forwardForce * deltaTime;
    ant.velocity.y += Math.sin(ant.rotation) * forwardForce * deltaTime;

    const damping = Math.pow(SIMULATION_TUNING.linearDamping, deltaTime * 60);
    ant.velocity.x *= damping;
    ant.velocity.y *= damping;

    const speed = Math.hypot(ant.velocity.x, ant.velocity.y);
    if (speed > ANT_TUNING.maxSpeed) {
      const scale = ANT_TUNING.maxSpeed / speed;
      ant.velocity.x *= scale;
      ant.velocity.y *= scale;
    }

    ant.position.x += ant.velocity.x * deltaTime;
    ant.position.y += ant.velocity.y * deltaTime;
  }

  #containWithinWorld(ant, deltaTime) {
    const margin = SIMULATION_TUNING.boundaryMargin;

    let targetHeading = null;
    if (ant.position.x < margin) {
      targetHeading = 0;
    } else if (ant.position.x > WORLD_WIDTH - margin) {
      targetHeading = Math.PI;
    }

    if (ant.position.y < margin) {
      targetHeading = Math.PI / 2;
    } else if (ant.position.y > WORLD_HEIGHT - margin) {
      targetHeading = -Math.PI / 2;
    }

    if (targetHeading !== null) {
      const headingDelta = wrapAngle(targetHeading - ant.rotation);
      ant.movement.desiredTurn += headingDelta * SIMULATION_TUNING.boundaryTurnStrength * deltaTime;
      ant.movement.desiredTurn = clamp(ant.movement.desiredTurn, -1, 1);
    }

    ant.position.x = clamp(ant.position.x, 8, WORLD_WIDTH - 8);
    ant.position.y = clamp(ant.position.y, 8, WORLD_HEIGHT - 8);
  }

  #randomRange(min, max) {
    return min + (max - min) * this.random();
  }
}
