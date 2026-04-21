import { ANT_TUNING, CORPSE_TUNING, FITNESS_TUNING, FOOD_TUNING, LIFE_TUNING, SIMULATION_TUNING, WORLD_WIDTH } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function countActiveLegs(ant) {
  return ant.attachment?.legs?.filter((leg) => leg.active).length ?? 0;
}

function getFoodPickupProbePosition(ant) {
  return {
    x: ant.position.x,
    y: ant.position.y - ANT_TUNING.supportHeight * 0.4,
  };
}

function isCorpseAnt(ant) {
  return ant.state === "dead" || ant.state === "decaying";
}

function buildCorpsePayload(corpseAnt) {
  if (!corpseAnt) {
    return null;
  }

  const contributorWeight = corpseAnt.state === "decaying"
    ? corpseAnt.corpse?.decayingContributorWeightMultiplier ?? 0.2
    : corpseAnt.corpse?.deadContributorWeightMultiplier ?? 0.4;
  const genomeSnapshot = {
    brainLayers: (corpseAnt.brain?.layers ?? []).map((layer) => ({
      activation: layer.activation,
      weights: layer.weights.map((row) => [...row]),
      biases: [...layer.biases],
    })),
    traits: { ...corpseAnt.traits },
  };

  return {
    acquisitionCount: 1,
    acquisitionPacks: [
      {
        packIndex: 0,
        obtainerId: corpseAnt.id,
        baseType: "corpse",
        baseId: corpseAnt.id,
        contributors: [
          {
            antId: corpseAnt.id,
            weight: contributorWeight,
            role: "corpse-source",
            depth: 0,
            isCorpse: true,
            genomeSnapshot,
          },
        ],
      },
    ],
    contributors: [
      {
        antId: corpseAnt.id,
        weight: contributorWeight,
        roles: ["corpse-source"],
        touches: 1,
        isCorpse: true,
      },
    ],
    latestPath: {
      obtainerId: corpseAnt.id,
      baseType: "corpse",
      baseId: corpseAnt.id,
      contributors: [
        {
          antId: corpseAnt.id,
          weight: contributorWeight,
          role: "corpse-source",
          depth: 0,
          isCorpse: true,
        },
      ],
    },
  };
}

function clonePayload(payload) {
  if (!payload) {
    return null;
  }

  return {
    acquisitionCount: payload.acquisitionCount ?? 0,
    acquisitionPacks: (payload.acquisitionPacks ?? []).map((pack) => ({
      packIndex: pack.packIndex,
      obtainerId: pack.obtainerId,
      baseType: pack.baseType,
      baseId: pack.baseId,
        contributors: (pack.contributors ?? []).map((contributor) => ({
          antId: contributor.antId,
          weight: contributor.weight,
          role: contributor.role,
          depth: contributor.depth,
          isCorpse: contributor.isCorpse ?? false,
          genomeSnapshot: contributor.genomeSnapshot
            ? {
              brainLayers: (contributor.genomeSnapshot.brainLayers ?? []).map((layer) => ({
                activation: layer.activation,
                weights: layer.weights.map((row) => [...row]),
                biases: [...layer.biases],
              })),
              traits: { ...contributor.genomeSnapshot.traits },
            }
          : null,
      })),
    })),
    contributors: (payload.contributors ?? []).map((contributor) => ({ ...contributor })),
    latestPath: payload.latestPath
      ? {
          obtainerId: payload.latestPath.obtainerId,
          baseType: payload.latestPath.baseType,
          baseId: payload.latestPath.baseId,
          contributors: (payload.latestPath.contributors ?? []).map((entry) => ({ ...entry })),
        }
      : null,
  };
}

function applyConnectionTreeReward(contributionPath, ants) {
  const orderedContributors = [...(contributionPath?.contributors ?? [])]
    .sort((left, right) => right.depth - left.depth);

  let reward = FITNESS_TUNING.connectionTreeBaseReward;
  for (const contributor of orderedContributors) {
    const contributorAnt = ants.find((candidate) => candidate.id === contributor.antId);
    if (!contributorAnt) {
      reward *= FITNESS_TUNING.connectionTreeClimberMultiplier;
      continue;
    }

    if (isCorpseAnt(contributorAnt)) {
      reward *= FITNESS_TUNING.connectionTreeClimberMultiplier;
      continue;
    }

    contributorAnt.season.rewardContribution += reward;
    reward *= FITNESS_TUNING.connectionTreeClimberMultiplier;
  }
}

