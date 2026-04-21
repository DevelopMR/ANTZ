import { NeuralNet } from "../ai/NeuralNet.js";
import { MapSystem } from "./MapSystem.js";
import { SensorSystem } from "./SensorSystem.js";
import { BrainSystem } from "./BrainSystem.js";
import { AttachmentSystem } from "./AttachmentSystem.js";
import { PhysicsSystem } from "./PhysicsSystem.js";
import { FoodSystem } from "./FoodSystem.js";
import { FoodScentSystem } from "./FoodScentSystem.js";
import { ConnectionTreeSystem } from "./ConnectionTreeSystem.js";
import { Ant } from "../entities/Ant.js";
import { Queen } from "../entities/Queen.js";
import {
  ANT_TUNING,
  CONNECTION_TREE_TUNING,
  CORPSE_TUNING,
  FITNESS_TUNING,
  FOOD_TUNING,
  LIFE_TUNING,
  MUTATION_TUNING,
  NEURAL_TUNING,
  SEASON_TUNING,
  SIMULATION_TUNING,
  TRAIT_TUNING,
} from "../config/tuning.js";
import { MovementSystem } from "./MovementSystem.js";

function randomRange(random, min, max) {
  return min + (max - min) * random();
}

function shuffleInPlace(values, random) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function cloneGenomeSnapshot(genomeSnapshot) {
  if (!genomeSnapshot) {
    return null;
  }

  return {
    brainLayers: (genomeSnapshot.brainLayers ?? []).map((layer) => ({
      activation: layer.activation,
      weights: layer.weights.map((row) => [...row]),
      biases: [...layer.biases],
    })),
    traits: { ...genomeSnapshot.traits },
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
        genomeSnapshot: cloneGenomeSnapshot(contributor.genomeSnapshot),
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

function createSeasonState(index) {
  return {
    index,
    elapsedSeconds: 0,
    deliveredPayloads: [],
    connectionTreePacks: [],
    spawnHistory: [],
  };
}

function clampCount(value, total) {
  return Math.max(0, Math.min(total, Math.round(value)));
}

function computeCorpseScentIntensity(corpse) {
  if (!corpse || corpse.state === "none") {
    return 0;
  }

  const totalDuration = corpse.state === "dead"
    ? Math.max(corpse.deadDurationSeconds, 0.0001)
    : Math.max(corpse.decayDurationSeconds, 0.0001);
  const progress = Math.max(0, Math.min(1, corpse.stateElapsedSeconds / totalDuration));
  return corpse.scentBaseIntensity * Math.pow(1 - progress, corpse.scentCurveExponent);
}

export class SimulationController {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.mapSystem = new MapSystem();
    this.sensorSystem = new SensorSystem();
    this.brainSystem = new BrainSystem();
    this.movementSystem = new MovementSystem(random);
    this.attachmentSystem = new AttachmentSystem(random);
    this.physicsSystem = new PhysicsSystem(random);
    this.foodSystem = new FoodSystem(random);
    this.foodScentSystem = new FoodScentSystem();
    this.connectionTreeSystem = new ConnectionTreeSystem();
    this.foodScentOverlayEnabled = false;
    this.accumulator = 0;
    this.elapsedTime = 0;
    this.ants = [];
    this.nextAntId = 0;
    this.debugFocusAntId = null;
    this.seasonHistory = [];
    this.currentSeason = createSeasonState(1);
    this.queen = new Queen(SIMULATION_TUNING.queenPosition);
    this.goal = {
      position: { ...SIMULATION_TUNING.exitPosition },
    };

    this.#spawnInitialAnts();
    this.foodScentSystem.update(this.mapSystem, SIMULATION_TUNING.fixedTimeStep);
    this.sensorSystem.update(this.#getLivingAnts(), this.mapSystem, this.queen, this.foodScentSystem);
    this.brainSystem.update(this.#getLivingAnts());
  }

  update(deltaTime) {
    const safeDelta = Math.min(deltaTime, SIMULATION_TUNING.maxDeltaTime);
    this.accumulator += safeDelta;
    this.elapsedTime += safeDelta;

    while (this.accumulator >= SIMULATION_TUNING.fixedTimeStep) {
      this.currentSeason.elapsedSeconds += SIMULATION_TUNING.fixedTimeStep;
      const livingAnts = this.#getLivingAnts();
      const movableAnts = this.#getMovableAnts();

      this.foodScentSystem.update(this.mapSystem, SIMULATION_TUNING.fixedTimeStep);
      this.sensorSystem.update(livingAnts, this.mapSystem, this.queen, this.foodScentSystem);
      this.brainSystem.update(livingAnts);
      this.movementSystem.update(movableAnts, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.attachmentSystem.update(livingAnts, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.physicsSystem.update(livingAnts, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.foodSystem.update(livingAnts, SIMULATION_TUNING.fixedTimeStep, this.mapSystem, this.queen, this);
      this.#processQueenLifecycle(SIMULATION_TUNING.fixedTimeStep);
      this.#updateLifeCycle(SIMULATION_TUNING.fixedTimeStep);
      this.#refreshDebugFocus();
      this.accumulator -= SIMULATION_TUNING.fixedTimeStep;

      if (this.#getLivingAnts().length === 0) {
        this.#completeSeasonAndRestart();
        break;
      }
    }
  }

  spawnAntBatch({ count, origin, genomeSource = null, genomePicker = null }) {
    const spawnedAnts = [];

    for (let index = 0; index < count; index += 1) {
      const resolvedGenomeSource = genomePicker ? genomePicker(index) : genomeSource;
      const ant = this.#createAnt({
        x: origin.x + randomRange(this.random, FOOD_TUNING.spawnOffsetRightMin, FOOD_TUNING.spawnOffsetRightMax),
        y: SIMULATION_TUNING.groundY,
      }, resolvedGenomeSource);
      this.ants.push(ant);
      spawnedAnts.push(ant);
    }

    return spawnedAnts;
  }

  setFoodScentOverlayEnabled(enabled) {
    this.foodScentOverlayEnabled = enabled;
    this.foodScentSystem.setOverlayEnabled(enabled);
  }

  recordSeasonMealPayload(payload) {
    if (!payload) {
      return;
    }

    const clonedPayload = clonePayload(payload);
    this.currentSeason.deliveredPayloads.push(clonedPayload);
    for (const pack of clonedPayload.acquisitionPacks ?? []) {
      this.currentSeason.connectionTreePacks.push({
        packIndex: pack.packIndex,
        obtainerId: pack.obtainerId,
        baseType: pack.baseType,
        baseId: pack.baseId,
        contributors: (pack.contributors ?? []).map((contributor) => ({
          antId: contributor.antId,
          weight: contributor.weight,
          role: contributor.role,
          depth: contributor.depth,
          genomeSnapshot: cloneGenomeSnapshot(contributor.genomeSnapshot),
        })),
      });
    }
  }

  #processQueenLifecycle(deltaTime) {
    this.queen.spawnCooldown = Math.max(0, this.queen.spawnCooldown - deltaTime);

    if (this.queen.mealCooldown <= 0 && this.queen.mealQueue.length > 0) {
      const meal = this.queen.mealQueue.shift();
      this.queen.foodReceived += meal.amount;
      this.queen.lastFedAmount = meal.amount;
      this.queen.lastFedTimer = FOOD_TUNING.saluteDuration;
      this.queen.mealCooldown = FOOD_TUNING.queenMealInterval;
      this.queen.pendingSpawnQueue.push({
        count: meal.spawnCount,
        payload: clonePayload(meal.payload),
        spawnPlan: null,
        nextSpawnIndex: 0,
      });
    }

    while (this.queen.pendingSpawnQueue.length > 0 && !this.queen.pendingSpawnQueue[0].spawnPlan) {
      const queuedSpawn = this.queen.pendingSpawnQueue[0];
      queuedSpawn.spawnPlan = this.connectionTreeSystem.buildSpawnPlan(
        queuedSpawn.payload,
        queuedSpawn.count,
        this.random
      );
      queuedSpawn.nextSpawnIndex = 0;
      this.queen.pendingGenomePool = queuedSpawn.payload?.contributors?.map((contributor) => ({ ...contributor })) ?? [];
      this.queen.pendingSpawnCount = queuedSpawn.spawnPlan.length;
      if (!queuedSpawn.spawnPlan.length) {
        this.queen.pendingSpawnQueue.shift();
      }
    }

    if (this.queen.spawnCooldown > 0 || this.queen.pendingSpawnQueue.length === 0) {
      return;
    }

    const queuedSpawn = this.queen.pendingSpawnQueue[0];
    const genomeSource = queuedSpawn.spawnPlan[queuedSpawn.nextSpawnIndex] ?? null;
    if (genomeSource) {
      const [spawnedAnt] = this.spawnAntBatch({
        count: 1,
        origin: this.queen.position,
        genomeSource,
      });
      this.queen.spawnedAntCount += 1;
      this.queen.spawnCooldown = FOOD_TUNING.spawnQueueInterval;
      queuedSpawn.nextSpawnIndex += 1;
      this.queen.pendingSpawnCount = Math.max(0, this.queen.pendingSpawnCount - 1);
      this.currentSeason.spawnHistory.push({
        seasonIndex: this.currentSeason.index,
        antId: spawnedAnt?.id ?? null,
        sourceAntId: genomeSource.antId ?? null,
        packIndex: genomeSource.packIndex ?? null,
        via: genomeSource.sourceType ?? "meal-queue",
        mutated: genomeSource.shouldMutate ?? false,
      });
      this.queen.spawnHistory.push({
        antId: spawnedAnt?.id ?? null,
        sourceAntId: genomeSource.antId ?? null,
        packIndex: genomeSource.packIndex ?? null,
        mutated: genomeSource.shouldMutate ?? false,
      });
    } else {
      queuedSpawn.nextSpawnIndex = queuedSpawn.spawnPlan.length;
    }

    if (queuedSpawn.nextSpawnIndex >= queuedSpawn.spawnPlan.length) {
      this.queen.pendingSpawnQueue.shift();
      if (this.queen.pendingSpawnQueue.length === 0) {
        this.queen.pendingGenomePool = [];
        this.queen.pendingSpawnCount = 0;
      }
    }
  }

  #updateLifeCycle(deltaTime) {
    for (const ant of this.#getLivingAnts()) {
      ant.life.ageSeconds += deltaTime;
      ant.life.lifespanRemaining -= deltaTime;
      ant.season.fitnessScore = this.#computeFitnessScore(ant);

      if (
        ant.life.lifespanRemaining <= 0 ||
        (ant.life.fallCount ?? 0) >= ANT_TUNING.maxFallsBeforeDeath
      ) {
        this.#handleAntDeath(ant);
      }
    }

    for (const ant of this.ants) {
      if (ant.state === "dead" || ant.state === "decaying") {
        this.#updateCorpseState(ant, deltaTime);
      }
    }
  }

  #handleAntDeath(ant) {
    if (ant.state === "dead" || ant.state === "decaying") {
      return;
    }

    if (ant.carryingFood || ant.food?.carrying) {
      this.foodSystem.dropCarriedFood(ant, this.mapSystem);
    }

    this.attachmentSystem.releaseAntForDeath(ant, this.ants);
    ant.state = "dead";
    ant.life.deadAtSeasonTime = this.currentSeason.elapsedSeconds;
    ant.corpse.state = "dead";
    ant.corpse.stateElapsedSeconds = 0;
    ant.corpse.removePending = false;
    ant.corpse.harvestedAtSeasonTime = null;
    ant.corpse.scentIntensity = computeCorpseScentIntensity(ant.corpse);
    ant.brainState.xVel = 0;
    ant.brainState.yVel = 0;
    ant.brainState.graspIntent = 0;
    ant.brainState.interaction = 0;
    ant.visualState = "dead";
  }

  #updateCorpseState(ant, deltaTime) {
    ant.corpse.stateElapsedSeconds += deltaTime;

    if (
      ant.corpse.state === "dead" &&
      ant.corpse.stateElapsedSeconds >= ant.corpse.deadDurationSeconds
    ) {
      ant.state = "decaying";
      ant.corpse.state = "decaying";
      ant.corpse.stateElapsedSeconds = 0;
    }

    if (
      ant.corpse.state === "decaying" &&
      ant.corpse.stateElapsedSeconds >= ant.corpse.decayDurationSeconds
    ) {
      ant.corpse.removePending = true;
    }

    ant.corpse.scentIntensity = computeCorpseScentIntensity(ant.corpse);
  }

  #completeSeasonAndRestart() {
    const finishedSeason = this.#buildSeasonSummary();
    this.seasonHistory.push(finishedSeason);
    const nextGenerationSources = this.#buildNextGenerationSources(finishedSeason);

    this.mapSystem = new MapSystem();
    this.foodScentSystem = new FoodScentSystem();
    this.foodScentSystem.setOverlayEnabled(this.foodScentOverlayEnabled);
    this.queen = new Queen(SIMULATION_TUNING.queenPosition);
    this.ants = [];
    this.nextAntId = 0;
    this.debugFocusAntId = null;
    this.currentSeason = createSeasonState(finishedSeason.index + 1);
    this.movementSystem.totalFalls = 0;
    this.#spawnInitialAnts(nextGenerationSources);
    this.foodScentSystem.update(this.mapSystem, SIMULATION_TUNING.fixedTimeStep);
    this.sensorSystem.update(this.#getLivingAnts(), this.mapSystem, this.queen, this.foodScentSystem);
    this.brainSystem.update(this.#getLivingAnts());
  }

  #buildSeasonSummary() {
    const ants = [...this.ants];
    for (const ant of ants) {
      ant.season.fitnessScore = this.#computeFitnessScore(ant);
    }

    return {
      index: this.currentSeason.index,
      elapsedSeconds: this.currentSeason.elapsedSeconds,
      ants,
      deliveredPayloads: this.currentSeason.deliveredPayloads.map((payload) => clonePayload(payload)),
      connectionTreePacks: this.currentSeason.connectionTreePacks.map((pack) => ({
        packIndex: pack.packIndex,
        obtainerId: pack.obtainerId,
        baseType: pack.baseType,
        baseId: pack.baseId,
        contributors: (pack.contributors ?? []).map((contributor) => ({
          antId: contributor.antId,
          weight: contributor.weight,
          role: contributor.role,
          depth: contributor.depth,
          genomeSnapshot: cloneGenomeSnapshot(contributor.genomeSnapshot),
        })),
      })),
      spawnHistory: [...this.currentSeason.spawnHistory],
      topFitness: [...ants]
        .sort((left, right) => right.season.fitnessScore - left.season.fitnessScore)
        .slice(0, 10)
        .map((ant) => ({ id: ant.id, fitness: ant.season.fitnessScore })),
    };
  }

  #buildNextGenerationSources(seasonSummary) {
    const totalAnts = SIMULATION_TUNING.antCount;
    const randomCount = Math.round(totalAnts * SEASON_TUNING.randomShare);
    const fitnessCloneCount = Math.round(totalAnts * SEASON_TUNING.fitnessCloneShare);
    const connectionTreeCount = totalAnts - randomCount - fitnessCloneCount;
    const generationSources = [];

    for (let index = 0; index < randomCount; index += 1) {
      generationSources.push(null);
    }

    const sortedFitnessAnts = [...seasonSummary.ants]
      .sort((left, right) => right.season.fitnessScore - left.season.fitnessScore)
      .filter((ant) => Number.isFinite(ant.season.fitnessScore));

    for (let index = 0; index < fitnessCloneCount; index += 1) {
      const sourceAnt = sortedFitnessAnts[index % Math.max(sortedFitnessAnts.length, 1)] ?? null;
      if (!sourceAnt) {
        generationSources.push(null);
        continue;
      }

      generationSources.push({
        sourceType: "fitness-clone",
        antId: sourceAnt.id,
        genomeSnapshot: this.#snapshotGenomeFromAnt(sourceAnt),
        shouldMutate: false,
      });
    }

    const seasonPayload = {
      acquisitionPacks: seasonSummary.connectionTreePacks,
    };
    const seasonPlan = this.connectionTreeSystem.buildSpawnPlan(seasonPayload, connectionTreeCount, this.random);
    for (const genomeSource of seasonPlan) {
      generationSources.push({
        ...genomeSource,
        sourceType: "season-pack",
        genomeSnapshot: cloneGenomeSnapshot(genomeSource.genomeSnapshot),
        shouldMutate: false,
      });
    }

    this.#assignMutationShare(generationSources, "fitness-clone", MUTATION_TUNING.fitnessCloneMutationShare);
    this.#assignMutationShare(generationSources, "season-pack", MUTATION_TUNING.seasonPackMutationShare);

    while (generationSources.length < totalAnts) {
      generationSources.push(null);
    }

    return shuffleInPlace(generationSources.slice(0, totalAnts), this.random);
  }

  #spawnInitialAnts(generationSources = null) {
    this.ants.length = 0;
    this.nextAntId = 0;

    for (let index = 0; index < SIMULATION_TUNING.antCount; index += 1) {
      const xOffset = randomRange(this.random, -24, SIMULATION_TUNING.spawnWidth);
      const genomeSource = generationSources?.[index] ?? null;

      this.ants.push(this.#createAnt({
        x: this.queen.position.x + xOffset,
        y: SIMULATION_TUNING.groundY,
      }, genomeSource));
    }
  }

  #createAnt(position, genomeSource = null) {
    const initialDirection = this.random() > 0.35 ? 1 : -1;
    const visualState = ANT_TUNING.visualStateCycle[this.nextAntId % ANT_TUNING.visualStateCycle.length];
    const parentGenome = this.#resolveParentGenome(genomeSource);
    const movementProfile = {
      ...this.#buildMovementTraits(parentGenome?.traits, genomeSource),
      initialDirection,
      groundY: position.y,
      postureTimer: randomRange(
        this.random,
        ANT_TUNING.postureDurationMin,
        ANT_TUNING.postureDurationMax
      ),
      lifespanSeconds: this.#randomInitialLifespan(),
    };
    const ant = new Ant({
      id: this.nextAntId,
      position,
      movementProfile,
      visualProfile: {
        state: visualState,
        facing: initialDirection,
        animationOffset: randomRange(this.random, 0, 1),
        frameSeed: randomRange(this.random, 0, 10),
      },
      random: this.random,
    });

    if (parentGenome?.brainLayers?.length) {
      ant.brain = this.#applyMutation(new NeuralNet({
        inputCount: NEURAL_TUNING.inputCount,
        hiddenLayers: NEURAL_TUNING.hiddenLayers,
        outputCount: NEURAL_TUNING.outputCount,
        outputActivations: ["tanh", "tanh", "sigmoid", "sigmoid"],
        layers: parentGenome.brainLayers,
      }), genomeSource);
    }

    ant.lineageSource = genomeSource
      ? { ...genomeSource, genomeSnapshot: undefined }
      : null;
    ant.season.fitnessScore = this.#computeFitnessScore(ant);
    this.nextAntId += 1;
    return ant;
  }

  #resolveParentGenome(genomeSource) {
    if (!genomeSource) {
      return null;
    }

    if (genomeSource.genomeSnapshot) {
      return cloneGenomeSnapshot(genomeSource.genomeSnapshot);
    }

    if (genomeSource.antId == null) {
      return null;
    }

    const parentAnt = this.ants.find((ant) => ant.id === genomeSource.antId) ?? null;
    if (!parentAnt) {
      return null;
    }

    return this.#snapshotGenomeFromAnt(parentAnt);
  }

  #snapshotGenomeFromAnt(ant) {
    return {
      brainLayers: ant.brain.clone().layers,
      traits: { ...ant.traits },
    };
  }

  #buildMovementTraits(parentTraits = null, genomeSource = null) {
    const traits = {};

    for (const name of TRAIT_TUNING.names) {
      const baseValue = parentTraits?.[name] ?? randomRange(this.random, TRAIT_TUNING.initialMin, TRAIT_TUNING.initialMax);
      traits[name] = this.#mutateTrait(baseValue, genomeSource);
    }

    return traits;
  }

  #applyMutation(neuralNet, genomeSource = null) {
    if (!genomeSource?.shouldMutate) {
      return neuralNet;
    }

    return neuralNet.mutate({
      rate: CONNECTION_TREE_TUNING.brainMutationRate,
      magnitude: CONNECTION_TREE_TUNING.brainMutationMagnitude,
      random: this.random,
    });
  }

  #mutateTrait(value, genomeSource = null) {
    if (!genomeSource?.shouldMutate) {
      return value;
    }

    const nextValue = value + randomRange(this.random, -TRAIT_TUNING.mutationRange, TRAIT_TUNING.mutationRange);
    return Math.max(TRAIT_TUNING.min, Math.min(TRAIT_TUNING.max, nextValue));
  }

  #assignMutationShare(generationSources, sourceType, mutationShare) {
    const eligible = generationSources
      .map((source, index) => ({ source, index }))
      .filter(({ source }) => source?.sourceType === sourceType);

    const targetCount = clampCount(eligible.length * mutationShare, eligible.length);
    const shuffled = shuffleInPlace([...eligible], this.random);

    for (let index = 0; index < shuffled.length; index += 1) {
      shuffled[index].source.shouldMutate = index < targetCount;
    }
  }

  #randomInitialLifespan() {
    return LIFE_TUNING.baseLifespanSeconds * (1 + randomRange(this.random, -LIFE_TUNING.lifespanVarianceRatio, LIFE_TUNING.lifespanVarianceRatio));
  }

  #computeFitnessScore(ant) {
    return ant.life.ageSeconds * FITNESS_TUNING.ageWeight +
      ant.season.mealsEaten * FITNESS_TUNING.mealWeight +
      ant.season.foodDelivered * FITNESS_TUNING.foodDeliveryWeight +
      ant.season.rewardContribution * FITNESS_TUNING.rewardContributionWeight;
  }

  #getLivingAnts() {
    return this.ants.filter((ant) => ant.state === "alive");
  }

  #getMovableAnts() {
    return this.ants.filter((ant) => ant.state === "alive" || ant.movement.verticalState === "falling");
  }

  #refreshDebugFocus() {
    const carryingAnt = this.ants.find((ant) => ant.state === "alive" && (ant.carryingFood || ant.food?.carrying));
    this.debugFocusAntId = carryingAnt?.id ?? null;
  }
}
