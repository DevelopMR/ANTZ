import { ANT_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function removeConnection(ant, otherId) {
  ant.connectionIds = ant.connectionIds.filter((id) => id !== otherId);
  ant.attached = ant.connectionIds.length > 0;
  if (!ant.attached) {
    ant.attachment.groupId = null;
  }
}

function addConnection(left, rightId) {
  if (left.connectionIds.includes(rightId)) {
    return;
  }
  if (left.connectionIds.length >= ANT_TUNING.maxConnections) {
    return;
  }

  left.connectionIds.push(rightId);
  left.attached = true;
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

export class AttachmentSystem {
  constructor(random = Math.random) {
    this.random = random;
    this.nextGroupId = 1;
  }

  update(ants, deltaTime) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));

    for (const ant of ants) {
      this.#decayAttachmentState(ant, deltaTime, antById);
    }

    for (const ant of ants) {
      this.#attemptPerchedGrasp(ant, ants, antById);
    }
  }

  #decayAttachmentState(ant, deltaTime, antById) {
    ant.attachment.pollCooldown = Math.max(0, ant.attachment.pollCooldown - deltaTime);
    ant.attachment.thrillBoost = Math.max(0, ant.attachment.thrillBoost - ANT_TUNING.graspThrillDecayPerSecond * deltaTime);

    if (!ant.attached) {
      return;
    }

    const effectiveDesire = this.#getEffectiveDesire(ant);
    if (effectiveDesire >= ANT_TUNING.graspHoldThreshold) {
      return;
    }

    const connectedIds = [...ant.connectionIds];
    for (const otherId of connectedIds) {
      const otherAnt = antById.get(otherId);
      if (otherAnt) {
        removeConnection(otherAnt, ant.id);
      }
      removeConnection(ant, otherId);
    }
  }

  #attemptPerchedGrasp(ant, ants, antById) {
    if (ant.attached || ant.attachment.pollCooldown > 0) {
      return;
    }

    if (ant.movement.supportType !== "ant" || ant.movement.verticalState !== "perched") {
      return;
    }

    const supportAnt = antById.get(ant.movement.supportAntId);
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

    this.#formAttachmentGroup(participants);
  }

  #findPollNeighbors(ant, supportAnt, ants) {
    const centerX = (ant.position.x + supportAnt.position.x) * 0.5;
    const centerY = (ant.position.y + supportAnt.position.y) * 0.5;

    return ants.filter((candidate) => {
      if (candidate.id === ant.id || candidate.id === supportAnt.id) {
        return false;
      }
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

  #formAttachmentGroup(participants) {
    const groupId = this.nextGroupId;
    this.nextGroupId += 1;

    const ordered = [...participants].sort((left, right) => left.position.x - right.position.x);

    for (let index = 0; index < ordered.length - 1; index += 1) {
      const left = ordered[index];
      const right = ordered[index + 1];
      addConnection(left, right.id);
      addConnection(right, left.id);
    }

    for (const ant of ordered) {
      ant.attached = ant.connectionIds.length > 0;
      ant.attachment.groupId = ant.attached ? groupId : null;
      ant.attachment.thrillBoost = clamp(
        ant.attachment.thrillBoost + randomRange(this.random, ANT_TUNING.graspThrillBoostMin, ANT_TUNING.graspThrillBoostMax),
        0,
        1
      );
      ant.attachment.pollCooldown = this.#randomPollCooldown();
      if (ant.movement.supportType === "ground") {
        ant.velocity.x = 0;
      }
    }
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
