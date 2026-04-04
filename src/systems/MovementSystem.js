import { ANT_TUNING, SIMULATION_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSupportTopY(ant) {
  return ant.position.y - ANT_TUNING.supportHeight;
}

export class MovementSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.stateCycle = ["standing", "walking", "reaching", "walking", "grasping"];
  }

  update(ants, deltaTime, mapSystem) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));

    for (const ant of ants) {
      this.#updateSupportState(ant, antById);
      this.#updatePosture(ant, deltaTime);
      this.#integrateMotion(ant, deltaTime, mapSystem, ants, antById);
      this.#containWithinWorld(ant);
      this.#syncVisualState(ant);
    }
  }

  #updateSupportState(ant, antById) {
    if (ant.movement.supportType !== "ant") {
      return;
    }

    const supportAnt = antById.get(ant.movement.supportAntId);
    if (!supportAnt || supportAnt.movement.supportType !== "ground") {
      this.#detachToGround(ant);
      return;
    }

    const maxOffset = ANT_TUNING.supportHalfWidth + ANT_TUNING.climbHorizontalRange;
    if (Math.abs(ant.position.x - supportAnt.position.x) > maxOffset) {
      this.#detachToGround(ant);
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

  #integrateMotion(ant, deltaTime, mapSystem, ants, antById) {
    const xIntent = ant.brainState?.xVel ?? 0;
    const yIntent = ant.brainState?.yVel ?? 0;
    const attachedLock = ant.attached;
    const postureSpeedScale = ant.visualState === "walking"
      ? 1
      : ant.visualState === "reaching"
        ? 0.45
        : ant.visualState === "standing"
          ? 0.5
          : 0.2;

    const currentSupportAnt = ant.movement.supportType === "ant"
      ? antById.get(ant.movement.supportAntId)
      : null;
    const wantsClimb = yIntent <= -ANT_TUNING.climbIntentThreshold;
    const wantsDescend = yIntent >= ANT_TUNING.climbIntentThreshold;

    if (!attachedLock && !currentSupportAnt && wantsClimb) {
      const climbTarget = this.#findClimbTarget(ant, ants);
      if (climbTarget) {
        ant.movement.supportType = "ant";
        ant.movement.supportAntId = climbTarget.id;
        ant.movement.verticalState = "climbing";
        ant.movement.localSupportOffsetX = clamp(
          ant.position.x - climbTarget.position.x,
          -ANT_TUNING.supportHalfWidth,
          ANT_TUNING.supportHalfWidth
        );
      }
    } else if (!attachedLock && currentSupportAnt && wantsDescend) {
      this.#detachToGround(ant, "descending");
    }

    const supportAnt = ant.movement.supportType === "ant"
      ? antById.get(ant.movement.supportAntId)
      : null;
    const xForce = ANT_TUNING.forwardDrive * ant.traits.forwardBias * xIntent * postureSpeedScale;

    ant.movement.desiredDirection = xIntent;
    ant.velocity.x += attachedLock ? 0 : xForce * deltaTime;
    ant.velocity.x *= attachedLock ? 0.25 : SIMULATION_TUNING.linearDamping;
    ant.velocity.x = clamp(ant.velocity.x, -ANT_TUNING.maxSpeed, ANT_TUNING.maxSpeed);

    if (supportAnt) {
      if (!attachedLock) {
        ant.movement.localSupportOffsetX = clamp(
          ant.movement.localSupportOffsetX + xIntent * ANT_TUNING.maxSpeed * 0.35 * deltaTime,
          -ANT_TUNING.supportHalfWidth,
          ANT_TUNING.supportHalfWidth
        );
      }
      ant.position.x = supportAnt.position.x + ant.movement.localSupportOffsetX;
      ant.velocity.x = supportAnt.velocity.x;
    } else {
      const currentX = ant.position.x;
      const nextX = currentX + ant.velocity.x * deltaTime;
      const resolvedX = mapSystem.constrainHorizontalMovement(ant, currentX, nextX);

      if (resolvedX !== nextX) {
        ant.velocity.x *= 0.15;
        ant.movement.desiredDirection *= -0.45;
      }

      ant.position.x = resolvedX;
    }

    if (Math.abs(ant.velocity.x) > 0.02) {
      ant.facing = ant.velocity.x >= 0 ? 1 : -1;
    }

    if (supportAnt) {
      const targetY = getSupportTopY(supportAnt);
      const nextY = this.#moveTowardsY(ant.position.y, targetY, deltaTime);
      ant.position.y = nextY;
      ant.velocity.y = targetY - nextY;

      if (Math.abs(targetY - ant.position.y) <= ANT_TUNING.supportSnapDistance) {
        ant.position.y = targetY;
        ant.movement.verticalState = "perched";
      } else {
        ant.movement.verticalState = ant.movement.verticalState === "descending" ? "descending" : "climbing";
      }
      return;
    }

    const groundY = ant.movement.groundY;
    const targetY = groundY;
    const nextY = this.#moveTowardsY(ant.position.y, targetY, deltaTime);
    ant.position.y = nextY;
    ant.velocity.y = targetY - nextY;

    if (Math.abs(targetY - ant.position.y) <= ANT_TUNING.supportSnapDistance) {
      ant.position.y = targetY;
      ant.movement.verticalState = "grounded";
    }
  }

  #findClimbTarget(ant, ants) {
    let bestTarget = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of ants) {
      if (candidate.id === ant.id) {
        continue;
      }

      if (candidate.movement.supportType !== "ground") {
        continue;
      }

      const horizontalDistance = Math.abs(candidate.position.x - ant.position.x);
      if (horizontalDistance > ANT_TUNING.climbHorizontalRange) {
        continue;
      }

      const verticalDistance = Math.abs(candidate.position.y - ant.position.y);
      if (verticalDistance > ANT_TUNING.supportHeight * 0.35) {
        continue;
      }

      if (horizontalDistance < bestDistance) {
        bestDistance = horizontalDistance;
        bestTarget = candidate;
      }
    }

    return bestTarget;
  }

  #moveTowardsY(currentY, targetY, deltaTime) {
    const delta = targetY - currentY;
    if (Math.abs(delta) <= ANT_TUNING.supportSnapDistance) {
      return targetY;
    }

    const maxStep = ANT_TUNING.climbSpeed * deltaTime;
    return currentY + Math.sign(delta) * Math.min(Math.abs(delta), maxStep);
  }

  #detachToGround(ant, verticalState = "descending") {
    ant.movement.supportType = "ground";
    ant.movement.supportAntId = null;
    ant.movement.verticalState = verticalState;
    ant.movement.localSupportOffsetX = 0;
  }

  #syncVisualState(ant) {
    if (ant.attached) {
      ant.visualState = "grasping";
      return;
    }

    if (ant.movement.verticalState === "climbing" || ant.movement.verticalState === "descending") {
      ant.visualState = "grasping";
      return;
    }

    if (ant.movement.supportType === "ant") {
      ant.visualState = "walking";
    }
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
