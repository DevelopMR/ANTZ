import { ANT_TUNING, PHYSICS_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function countActiveLegs(ant) {
  return ant.attachment.legs.filter((leg) => leg.active).length;
}

function clearLeg(leg) {
  leg.active = false;
  leg.targetType = null;
  leg.targetId = null;
  leg.anchorX = 0;
  leg.anchorY = 0;
  leg.targetOffsetX = 0;
  leg.targetOffsetY = 0;
  leg.preferredAngle = 0;
  leg.restLength = 0;
  leg.stiffnessScale = 1;
  leg.dampingScale = 1;
  leg.label = "";
  leg.debugDirectionX = 0;
  leg.debugDirectionY = -1;
  leg.stretchRatio = 1;
}

function removeConnection(ant, otherId) {
  ant.connectionIds = ant.connectionIds.filter((id) => id !== otherId);
}

function removeLegsTargetingAnt(ant, targetId) {
  for (const leg of ant.attachment.legs) {
    if (leg.active && leg.targetType === "ant" && leg.targetId === targetId) {
      clearLeg(leg);
    }
  }
}

function refreshAttachedState(ant) {
  ant.attached = ant.connectionIds.length > 0 || countActiveLegs(ant) > 0;
  if (!ant.attached) {
    ant.attachment.groupId = null;
  }
}

function settleOrFall(ant) {
  if (ant.movement.supportType === "ground" || ant.movement.supportType === "wall") {
    ant.movement.verticalState = "grounded";
    ant.movement.fallMode = null;
    ant.movement.fallCounted = false;
    ant.movement.collapseScatterNextY = null;
    ant.movement.bounceCount = 0;
    return;
  }

  ant.movement.supportType = "none";
  ant.movement.supportId = null;
  ant.movement.localSupportOffsetX = 0;
  ant.movement.verticalState = "falling";
  ant.movement.fallStartY = ant.position.y;
  ant.movement.fallMode = "collapse";
  ant.movement.fallCounted = false;
  ant.movement.collapseScatterNextY = null;
  ant.movement.bounceCount = 0;
}

function getAntSupportTopY(ant) {
  return ant.position.y - ANT_TUNING.supportHeight;
}

export class PhysicsSystem {
  constructor(random = Math.random) {
    this.random = random;
  }

  update(ants, deltaTime, mapSystem) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));
    const brokenLinks = [];

    for (const ant of ants) {
      ant.physics.impactCooldown = Math.max(0, ant.physics.impactCooldown - deltaTime);
      ant.physics.lastBreakReason = null;
    }

    for (const ant of ants) {
      this.#integrateAttachedBody(ant, deltaTime, antById);
    }

    for (let iteration = 0; iteration < PHYSICS_TUNING.solverIterations; iteration += 1) {
      for (const ant of ants) {
        for (const leg of ant.attachment.legs) {
          if (!leg.active) {
            continue;
          }

          if (leg.targetType === "ant") {
            const targetAnt = antById.get(leg.targetId);
            if (!targetAnt) {
              brokenLinks.push({ antId: ant.id, targetType: leg.targetType, targetId: leg.targetId, reason: "missing-target" });
              continue;
            }

            const shouldBreak = this.#solveAntLeg(ant, targetAnt, leg, deltaTime);
            if (shouldBreak) {
              brokenLinks.push({ antId: ant.id, targetType: "ant", targetId: targetAnt.id, reason: "overstretch" });
            }
            continue;
          }

          const shouldBreak = this.#solveEnvironmentLeg(ant, leg, deltaTime);
          if (shouldBreak) {
            brokenLinks.push({ antId: ant.id, targetType: leg.targetType, targetId: leg.targetId, reason: "overstretch" });
          }
        }
      }
    }

    for (const brokenLink of brokenLinks) {
      this.#breakLink(brokenLink, antById);
    }

    this.#resolveFallingImpacts(ants);
    this.#enforceSupportFloors(ants, antById, mapSystem);
    this.#enforceWallExclusion(ants, mapSystem);

    for (const ant of ants) {
      refreshAttachedState(ant);
    }
  }

  #integrateAttachedBody(ant, deltaTime, antById) {
    refreshAttachedState(ant);

    if (!ant.attached || ant.movement.verticalState === "falling") {
      return;
    }

    const supportAnt = ant.movement.supportType === "ant"
      ? antById.get(ant.movement.supportId)
      : null;

    if (supportAnt && !supportAnt.attached && supportAnt.movement.verticalState !== "falling") {
      const targetY = supportAnt.position.y - ANT_TUNING.supportHeight;
      ant.velocity.x += (supportAnt.velocity.x - ant.velocity.x) * PHYSICS_TUNING.supportRideFollow * deltaTime;
      ant.position.y += (targetY - ant.position.y) * PHYSICS_TUNING.supportRideVerticalSnap;
    }

    ant.velocity.y += ANT_TUNING.gravity * PHYSICS_TUNING.attachedGravityScale * deltaTime;
    ant.velocity.x *= PHYSICS_TUNING.attachedLinearDamping;
    ant.velocity.y *= PHYSICS_TUNING.attachedLinearDamping;
    ant.velocity.x = clamp(ant.velocity.x, -PHYSICS_TUNING.microVelocityClamp, PHYSICS_TUNING.microVelocityClamp);
    ant.velocity.y = clamp(ant.velocity.y, -PHYSICS_TUNING.microVelocityClamp, PHYSICS_TUNING.microVelocityClamp);

    ant.position.x += ant.velocity.x * deltaTime;
    ant.position.y += ant.velocity.y * deltaTime;
  }

  #solveAntLeg(ant, targetAnt, leg, deltaTime) {
    const anchorX = targetAnt.position.x + leg.targetOffsetX;
    const anchorY = targetAnt.position.y + leg.targetOffsetY;
    const dx = anchorX - ant.position.x;
    const dy = anchorY - ant.position.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / distance;
    const directionY = dy / distance;
    const preferredX = Math.cos(leg.preferredAngle);
    const preferredY = Math.sin(leg.preferredAngle);
    const blendedDirX = directionX * (1 - PHYSICS_TUNING.legAngularBias) + preferredX * PHYSICS_TUNING.legAngularBias;
    const blendedDirY = directionY * (1 - PHYSICS_TUNING.legAngularBias) + preferredY * PHYSICS_TUNING.legAngularBias;
    const blendLength = Math.max(0.001, Math.hypot(blendedDirX, blendedDirY));
    const solveDirX = blendedDirX / blendLength;
    const solveDirY = blendedDirY / blendLength;
    const stretch = distance - leg.restLength;
    const relativeVelocityX = targetAnt.velocity.x - ant.velocity.x;
    const relativeVelocityY = targetAnt.velocity.y - ant.velocity.y;
    const relativeAlongLeg = relativeVelocityX * solveDirX + relativeVelocityY * solveDirY;
    const springImpulse = stretch * PHYSICS_TUNING.legStiffness * leg.stiffnessScale;
    const dampingImpulse = relativeAlongLeg * PHYSICS_TUNING.legDamping * leg.dampingScale;
    const impulse = (springImpulse + dampingImpulse) * deltaTime;
    const correction = stretch * PHYSICS_TUNING.positionCorrectionFactor;

    ant.velocity.x += solveDirX * impulse;
    ant.velocity.y += solveDirY * impulse;
    targetAnt.velocity.x -= solveDirX * impulse;
    targetAnt.velocity.y -= solveDirY * impulse;

    ant.position.x += solveDirX * correction * 0.5;
    ant.position.y += solveDirY * correction * 0.5;
    targetAnt.position.x -= solveDirX * correction * 0.5;
    targetAnt.position.y -= solveDirY * correction * 0.5;

    leg.debugDirectionX = solveDirX;
    leg.debugDirectionY = solveDirY;
    leg.stretchRatio = distance / Math.max(leg.restLength, 0.001);

    return distance > leg.restLength * PHYSICS_TUNING.legBreakStretchRatio + PHYSICS_TUNING.legBreakDistanceBuffer;
  }

  #solveEnvironmentLeg(ant, leg, deltaTime) {
    const dx = leg.anchorX - ant.position.x;
    const dy = leg.anchorY - ant.position.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / distance;
    const directionY = dy / distance;
    const preferredX = Math.cos(leg.preferredAngle);
    const preferredY = Math.sin(leg.preferredAngle);
    const blendedDirX = directionX * (1 - PHYSICS_TUNING.legAngularBias) + preferredX * PHYSICS_TUNING.legAngularBias;
    const blendedDirY = directionY * (1 - PHYSICS_TUNING.legAngularBias) + preferredY * PHYSICS_TUNING.legAngularBias;
    const blendLength = Math.max(0.001, Math.hypot(blendedDirX, blendedDirY));
    const solveDirX = blendedDirX / blendLength;
    const solveDirY = blendedDirY / blendLength;
    const stretch = distance - leg.restLength;
    const relativeAlongLeg = -(ant.velocity.x * solveDirX + ant.velocity.y * solveDirY);
    const springImpulse = stretch * PHYSICS_TUNING.legAnchorPull * leg.stiffnessScale;
    const dampingImpulse = relativeAlongLeg * PHYSICS_TUNING.legDamping * leg.dampingScale;
    const impulse = (springImpulse + dampingImpulse) * deltaTime;
    const correction = stretch * PHYSICS_TUNING.positionCorrectionFactor;

    ant.velocity.x += solveDirX * impulse;
    ant.velocity.y += solveDirY * impulse;
    ant.position.x += solveDirX * correction;
    ant.position.y += solveDirY * correction;

    leg.debugDirectionX = solveDirX;
    leg.debugDirectionY = solveDirY;
    leg.stretchRatio = distance / Math.max(leg.restLength, 0.001);

    return distance > leg.restLength * PHYSICS_TUNING.legBreakStretchRatio + PHYSICS_TUNING.legBreakDistanceBuffer;
  }

  #breakLink(link, antById) {
    const ant = antById.get(link.antId);
    if (!ant) {
      return;
    }

    ant.physics.lastBreakReason = link.reason;

    if (link.targetType === "ant") {
      const targetAnt = antById.get(link.targetId);
      removeConnection(ant, link.targetId);
      removeLegsTargetingAnt(ant, link.targetId);
      refreshAttachedState(ant);
      if (!ant.attached) {
        settleOrFall(ant);
      }

      if (targetAnt) {
        removeConnection(targetAnt, ant.id);
        removeLegsTargetingAnt(targetAnt, ant.id);
        refreshAttachedState(targetAnt);
        targetAnt.physics.lastBreakReason = link.reason;
        if (!targetAnt.attached) {
          settleOrFall(targetAnt);
        }
      }
      return;
    }

    for (const leg of ant.attachment.legs) {
      if (leg.active && leg.targetType === link.targetType && leg.targetId === link.targetId) {
        clearLeg(leg);
      }
    }

    refreshAttachedState(ant);
    if (!ant.attached) {
      settleOrFall(ant);
    }
  }

  #resolveFallingImpacts(ants) {
    for (const ant of ants) {
      if (ant.movement.verticalState !== "falling") {
        continue;
      }
      if (ant.physics.impactCooldown > 0) {
        continue;
      }

      for (const targetAnt of ants) {
        if (targetAnt.id === ant.id || targetAnt.movement.verticalState === "falling") {
          continue;
        }

        const dx = ant.position.x - targetAnt.position.x;
        const dy = ant.position.y - targetAnt.position.y;
        const minDistance = ANT_TUNING.collisionRadius * 2.1;
        const distance = Math.hypot(dx, dy);
        if (distance >= minDistance) {
          continue;
        }

        const safeDistance = Math.max(distance, 0.001);
        const normalX = dx / safeDistance;
        const normalY = dy / safeDistance;
        const overlap = minDistance - safeDistance;
        const relativeVelocityX = ant.velocity.x - targetAnt.velocity.x;
        const relativeVelocityY = ant.velocity.y - targetAnt.velocity.y;
        const relativeSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY;

        ant.position.x += normalX * overlap * 0.82;
        ant.position.y += normalY * overlap * 0.82;
        targetAnt.position.x -= normalX * overlap * 0.18;
        targetAnt.position.y -= normalY * overlap * 0.18;

        if (relativeSpeed < 0) {
          const bounceImpulse = -(1 + PHYSICS_TUNING.impactBounceFactor) * relativeSpeed;
          ant.velocity.x += normalX * bounceImpulse + (this.random() - 0.5) * PHYSICS_TUNING.impactHorizontalJitter;
          ant.velocity.y += normalY * bounceImpulse;
          targetAnt.velocity.x -= normalX * bounceImpulse * PHYSICS_TUNING.impactTransferFactor;
          targetAnt.velocity.y -= normalY * bounceImpulse * PHYSICS_TUNING.impactTransferFactor;
        }

        ant.movement.bounceCount = Math.min(ANT_TUNING.maxBounceCount, ant.movement.bounceCount + 1);
        if (ant.movement.bounceCount >= ANT_TUNING.maxBounceCount) {
          ant.velocity.y = Math.min(ant.velocity.y, ANT_TUNING.tumbleBounceSpeedY * 0.55);
        } else {
          ant.velocity.y = Math.min(ant.velocity.y, ANT_TUNING.tumbleBounceSpeedY);
        }
        ant.physics.lastImpactId = targetAnt.id;
        ant.physics.impactCooldown = 0.05;
        break;
      }
    }
  }

  #enforceSupportFloors(ants, antById, mapSystem) {
    for (const ant of ants) {
      if (ant.movement.verticalState === "falling") {
        continue;
      }

      if (ant.position.y > ant.movement.groundY) {
        ant.position.y = ant.movement.groundY;
        ant.velocity.y = Math.min(ant.velocity.y, 0);
      }

      if (ant.movement.supportType === "ground") {
        ant.position.y = ant.movement.groundY;
        ant.velocity.y = Math.min(ant.velocity.y, 0);
        ant.movement.verticalState = "grounded";
        continue;
      }

      if (ant.movement.supportType === "wall") {
        const wall = mapSystem?.getWallById?.(ant.movement.supportId);
        if (!wall) {
          continue;
        }

        const wallTopY = wall.y - ANT_TUNING.supportHeight;
        if (ant.position.y > wallTopY) {
          ant.position.y = wallTopY;
          ant.velocity.y = Math.min(ant.velocity.y, 0);
        }
        continue;
      }

      if (ant.movement.supportType === "ant") {
        const supportAnt = antById.get(ant.movement.supportId);
        if (!supportAnt || supportAnt.movement.verticalState === "falling") {
          continue;
        }

        const supportTopY = getAntSupportTopY(supportAnt);
        if (!ant.attached && ant.position.y > supportTopY) {
          ant.position.y = supportTopY;
          ant.velocity.y = Math.min(ant.velocity.y, 0);
          ant.movement.verticalState = "perched";
        }
      }
    }
  }
  #enforceWallExclusion(ants, mapSystem) {
    for (const ant of ants) {
      for (const wall of mapSystem.walls) {
        const minX = wall.x - ANT_TUNING.collisionRadius - ANT_TUNING.wallSupportPadding;
        const maxX = wall.x + wall.width + ANT_TUNING.collisionRadius + ANT_TUNING.wallSupportPadding;
        const minY = wall.y - ANT_TUNING.supportHeight + ANT_TUNING.supportSnapDistance;
        const maxY = wall.y + wall.height + ANT_TUNING.collisionRadius;

        if (ant.position.x < minX || ant.position.x > maxX || ant.position.y < minY || ant.position.y > maxY) {
          continue;
        }

        const distanceToLeft = Math.abs(ant.position.x - minX);
        const distanceToRight = Math.abs(maxX - ant.position.x);

        ant.position.x = distanceToLeft < distanceToRight ? minX : maxX;
        ant.velocity.x *= 0.2;
      }
    }
  }
}