function clearCarriedFood(ant) {
  ant.food.carrying = false;
  ant.food.carriedAmount = 0;
  ant.food.sourceNodeId = null;
  ant.food.carriedPayload = null;
  ant.food.returnMode = "none";
  ant.food.deliveryTargetX = 0;
  ant.food.deliveryTargetY = 0;
  ant.food.rewardPathPreview = null;
  ant.carryingFood = false;
}

export class FoodSystem {
  constructor(random = Math.random) {
    this.random = random;
  }

  update(ants, allAnts, deltaTime, mapSystem, queen, simulationController) {
    queen.lastFedTimer = Math.max(0, queen.lastFedTimer - deltaTime);
    queen.mealCooldown = Math.max(0, queen.mealCooldown - deltaTime);

    for (const ant of ants) {
      ant.food.saluteTimer = Math.max(0, ant.food.saluteTimer - deltaTime);

      if (ant.food.carrying && ant.movement.verticalState === "falling") {
        this.#dropFoodOnCollapse(ant, mapSystem);
        continue;
      }

      if (ant.food.carrying) {
        this.#attemptQueenDelivery(ant, queen, simulationController);
        continue;
      }

      this.#attemptFoodPickup(ant, allAnts, mapSystem, queen, simulationController);
    }
  }

  dropCarriedFood(ant, mapSystem) {
    this.#dropFoodOnCollapse(ant, mapSystem);
  }

  #attemptFoodPickup(ant, ants, mapSystem, queen, simulationController) {
    if (ant.carryingFood || ant.food.saluteTimer > 0) {
      return;
    }

    if (ant.movement.verticalState === "falling") {
      return;
    }

    const interactionDrive = (ant.brainState?.interaction ?? 0) * ant.traits.interactDriveBias;
    if (interactionDrive < FOOD_TUNING.interactionThreshold) {
      return;
    }

    const pickupProbe = getFoodPickupProbePosition(ant);
    const foodNode = mapSystem.findFullyContainedFoodNode(pickupProbe, FOOD_TUNING.pickupInset);
    if (foodNode) {
      const taken = mapSystem.takeFoodUnit(foodNode.id, FOOD_TUNING.carryUnitAmount);
      if ((taken?.amount ?? 0) <= 0) {
        return;
      }

      const contributionPath = simulationController.connectionTreeSystem.resolveFoodContributionPath(ant, ants);
      const mergedPayload = simulationController.connectionTreeSystem.mergePayload(taken.rewardPayload, contributionPath, ants);

      applyConnectionTreeReward(contributionPath, ants);
      this.#startCarryFromSource(ant, taken.amount, foodNode.id, clonePayload(mergedPayload), queen, simulationController, ants);
      ant.food.mealsEaten += FOOD_TUNING.mealUnitAmount;
      ant.season.mealsEaten += FOOD_TUNING.mealUnitAmount;
      return;
    }

    const corpseAnt = this.#findHarvestableCorpse(pickupProbe, ants, ant.id);
    if (!corpseAnt) {
      return;
    }

    corpseAnt.corpse.availableFoodUnits = Math.max(0, (corpseAnt.corpse.availableFoodUnits ?? 0) - CORPSE_TUNING.harvestFoodUnits);
    corpseAnt.corpse.harvestedFoodUnits = (corpseAnt.corpse.harvestedFoodUnits ?? 0) + CORPSE_TUNING.harvestFoodUnits;
    corpseAnt.corpse.harvestedAtSeasonTime = simulationController.currentSeason.elapsedSeconds;

    const corpsePayload = buildCorpsePayload(corpseAnt);
    const contributionPath = simulationController.connectionTreeSystem.resolveFoodContributionPath(ant, ants);
    const mergedPayload = simulationController.connectionTreeSystem.mergePayload(corpsePayload, contributionPath, ants);

