import { ANT_TUNING, SIMULATION_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAntSupportTopY(ant) {
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
      this.#updateSupportState(ant, antById, mapSystem);
      this.#updatePosture(ant, deltaTime);
      this.#integrateMotion(ant, deltaTime, mapSystem, ants, antById);
      this.#containWithinWorld(ant);
      this.#syncVisualState(ant);
    }
  }

  #updateSupportState(ant, antById, mapSystem) {
    if (ant.movement.verticalState === "falling") {
      return;
    }

    if (ant.movement.supportType === "ant") {
      const supportAnt = antById.get(ant.movement.supportId);
      if (!supportAnt || supportAnt.movement.verticalState === "falling") {
        this.#startFalling(ant);
        return;
      }

      const maxOffset = ANT_TUNING.supportHalfWidth + ANT_TUNING.climbHorizontalRange;
      if (Math.abs(ant.position.x - supportAnt.position.x) > maxOffset) {
        this.#startFalling(ant);
      }
      return;
    }

    if (ant.movement.supportType === "wall") {
      const wall = mapSystem.getWallById(ant.movement.supportId);
      if (!wall) {
        this.#startFalling(ant);
        return;
      }

      const minX = wall.x - ANT_TUNING.supportHalfWidth;
      const maxX = wall.x + wall.width + ANT_TUNING.supportHalfWidth;
      if (ant.position.x < minX || ant.position.x > maxX) {
        this.#startFalling(ant);
      }
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

    const supportAnt = ant.movement.supportType === "ant"
      ? antById.get(ant.movement.supportId)
      : null;
    const wantsClimb = yIntent <= -ANT_TUNING.climbIntentThreshold;
    const wantsDescend = yIntent >= ANT_TUNING.climbIntentThreshold;

    if (!attachedLock && ant.movement.verticalState !== "falling" && !supportAnt && wantsClimb) {
      const climbTarget = this.#findClimbTarget(ant, ants);
      if (climbTarget) {
        ant.movement.supportType = "ant";
        ant.movement.supportId = climbTarget.id;
        ant.movement.verticalState = "climbing";
        ant.movement.localSupportOffsetX = clamp(
          ant.position.x - climbTarget.position.x,
          -ANT_TUNING.supportHalfWidth,
          ANT_TUNING.supportHalfWidth
        );
      }
    } else if (!attachedLock && supportAnt && wantsDescend) {
      this.#startFalling(ant);
    }

    this.#applyHorizontalMotion(ant, deltaTime, mapSystem, supportAnt, xIntent, postureSpeedScale, attachedLock);

    if (ant.movement.verticalState === "falling") {
      this.#integrateFall(ant, deltaTime, mapSystem, ants, antById);
      return;
    }

    if (supportAnt) {
      const targetY = getAntSupportTopY(supportAnt);
      const nextY = this.#moveTowardsY(ant.position.y, targetY, deltaTime);
      ant.position.y = nextY;
      ant.velocity.y = 0;

      if (Math.abs(targetY - ant.position.y) <= ANT_TUNING.supportSnapDistance) {
        ant.position.y = targetY;
        ant.movement.verticalState = "perched";
      } else {
        ant.movement.verticalState = ant.movement.verticalState === "descending" ? "descending" : "climbing";
      }
      return;
    }

    const targetY = this.#getStaticSupportY(ant, mapSystem);
    const nextY = this.#moveTowardsY(ant.position.y, targetY, deltaTime);
    ant.position.y = nextY;
    ant.velocity.y = 0;

    if (Math.abs(targetY - ant.position.y) <= ANT_TUNING.supportSnapDistance) {
      ant.position.y = targetY;
      ant.movement.verticalState = "grounded";
    }
  }

  #applyHorizontalMotion(ant, deltaTime, mapSystem, supportAnt, xIntent, postureSpeedScale, attachedLock) {
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
  }

  #integrateFall(ant, deltaTime, mapSystem, ants, antById) {
    ant.velocity.y = Math.min(ant.velocity.y + ANT_TUNING.gravity * deltaTime, ANT_TUNING.maxFallSpeed);

    const currentY = ant.position.y;
    const nextY = currentY + ant.velocity.y * deltaTime;
    const landingSurface = mapSystem.findLandingSurface(ant.position.x, currentY, ants.filter((candidate) => candidate.id !== ant.id));

    if (landingSurface && nextY >= landingSurface.y) {
      this.#landOnSurface(ant, landingSurface, antById);
      return;
    }

    ant.position.y = nextY;
  }

  #landOnSurface(ant, surface, antById) {
    ant.velocity.y = 0;
    ant.position.x = surface.x;
    ant.position.y = surface.y;

    if (surface.type === "ground") {
      ant.movement.supportType = "ground";
      ant.movement.supportId = null;
      ant.movement.groundY = surface.y;
      ant.movement.localSupportOffsetX = 0;
      ant.movement.verticalState = "grounded";
      return;
    }

    if (surface.type === "wall") {
      ant.movement.supportType = "wall";
      ant.movement.supportId = surface.id;
      ant.movement.localSupportOffsetX = 0;
      ant.movement.verticalState = "grounded";
      return;
    }

    const supportAnt = antById.get(surface.id);
    if (!supportAnt) {
      ant.movement.supportType = "ground";
      ant.movement.supportId = null;
      ant.movement.verticalState = "grounded";
      return;
    }

    ant.movement.supportType = "ant";
    ant.movement.supportId = supportAnt.id;
    ant.movement.localSupportOffsetX = clamp(
      ant.position.x - supportAnt.position.x,
      -ANT_TUNING.supportHalfWidth,
      ANT_TUNING.supportHalfWidth
    );
    ant.position.y = getAntSupportTopY(supportAnt);
    ant.movement.verticalState = "perched";
  }

  #findClimbTarget(ant, ants) {
    let bestTarget = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of ants) {
      if (candidate.id === ant.id) {
        continue;
      }

      if (candidate.movement.verticalState === "falling") {
        continue;
      }

      if (candidate.movement.supportType === "ant") {
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

  #getStaticSupportY(ant, mapSystem) {
    if (ant.movement.supportType === "wall") {
      const wall = mapSystem.getWallById(ant.movement.supportId);
      if (wall) {
        return wall.y - ANT_TUNING.supportHeight;
      }
    }

    return ant.movement.groundY;
  }

  #moveTowardsY(currentY, targetY, deltaTime) {
    const delta = targetY - currentY;
    if (Math.abs(delta) <= ANT_TUNING.supportSnapDistance) {
      return targetY;
    }

    const maxStep = ANT_TUNING.climbSpeed * deltaTime;
    return currentY + Math.sign(delta) * Math.min(Math.abs(delta), maxStep);
  }

  #startFalling(ant) {
    if (ant.movement.verticalState !== "falling") {
      ant.movement.fallStartY = ant.position.y;
    }

    ant.movement.supportType = "none";
    ant.movement.supportId = null;
    ant.movement.localSupportOffsetX = 0;
    ant.movement.verticalState = "falling";
    ant.velocity.y = Math.max(ant.velocity.y, 0);
  }

  #syncVisualState(ant) {
    if (ant.attached) {
      ant.visualState = "grasping";
      return;
    }

    if (["climbing", "descending", "falling"].includes(ant.movement.verticalState)) {
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

