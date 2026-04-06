import { ANT_TUNING, PHYSICS_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function removeConnection(ant, otherId) {
  ant.connectionIds = ant.connectionIds.filter((id) => id !== otherId);
}

function addConnection(left, rightId) {
  if (left.connectionIds.includes(rightId)) {
    return;
  }
  if (left.connectionIds.length >= ANT_TUNING.maxConnections) {
    return;
  }

  left.connectionIds.push(rightId);
}

function shuffleInPlace(values, random) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function randomRange(random, min, max) {
  return min + (max - min) * random();
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

function clearAllLegs(ant) {
  for (const leg of ant.attachment.legs) {
    clearLeg(leg);
  }
}

function removeLegsTargetingAnt(ant, targetId) {
  for (const leg of ant.attachment.legs) {
    if (leg.active && leg.targetType === "ant" && leg.targetId === targetId) {
      clearLeg(leg);
    }
  }
}

function countActiveLegs(ant) {
  return ant.attachment.legs.filter((leg) => leg.active).length;
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
    ant.velocity.y = 0;
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

function assignLeg(ant, config) {
  const slot = ant.attachment.legs.find((leg) => !leg.active);
  if (!slot) {
    return;
  }

  slot.active = true;
  slot.targetType = config.targetType;
  slot.targetId = config.targetId ?? null;
  slot.anchorX = config.anchorX ?? 0;
  slot.anchorY = config.anchorY ?? 0;
  slot.targetOffsetX = config.targetOffsetX ?? 0;
  slot.targetOffsetY = config.targetOffsetY ?? 0;
  slot.preferredAngle = config.preferredAngle ?? 0;
  slot.restLength = config.restLength ?? PHYSICS_TUNING.legRestLength;
  slot.stiffnessScale = config.stiffnessScale ?? 1;
  slot.dampingScale = config.dampingScale ?? 1;
  slot.label = config.label ?? config.targetType ?? "leg";
  slot.debugDirectionX = config.debugDirectionX ?? Math.cos(slot.preferredAngle);
  slot.debugDirectionY = config.debugDirectionY ?? Math.sin(slot.preferredAngle);
  slot.stretchRatio = 1;
}

export class AttachmentSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.nextGroupId = 1;
  }

  update(ants, deltaTime, mapSystem) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));

    for (const ant of ants) {
      this.#decayAttachmentState(ant, deltaTime, antById);
    }

    for (const ant of ants) {
      this.#attemptPerchedGrasp(ant, ants, antById, mapSystem);
    }
  }

  #decayAttachmentState(ant, deltaTime, antById) {
    ant.attachment.pollCooldown = Math.max(0, ant.attachment.pollCooldown - deltaTime);
    ant.attachment.thrillBoost = Math.max(0, ant.attachment.thrillBoost - ANT_TUNING.graspThrillDecayPerSecond * deltaTime);
    refreshAttachedState(ant);

    if (!ant.attached) {
      return;
    }

    const effectiveDesire = this.#getEffectiveDesire(ant);
    if (effectiveDesire >= ANT_TUNING.graspHoldThreshold) {
      return;
    }

    this.#releaseAnt(ant, antById, "desire-drop");
  }

  #releaseAnt(ant, antById, reason) {
    const connectedIds = [...ant.connectionIds];

    for (const otherId of connectedIds) {
      const otherAnt = antById.get(otherId);
      if (!otherAnt) {
        continue;
      }

      removeConnection(otherAnt, ant.id);
      removeLegsTargetingAnt(otherAnt, ant.id);
      refreshAttachedState(otherAnt);
      otherAnt.physics.lastBreakReason = reason;

      if (!otherAnt.attached) {
        settleOrFall(otherAnt);
      }
    }

    ant.connectionIds.length = 0;
    clearAllLegs(ant);
    refreshAttachedState(ant);
    ant.physics.lastBreakReason = reason;

    if (!ant.attached) {
      settleOrFall(ant);
    }
  }

  #attemptPerchedGrasp(ant, ants, antById, mapSystem) {
    refreshAttachedState(ant);

    if (ant.attached || ant.attachment.pollCooldown > 0) {
      return;
    }

    if (ant.movement.supportType !== "ant" || ant.movement.verticalState !== "perched") {
      return;
    }

    const supportAnt = antById.get(ant.movement.supportId);
    if (!supportAnt || supportAnt.attached) {
      return;
    }

    if (!this.#isPairAlignedForGrasp(ant, supportAnt)) {
      return;
    }

    const neighbors = this.#findPollNeighbors(ant, supportAnt, ants);
    if (neighbors.length === 0) {
      ant.attachment.pollCooldown = this.#randomPollCooldown();
      return;
    }

    const shuffled = shuffleInPlace([...neighbors], this.random);
    const requestedCount = ANT_TUNING.graspPollMinNeighbors + Math.floor(
      this.random() * (ANT_TUNING.graspPollMaxNeighbors - ANT_TUNING.graspPollMinNeighbors + 1)
    );
    const selectedNeighbors = shuffled.slice(0, Math.min(requestedCount, shuffled.length));
    const participants = [supportAnt, ant, ...selectedNeighbors];

    if (participants.some((candidate) => this.#getEffectiveDesire(candidate) < ANT_TUNING.graspHardRejectThreshold)) {
      ant.attachment.pollCooldown = this.#randomPollCooldown();
      supportAnt.attachment.pollCooldown = this.#randomPollCooldown();
      return;
    }

    const totalDesire = participants.reduce((sum, candidate) => sum + this.#getEffectiveDesire(candidate), 0);
    const successThreshold = participants.length * ANT_TUNING.graspSuccessThresholdPerAnt;

    if (totalDesire < successThreshold) {
      ant.attachment.pollCooldown = this.#randomPollCooldown();
      supportAnt.attachment.pollCooldown = this.#randomPollCooldown();
      return;
    }

    this.#formAttachmentGroup(participants, mapSystem);
  }

  #findPollNeighbors(ant, supportAnt, ants) {
    const centerX = (ant.position.x + supportAnt.position.x) * 0.5;
    const centerY = (ant.position.y + supportAnt.position.y) * 0.5;

    return ants.filter((candidate) => {
      if (candidate.id === ant.id || candidate.id === supportAnt.id) {
        return false;
      }
      refreshAttachedState(candidate);
      if (candidate.attached) {
        return false;
      }
      if (candidate.connectionIds.length >= ANT_TUNING.maxConnections) {
        return false;
      }

      const dx = Math.abs(candidate.position.x - centerX);
      const dy = Math.abs(candidate.position.y - centerY);
      return dx <= ANT_TUNING.graspNeighborRadiusX && dy <= ANT_TUNING.graspNeighborRadiusY;
    });
  }

  #formAttachmentGroup(participants, mapSystem) {
    const groupId = this.nextGroupId;
    this.nextGroupId += 1;

    const ordered = [...participants].sort((left, right) => left.position.x - right.position.x);
    const antById = new Map(ordered.map((ant) => [ant.id, ant]));
    const neighborMap = new Map();

    for (let index = 0; index < ordered.length; index += 1) {
      const ant = ordered[index];
      const neighbors = [];
      if (index > 0) {
        neighbors.push(ordered[index - 1].id);
      }
      if (index < ordered.length - 1) {
        neighbors.push(ordered[index + 1].id);
      }
      neighborMap.set(ant.id, neighbors);
    }

    for (let index = 0; index < ordered.length - 1; index += 1) {
      const left = ordered[index];
      const right = ordered[index + 1];
      addConnection(left, right.id);
      addConnection(right, left.id);
    }

    for (const ant of ordered) {
      clearAllLegs(ant);

      const environmentAnchors = this.#buildEnvironmentAnchors(ant, mapSystem);
      const neighborIds = neighborMap.get(ant.id) ?? [];

      if (environmentAnchors.length > 0) {
        assignLeg(ant, environmentAnchors[0]);
      }

      for (const neighborId of neighborIds) {
        const neighbor = antById.get(neighborId);
        if (!neighbor || countActiveLegs(ant) >= ANT_TUNING.graspLegSlotCount) {
          continue;
        }
        assignLeg(ant, this.#buildNeighborLeg(ant, neighbor));
      }

      let anchorIndex = 1;
      while (anchorIndex < environmentAnchors.length && countActiveLegs(ant) < ANT_TUNING.graspLegSlotCount) {
        assignLeg(ant, environmentAnchors[anchorIndex]);
        anchorIndex += 1;
      }

      refreshAttachedState(ant);
      ant.attachment.groupId = ant.attached ? groupId : null;
      if (ant.attachment.thrillBoost <= 0) {
        ant.attachment.thrillBoost = clamp(
          randomRange(this.random, ANT_TUNING.graspThrillBoostMin, ANT_TUNING.graspThrillBoostMax),
          0,
          1
        );
      }
      ant.attachment.pollCooldown = this.#randomPollCooldown();
      ant.physics.lastBreakReason = null;
    }
  }

  #buildNeighborLeg(ant, neighbor) {
    const dx = neighbor.position.x - ant.position.x;
    const dy = neighbor.position.y - ant.position.y;
    const distance = Math.max(8, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    const directionX = distance === 0 ? 0 : dx / distance;
    const directionY = distance === 0 ? -1 : dy / distance;

    return {
      targetType: "ant",
      targetId: neighbor.id,
      targetOffsetX: -directionX * 5,
      targetOffsetY: -directionY * 5,
      preferredAngle: angle,
      restLength: clamp(
        distance * (0.86 + this.random() * 0.08),
        10,
        PHYSICS_TUNING.legRestLength + PHYSICS_TUNING.legRestLengthVariance
      ),
      label: `ant ${neighbor.id}`,
      debugDirectionX: directionX,
      debugDirectionY: directionY,
    };
  }

  #buildEnvironmentAnchors(ant, mapSystem) {
    const anchors = [];
    const extraSpread = ANT_TUNING.extraAnchorSpreadX;
    const wallAnchors = [];

    for (const wall of mapSystem.walls) {
      const nearTop = ant.position.x >= wall.x - ANT_TUNING.supportHalfWidth &&
        ant.position.x <= wall.x + wall.width + ANT_TUNING.supportHalfWidth &&
        Math.abs(ant.position.y - (wall.y - ANT_TUNING.supportHeight)) <= ANT_TUNING.wallAnchorReachY;
      const nearLeftSide = Math.abs(ant.position.x - wall.x) <= ANT_TUNING.wallAnchorReachX &&
        ant.position.y >= wall.y - ANT_TUNING.wallAnchorReachY &&
        ant.position.y <= wall.y + wall.height + ANT_TUNING.wallAnchorReachY;
      const nearRightSide = Math.abs(ant.position.x - (wall.x + wall.width)) <= ANT_TUNING.wallAnchorReachX &&
        ant.position.y >= wall.y - ANT_TUNING.wallAnchorReachY &&
        ant.position.y <= wall.y + wall.height + ANT_TUNING.wallAnchorReachY;
      const supportedByWall = ant.movement.supportType === "wall" && ant.movement.supportId === wall.id;

      if (!nearTop && !nearLeftSide && !nearRightSide && !supportedByWall) {
        continue;
      }

      if (nearLeftSide || nearRightSide) {
        const anchorX = nearLeftSide ? wall.x - ANT_TUNING.wallSupportPadding : wall.x + wall.width + ANT_TUNING.wallSupportPadding;
        const baseY = clamp(ant.position.y - ANT_TUNING.wallAnchorOffsetY, wall.y + 4, wall.y + wall.height - 4);
        wallAnchors.push(
          this.#createEnvironmentLeg("wall", wall.id, anchorX, baseY - extraSpread, nearLeftSide ? -1 : 1, -0.4),
          this.#createEnvironmentLeg("wall", wall.id, anchorX, baseY, nearLeftSide ? -1 : 1, 0),
          this.#createEnvironmentLeg("wall", wall.id, anchorX, baseY + extraSpread, nearLeftSide ? -1 : 1, 0.4)
        );
      } else {
        const baseX = clamp(ant.position.x, wall.x + ANT_TUNING.wallSupportPadding + 4, wall.x + wall.width - ANT_TUNING.wallSupportPadding - 4);
        wallAnchors.push(
          this.#createEnvironmentLeg("wall", wall.id, baseX - extraSpread, wall.y - ANT_TUNING.wallSupportPadding, -0.4, -1),
          this.#createEnvironmentLeg("wall", wall.id, baseX, wall.y - ANT_TUNING.wallSupportPadding, 0, -1),
          this.#createEnvironmentLeg("wall", wall.id, baseX + extraSpread, wall.y - ANT_TUNING.wallSupportPadding, 0.4, -1)
        );
      }

      break;
    }

    if (wallAnchors.length > 0) {
      anchors.push(...wallAnchors);
    }

    const nearGround = ant.movement.supportType === "ground" || Math.abs(ant.position.y - ant.movement.groundY) <= ANT_TUNING.supportHeight * 0.75;
    if (nearGround) {
      const anchorY = ant.movement.groundY + ANT_TUNING.supportHeight * 0.72;
      anchors.push(
        this.#createEnvironmentLeg("ground", "ground", ant.position.x - ANT_TUNING.groundAnchorOffsetX - extraSpread, anchorY, -0.8, 1),
        this.#createEnvironmentLeg("ground", "ground", ant.position.x, anchorY, 0, 1),
        this.#createEnvironmentLeg("ground", "ground", ant.position.x + ANT_TUNING.groundAnchorOffsetX + extraSpread, anchorY, 0.8, 1)
      );
    }

    return anchors.slice(0, ANT_TUNING.graspLegSlotCount);
  }

  #createEnvironmentLeg(targetType, targetId, anchorX, anchorY, directionX, directionY) {
    const angle = Math.atan2(directionY, directionX);
    return {
      targetType,
      targetId,
      anchorX,
      anchorY,
      preferredAngle: angle,
      restLength: PHYSICS_TUNING.legRestLength + randomRange(this.random, -PHYSICS_TUNING.legRestLengthVariance, PHYSICS_TUNING.legRestLengthVariance),
      label: targetType,
      debugDirectionX: directionX,
      debugDirectionY: directionY,
    };
  }

  #isPairAlignedForGrasp(upperAnt, lowerAnt) {
    const targetTopY = lowerAnt.position.y - ANT_TUNING.supportHeight;
    const verticalDelta = Math.abs(upperAnt.position.y - targetTopY);
    if (verticalDelta > ANT_TUNING.graspVerticalTolerance) {
      return false;
    }

    const offsetX = Math.abs(upperAnt.position.x - lowerAnt.position.x);
    if (offsetX > ANT_TUNING.supportHalfWidth * (1 - ANT_TUNING.graspCoverageRatio / 2)) {
      return false;
    }

    return offsetX <= ANT_TUNING.graspHorizontalTolerance + ANT_TUNING.supportHalfWidth * (1 - ANT_TUNING.graspCoverageRatio / 2);
  }

  #getEffectiveDesire(ant) {
    return clamp((ant.brainState?.graspIntent ?? 0) + ant.attachment.thrillBoost, 0, 1);
  }

  #randomPollCooldown() {
    return randomRange(this.random, ANT_TUNING.graspPollCooldownMin, ANT_TUNING.graspPollCooldownMax);
  }
}