    this.#startCarryFromSource(ant, CORPSE_TUNING.harvestFoodUnits, `corpse-${corpseAnt.id}`, clonePayload(mergedPayload), queen, simulationController, ants);
    ant.food.mealsEaten += CORPSE_TUNING.harvestFoodUnits;
    ant.season.mealsEaten += CORPSE_TUNING.harvestFoodUnits;
  }

  #findHarvestableCorpse(position, ants, pickerAntId) {
    let bestCorpse = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const ant of ants) {
      if (ant.id === pickerAntId || !isCorpseAnt(ant) || ant.corpse?.removePending) {
        continue;
      }

      if ((ant.corpse?.availableFoodUnits ?? 0) <= 0) {
        continue;
      }

      const distance = Math.hypot(position.x - ant.position.x, position.y - ant.position.y);
      if (distance > CORPSE_TUNING.pickupRadius || distance >= bestDistance) {
        continue;
      }

      bestDistance = distance;
      bestCorpse = ant;
    }

    return bestCorpse;
  }

  #startCarryFromSource(ant, amount, sourceNodeId, payload, queen, simulationController, ants) {
    if (ant.attached || countActiveLegs(ant) > 0) {
      simulationController.attachmentSystem.releaseAntForFoodCarry(ant, ants);
    }

    ant.life.lifespanRemaining = Math.max(ant.life.lifespanRemaining, ant.life.baseLifespanSeconds);
    ant.life.lifespanRemaining += LIFE_TUNING.mealRestoreSeconds;
    ant.food.carrying = true;
    ant.food.carriedAmount = amount;
    ant.food.sourceNodeId = sourceNodeId;
    ant.food.carriedPayload = clonePayload(payload);
    ant.food.rewardPathPreview = clonePayload(payload)?.latestPath ?? null;
    ant.food.returnMode = "queen";
    ant.food.deliveryTargetX = queen.position.x + FOOD_TUNING.queenDeliveryOffsetX;
    ant.food.deliveryTargetY = queen.position.y;
    ant.carryingFood = true;
  }

  #attemptQueenDelivery(ant, queen, simulationController) {
    const deliveryPoint = {
      x: queen.position.x + FOOD_TUNING.queenDeliveryOffsetX,
      y: queen.position.y,
    };

    const dx = deliveryPoint.x - ant.position.x;
    const dy = deliveryPoint.y - ant.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance > FOOD_TUNING.queenDeliveryRadius || ant.movement.verticalState === "falling") {
      return;
    }

    ant.position.x = deliveryPoint.x;
    ant.position.y = Math.min(ant.position.y, ant.movement.groundY);
    ant.velocity.x = 0;
    ant.velocity.y = 0;

    queen.foodDelivered += ant.food.carriedAmount;
    queen.deliveryCount += 1;
    ant.season.foodDelivered += ant.food.carriedAmount;
    ant.food.deliveryCount += 1;
    ant.food.lastDeliveredAmount = ant.food.carriedAmount;
    ant.food.saluteTimer = FOOD_TUNING.saluteDuration;

    const queuedPayload = clonePayload(ant.food.carriedPayload);
    const spawnCount = this.#randomSpawnCount() * Math.max(1, ant.food.carriedAmount);
    queen.mealQueue.push({
      amount: ant.food.carriedAmount,
      payload: queuedPayload,
      spawnCount,
    });
    simulationController.recordSeasonMealPayload(queuedPayload);

    clearCarriedFood(ant);
  }

  #dropFoodOnCollapse(ant, mapSystem) {
    const droppedAmount = ant.food.carriedAmount;
    if (droppedAmount > 0) {
      mapSystem.spawnDroppedFood(
        clamp(ant.position.x, 28, WORLD_WIDTH - 28),
        SIMULATION_TUNING.groundY - FOOD_TUNING.droppedFoodGroundOffsetY,
        droppedAmount,
        clonePayload(ant.food.carriedPayload)
      );
      ant.food.lastDroppedAmount = droppedAmount;
    }

    clearCarriedFood(ant);
  }

  #randomSpawnCount() {
    const span = FOOD_TUNING.spawnOnFeedMax - FOOD_TUNING.spawnOnFeedMin + 1;
    return FOOD_TUNING.spawnOnFeedMin + Math.floor(this.random() * span);
  }
}
