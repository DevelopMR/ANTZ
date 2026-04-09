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
import { ANT_TUNING, CONNECTION_TREE_TUNING, FOOD_TUNING, NEURAL_TUNING, SIMULATION_TUNING } from "../config/tuning.js";
import { MovementSystem } from "./MovementSystem.js";

function randomRange(random, min, max) {
  return min + (max - min) * random();
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
    this.accumulator = 0;
    this.elapsedTime = 0;
    this.ants = [];
    this.nextAntId = 0;
    this.debugFocusAntId = null;
    this.queen = new Queen(SIMULATION_TUNING.queenPosition);
    this.goal = {
      position: { ...SIMULATION_TUNING.exitPosition },
    };

    this.#spawnInitialAnts();
    this.foodScentSystem.update(this.mapSystem, SIMULATION_TUNING.fixedTimeStep);
    this.sensorSystem.update(this.ants, this.mapSystem, this.queen, this.foodScentSystem);
    this.brainSystem.update(this.ants);
  }

  update(deltaTime) {
    const safeDelta = Math.min(deltaTime, SIMULATION_TUNING.maxDeltaTime);
    this.accumulator += safeDelta;
    this.elapsedTime += safeDelta;

    while (this.accumulator >= SIMULATION_TUNING.fixedTimeStep) {
      this.foodScentSystem.update(this.mapSystem, SIMULATION_TUNING.fixedTimeStep);
      this.sensorSystem.update(this.ants, this.mapSystem, this.queen, this.foodScentSystem);
      this.brainSystem.update(this.ants);
      this.movementSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.attachmentSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.physicsSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.foodSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem, this.queen, this);
      this.#processQueenSpawnQueue(SIMULATION_TUNING.fixedTimeStep);
      const carryingAnt = this.ants.find((ant) => ant.carryingFood || ant.food?.carrying);
      this.debugFocusAntId = carryingAnt?.id ?? null;
      this.accumulator -= SIMULATION_TUNING.fixedTimeStep;
    }
  }

  spawnAntBatch({ count, origin, genomeSource = null, genomePicker = null }) {
    for (let index = 0; index < count; index += 1) {
      const resolvedGenomeSource = genomePicker ? genomePicker(index) : genomeSource;
      const ant = this.#createAnt({
        x: origin.x - randomRange(this.random, FOOD_TUNING.spawnOffsetLeftMin, FOOD_TUNING.spawnOffsetLeftMax),
        y: SIMULATION_TUNING.groundY,
      }, resolvedGenomeSource);
      this.ants.push(ant);
    }
  }

  setFoodScentOverlayEnabled(enabled) {
    this.foodScentSystem.setOverlayEnabled(enabled);
  }

  #processQueenSpawnQueue(deltaTime) {
    this.queen.spawnCooldown = Math.max(0, this.queen.spawnCooldown - deltaTime);

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
      this.spawnAntBatch({
        count: 1,
        origin: this.queen.position,
        genomeSource,
      });
      this.queen.spawnedAntCount += 1;
      this.queen.spawnCooldown = FOOD_TUNING.spawnQueueInterval;
      queuedSpawn.nextSpawnIndex += 1;
      this.queen.pendingSpawnCount = Math.max(0, this.queen.pendingSpawnCount - 1);
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

  #spawnInitialAnts() {
    this.ants.length = 0;
    this.nextAntId = 0;

    for (let index = 0; index < SIMULATION_TUNING.antCount; index += 1) {
      const xOffset = randomRange(this.random, -24, SIMULATION_TUNING.spawnWidth);

      this.ants.push(this.#createAnt({
        x: this.queen.position.x + xOffset,
        y: SIMULATION_TUNING.groundY,
      }));
    }
  }

  #createAnt(position, genomeSource = null) {
    const initialDirection = this.random() > 0.35 ? 1 : -1;
    const visualState = ANT_TUNING.visualStateCycle[this.nextAntId % ANT_TUNING.visualStateCycle.length];
    const parentGenome = this.#resolveParentGenome(genomeSource);
    const movementProfile = {
      forwardBias: parentGenome?.traits
        ? this.#mutateTrait(parentGenome.traits.forwardBias)
        : randomRange(this.random, 0.92, 1.08),
      turnResponsiveness: parentGenome?.traits
        ? this.#mutateTrait(parentGenome.traits.turnResponsiveness)
        : randomRange(this.random, 0.85, 1.15),
      initialDirection,
      groundY: position.y,
      postureTimer: randomRange(
        this.random,
        ANT_TUNING.postureDurationMin,
        ANT_TUNING.postureDurationMax
      ),
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
      ant.brain = new NeuralNet({
        inputCount: NEURAL_TUNING.inputCount,
        hiddenLayers: NEURAL_TUNING.hiddenLayers,
        outputCount: NEURAL_TUNING.outputCount,
        outputActivations: ["tanh", "tanh", "sigmoid", "sigmoid"],
        layers: parentGenome.brainLayers,
      }).mutate({
        rate: CONNECTION_TREE_TUNING.brainMutationRate,
        magnitude: CONNECTION_TREE_TUNING.brainMutationMagnitude,
        random: this.random,
      });
    }

    ant.lineageSource = genomeSource;
    this.nextAntId += 1;
    return ant;
  }

  #resolveParentGenome(genomeSource) {
    if (!genomeSource) {
      return null;
    }

    if (genomeSource.genomeSnapshot) {
      return genomeSource.genomeSnapshot;
    }

    if (genomeSource.antId == null) {
      return null;
    }

    const parentAnt = this.ants.find((ant) => ant.id === genomeSource.antId) ?? null;
    if (!parentAnt) {
      return null;
    }

    return {
      brainLayers: parentAnt.brain.clone().layers,
      traits: {
        forwardBias: parentAnt.traits.forwardBias,
        turnResponsiveness: parentAnt.traits.turnResponsiveness,
      },
    };
  }

  #mutateTrait(value) {
    return value + randomRange(this.random, -CONNECTION_TREE_TUNING.traitMutationRange, CONNECTION_TREE_TUNING.traitMutationRange);
  }
}
