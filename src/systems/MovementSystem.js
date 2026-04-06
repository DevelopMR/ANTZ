import { ANT_TUNING, FOOD_TUNING, PHYSICS_TUNING, SIMULATION_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getAntSupportTopY(ant) {
  return ant.position.y - ANT_TUNING.supportHeight;
}

function getWalkableSupportLimit() {
  return ANT_TUNING.supportTopFlatHalfWidth + ANT_TUNING.supportEdgeRollZone;
}

function getStableSupportHalfWidth() {
  return ANT_TUNING.supportTopFlatHalfWidth;
}

function hasActiveLegs(ant) {
  return ant.attachment.legs?.some((leg) => leg.active) ?? false;
}

function isSaluting(ant) {
  return (ant.food?.saluteTimer ?? 0) > 0;
}

function isCarryingFood(ant) {
  return ant.carryingFood || ant.food?.carrying;
}

export class MovementSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.stateCycle = ["standing", "walking", "reaching", "walking", "grasping"];
    this.totalFalls = 0;
  }

  update(ants, deltaTime, mapSystem) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));

    for (const ant of ants) {
      this.#syncExternalFallState(ant);
      this.#updateSupportState(ant, antById, mapSystem);
      this.#updatePosture(ant, deltaTime);
      this.#integrateMotion(ant, deltaTime, mapSystem, ants, antById);
      this.#containWithinWorld(ant);
    }

    this.#resolveUnstableStacks(ants, antById);

    for (const ant of ants) {
      this.#syncVisualState(ant);
    }
  }

  #syncExternalFallState(ant) {
    if (ant.movement.verticalState === "falling") {
      if (!ant.movement.fallCounted) {
        this.totalFalls += 1;
        ant.movement.fallCounted = true;
      }

      if (!ant.movement.fallMode) {
        ant.movement.fallMode = "collapse";
      }

      if (ant.movement.fallMode === "collapse" && ant.movement.collapseScatterNextY == null) {
        ant.movement.collapseScatterNextY = ant.position.y + ANT_TUNING.collapseScatterStepY;
      }
      return;
    }

    ant.movement.fallCounted = false;
    ant.movement.bounceCount = 0;
  }

  #updateSupportState(ant, antById, mapSystem) {
    if (ant.movement.verticalState === "falling") {
      return;
    }

    if (ant.attached || hasActiveLegs(ant)) {
      return;
    }

    if (ant.movement.supportType === "ant") {
      const supportAnt = antById.get(ant.movement.supportId);
      if (!supportAnt) {
        this.#startFall(ant, "collapse");
        return;
      }

      if (supportAnt.movement.verticalState === "falling") {
        this.#startFall(ant, supportAnt.movement.fallMode === "collapse" ? "collapse" : "intentional");
        return;
      }

      if (!this.#hasWalkableOverlap(ant, supportAnt)) {
        this.#startFall(ant, "intentional");
      }
      return;
    }

    if (ant.movement.supportType === "wall") {
      const wall = mapSystem.getWallById(ant.movement.supportId);
      if (!wall) {
        this.#startFall(ant, "collapse");
        return;
      }

      const minX = wall.x - getWalkableSupportLimit();
      const maxX = wall.x + wall.width + getWalkableSupportLimit();
      if (ant.position.x < minX || ant.position.x > maxX) {
        this.#startFall(ant, "intentional");
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
    if (ant.movement.verticalState === "falling") {
      this.#integrateFall(ant, deltaTime, mapSystem, ants, antById);
      return;
    }

    const xIntent = ant.brainState?.xVel ?? 0;
    const yIntent = ant.brainState?.yVel ?? 0;
    const attachedLock = ant.attached || hasActiveLegs(ant);
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

    if (isSaluting(ant)) {
      this.#integrateSaluteBeat(ant, deltaTime, mapSystem, supportAnt, antById);
      return;
    }

    if (isCarryingFood(ant)) {
      this.#integrateCarryReturnMotion(ant, deltaTime, mapSystem, supportAnt, antById);
      return;
    }

    const wantsClimb = yIntent <= -ANT_TUNING.climbIntentThreshold;

    if (!attachedLock && !supportAnt && wantsClimb) {
      const climbTarget = this.#findClimbTarget(ant, ants);
      if (climbTarget) {
        ant.movement.supportType = "ant";
        ant.movement.supportId = climbTarget.id;
        ant.movement.verticalState = "climbing";
        ant.movement.localSupportOffsetX = clamp(
          ant.position.x - climbTarget.position.x,
          -getStableSupportHalfWidth(),
          getStableSupportHalfWidth()
        );
      }
    }

    if (attachedLock) {
      this.#integrateAttachedMotion(ant, deltaTime, supportAnt);
      return;
    }

    this.#applyHorizontalMotion(ant, deltaTime, mapSystem, supportAnt, xIntent, postureSpeedScale);
    this.#updateSupportState(ant, antById, mapSystem);

    if (ant.movement.verticalState === "falling") {
      this.#integrateFall(ant, deltaTime, mapSystem, ants, antById);
      return;
    }

    this.#resolveVerticalPlacement(ant, deltaTime, mapSystem, antById);
  }

  #integrateCarryReturnMotion(ant, deltaTime, mapSystem, supportAnt, antById) {
    const targetX = ant.food.deliveryTargetX || ant.position.x;
    const deltaX = targetX - ant.position.x;
    const xIntent = clamp(deltaX / 32, -1, 1);
    const carrySpeedScale = FOOD_TUNING.carrySpeedScale;

    ant.movement.desiredDirection = xIntent;
    this.#applyHorizontalMotion(ant, deltaTime, mapSystem, supportAnt, xIntent, carrySpeedScale);
    this.#updateSupportState(ant, antById, mapSystem);

    if (ant.movement.verticalState === "falling") {
      return;
    }

    this.#resolveVerticalPlacement(ant, deltaTime, mapSystem, antById);

    if (Math.abs(deltaX) <= FOOD_TUNING.queenDeliveryRadius * 0.8) {
      ant.velocity.x *= 0.72;
    }
  }

  #integrateSaluteBeat(ant, deltaTime, mapSystem, supportAnt, antById) {
    ant.velocity.x *= 0.5;
    ant.velocity.y = 0;
    ant.movement.desiredDirection = 0;

    if (supportAnt && supportAnt.movement.verticalState !== "falling") {
      ant.position.x = supportAnt.position.x + ant.movement.localSupportOffsetX;
    }

    this.#resolveVerticalPlacement(ant, deltaTime, mapSystem, antById);
  }

  #integrateAttachedMotion(ant, deltaTime, supportAnt) {
    ant.movement.desiredDirection = ant.brainState?.xVel ?? 0;
    ant.velocity.x *= 0.94;
    ant.velocity.y *= 0.98;

    if (!supportAnt || supportAnt.attached || supportAnt.movement.verticalState === "falling") {
      return;
    }

    ant.velocity.x += (supportAnt.velocity.x - ant.velocity.x) * PHYSICS_TUNING.supportRideFollow * deltaTime;
    const targetY = getAntSupportTopY(supportAnt);
    ant.position.y += (targetY - ant.position.y) * PHYSICS_TUNING.supportRideVerticalSnap;
  }

  #applyHorizontalMotion(ant, deltaTime, mapSystem, supportAnt, xIntent, postureSpeedScale) {
    const xForce = ANT_TUNING.forwardDrive * ant.traits.forwardBias * xIntent * postureSpeedScale;

    ant.movement.desiredDirection = xIntent;
    ant.velocity.x += xForce * deltaTime;
    ant.velocity.x *= SIMULATION_TUNING.linearDamping;
    ant.velocity.x = clamp(ant.velocity.x, -ANT_TUNING.maxSpeed, ANT_TUNING.maxSpeed);

    if (supportAnt) {
      ant.movement.localSupportOffsetX = clamp(
        ant.movement.localSupportOffsetX + xIntent * ANT_TUNING.maxSpeed * 0.35 * deltaTime,
        -getStableSupportHalfWidth(),
        getStableSupportHalfWidth()
      );

      ant.position.x = supportAnt.position.x + ant.movement.localSupportOffsetX;
      ant.velocity.x = supportAnt.velocity.x + ant.velocity.x * 0.15;
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

  #resolveVerticalPlacement(ant, deltaTime, mapSystem, antById) {
    const currentSupportAnt = ant.movement.supportType === "ant"
      ? antById.get(ant.movement.supportId)
      : null;

    if (currentSupportAnt) {
      const targetY = getAntSupportTopY(currentSupportAnt);
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

  #integrateFall(ant, deltaTime, mapSystem, ants, antById) {
    ant.velocity.x = clamp(ant.velocity.x, -ANT_TUNING.tumbleBounceSpeedX, ANT_TUNING.tumbleBounceSpeedX);
    ant.velocity.y = Math.min(ant.velocity.y + ANT_TUNING.gravity * deltaTime, ANT_TUNING.maxFallSpeed);

    const currentY = ant.position.y;
    const nextY = currentY + ant.velocity.y * deltaTime;

    if (ant.movement.fallMode === "collapse") {
      while (ant.movement.collapseScatterNextY != null && nextY >= ant.movement.collapseScatterNextY) {
        ant.position.x = clamp(
          ant.position.x + this.#randomScatterDirection() * ANT_TUNING.collapseScatterStepX,
          24,
          1280 - 24
        );
        ant.movement.collapseScatterNextY += ANT_TUNING.collapseScatterStepY;
      }
    }

    const landingSurface = mapSystem.findLandingSurface(
      ant.position.x,
      currentY,
      ants.filter((candidate) => candidate.id !== ant.id)
    );

    if (landingSurface && nextY >= landingSurface.y) {
      this.#landOnSurface(ant, landingSurface, antById);
      return;
    }

    ant.position.y = nextY;
  }

  #landOnGround(ant) {
    ant.velocity.y = 0;
    ant.position.y = ant.movement.groundY;
    ant.movement.supportType = "ground";
    ant.movement.supportId = null;
    ant.movement.localSupportOffsetX = 0;
    ant.movement.verticalState = "grounded";
    ant.movement.fallMode = null;
    ant.movement.collapseScatterNextY = null;
    ant.movement.fallCounted = false;
    ant.movement.bounceCount = 0;
  }

  #landOnSurface(ant, surface, antById) {
    ant.velocity.y = 0;
    ant.position.x = surface.x;
    ant.position.y = surface.y;
    ant.movement.fallMode = null;
    ant.movement.collapseScatterNextY = null;
    ant.movement.fallCounted = false;
    ant.movement.bounceCount = 0;

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
      this.#landOnGround(ant);
      return;
    }

    ant.movement.supportType = "ant";
    ant.movement.supportId = supportAnt.id;
    ant.movement.localSupportOffsetX = clamp(
      ant.position.x - supportAnt.position.x,
      -getStableSupportHalfWidth(),
      getStableSupportHalfWidth()
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

  #resolveUnstableStacks(ants, antById) {
    const childrenBySupportId = new Map();

    for (const ant of ants) {
      if (ant.attached) {
        continue;
      }
      if (ant.movement.supportType !== "ant" || ant.movement.verticalState !== "perched") {
        continue;
      }

      if (!childrenBySupportId.has(ant.movement.supportId)) {
        childrenBySupportId.set(ant.movement.supportId, []);
      }
      childrenBySupportId.get(ant.movement.supportId).push(ant);
    }

    const collapseIds = new Set();

    for (const ant of ants) {
      if (ant.attached) {
        continue;
      }
      if (ant.movement.supportType !== "ant" || ant.movement.verticalState !== "perched") {
        continue;
      }

      if (childrenBySupportId.has(ant.id)) {
        continue;
      }

      const chain = [ant];
      let current = ant;

      while (current.movement.supportType === "ant") {
        const supportAnt = antById.get(current.movement.supportId);
        if (!supportAnt) {
          break;
        }

        if (supportAnt.movement.supportType === "ant" && supportAnt.movement.verticalState !== "perched") {
          break;
        }

        if (!this.#hasWalkableOverlap(current, supportAnt)) {
          this.#startFall(current, "intentional");
          break;
        }

        if (supportAnt.attached) {
          if (chain.length > 2) {
            const excessFreeAnts = chain.slice(0, chain.length - 2);
            for (const collapsingAnt of excessFreeAnts) {
              collapseIds.add(collapsingAnt.id);
            }
          }
          break;
        }

        if (supportAnt.movement.supportType === "ground" || supportAnt.movement.supportType === "wall") {
          if (chain.length >= 2) {
            for (const collapsingAnt of chain) {
              collapseIds.add(collapsingAnt.id);
            }
          }
          break;
        }

        if (supportAnt.movement.supportType !== "ant") {
          break;
        }

        chain.push(supportAnt);
        current = supportAnt;
      }
    }

    for (const antId of collapseIds) {
      const collapsingAnt = antById.get(antId);
      if (collapsingAnt) {
        this.#startFall(collapsingAnt, "collapse");
      }
    }
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

  #hasWalkableOverlap(upperAnt, lowerAnt) {
    return Math.abs(upperAnt.position.x - lowerAnt.position.x) <= getWalkableSupportLimit();
  }

  #moveTowardsY(currentY, targetY, deltaTime) {
    const delta = targetY - currentY;
    if (Math.abs(delta) <= ANT_TUNING.supportSnapDistance) {
      return targetY;
    }

    const maxStep = ANT_TUNING.climbSpeed * deltaTime;
    return currentY + Math.sign(delta) * Math.min(Math.abs(delta), maxStep);
  }

  #startFall(ant, mode) {
    if (ant.movement.verticalState !== "falling") {
      ant.movement.fallStartY = ant.position.y;
      this.totalFalls += 1;
    }

    ant.movement.supportType = "none";
    ant.movement.supportId = null;
    ant.movement.localSupportOffsetX = 0;
    ant.movement.verticalState = "falling";
    ant.movement.fallMode = mode;
    ant.movement.fallCounted = true;
    ant.movement.collapseScatterNextY = mode === "collapse"
      ? ant.position.y + ANT_TUNING.collapseScatterStepY
      : null;
    ant.movement.bounceCount = 0;
    ant.velocity.y = Math.max(ant.velocity.y, 0);
  }

  #randomScatterDirection() {
    const directions = [-1, 0, 1];
    return directions[Math.floor(this.random() * directions.length)];
  }

  #syncVisualState(ant) {
    if (isSaluting(ant)) {
      ant.visualState = "reaching";
      return;
    }

    if (ant.attached || hasActiveLegs(ant)) {
      ant.visualState = "grasping";
      return;
    }

    if (isCarryingFood(ant)) {
      ant.visualState = "walking";
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
