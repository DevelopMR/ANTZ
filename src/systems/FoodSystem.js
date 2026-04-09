import { FOOD_TUNING, SIMULATION_TUNING, WORLD_WIDTH } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function countActiveLegs(ant) {
  return ant.attachment?.legs?.filter((leg) => leg.active).length ?? 0;
}

function clonePayload(payload) {
  if (!payload) {
    return null;
  }

  return {
    acquisitionCount: payload.acquisitionCount ?? 0,
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

  update(ants, deltaTime, mapSystem, queen, simulationController) {
    queen.lastFedTimer = Math.max(0, queen.lastFedTimer - deltaTime);

    for (const ant of ants) {
      ant.food.saluteTimer = Math.max(0, ant.food.saluteTimer - deltaTime);

      if (ant.food.carrying && ant.movement.verticalState === "falling") {
        this.#dropFoodOnCollapse(ant, mapSystem);
        continue;
      }

      if (ant.food.carrying) {
        this.#attemptQueenDelivery(ant, queen);
        continue;
      }

      this.#attemptFoodPickup(ant, ants, mapSystem, queen, simulationController);
    }
  }

  #attemptFoodPickup(ant, ants, mapSystem, queen, simulationController) {
    if (ant.carryingFood || ant.food.saluteTimer > 0) {
      return;
    }

    if (ant.attached || countActiveLegs(ant) > 0) {
      return;
    }

    if (ant.movement.verticalState === "falling") {
      return;
    }

    if ((ant.brainState?.interaction ?? 0) < FOOD_TUNING.interactionThreshold) {
      return;
    }

    const foodNode = mapSystem.findFullyContainedFoodNode(ant.position, FOOD_TUNING.pickupInset);
    if (!foodNode) {
      return;
    }

    const taken = mapSystem.takeFoodUnit(foodNode.id, FOOD_TUNING.carryUnitAmount);
    if ((taken?.amount ?? 0) <= 0) {
      return;
    }

    const contributionPath = simulationController.connectionTreeSystem.resolveFoodContributionPath(ant, ants);
    const mergedPayload = simulationController.connectionTreeSystem.mergePayload(taken.rewardPayload, contributionPath);

    ant.food.mealsEaten += FOOD_TUNING.mealUnitAmount;
    ant.food.carrying = true;
    ant.food.carriedAmount = taken.amount;
    ant.food.sourceNodeId = foodNode.id;
    ant.food.carriedPayload = clonePayload(mergedPayload);
    ant.food.rewardPathPreview = clonePayload(mergedPayload)?.latestPath ?? null;
    ant.food.returnMode = "queen";
    ant.food.deliveryTargetX = queen.position.x + FOOD_TUNING.queenDeliveryOffsetX;
    ant.food.deliveryTargetY = queen.position.y;
    ant.carryingFood = true;
  }

  #attemptQueenDelivery(ant, queen) {
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

    queen.foodReceived += ant.food.carriedAmount;
    queen.deliveryCount += 1;
    queen.lastFedAmount = ant.food.carriedAmount;
    queen.lastFedTimer = FOOD_TUNING.saluteDuration;

    ant.food.deliveryCount += 1;
    ant.food.lastDeliveredAmount = ant.food.carriedAmount;
    ant.food.saluteTimer = FOOD_TUNING.saluteDuration;

    const spawnCount = this.#randomSpawnCount() * Math.max(1, ant.food.carriedAmount);
    const queuedPayload = clonePayload(ant.food.carriedPayload);
    queen.pendingSpawnQueue.push({
      count: spawnCount,
      payload: queuedPayload,
    });
    queen.pendingGenomePool = queuedPayload?.contributors?.map((contributor) => ({ ...contributor })) ?? [];

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
