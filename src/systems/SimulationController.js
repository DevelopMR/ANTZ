import { MapSystem } from "./MapSystem.js";
import { SensorSystem } from "./SensorSystem.js";
import { BrainSystem } from "./BrainSystem.js";
import { AttachmentSystem } from "./AttachmentSystem.js";
import { PhysicsSystem } from "./PhysicsSystem.js";
import { FoodSystem } from "./FoodSystem.js";
import { Ant } from "../entities/Ant.js";
import { Queen } from "../entities/Queen.js";
import { ANT_TUNING, FOOD_TUNING, SIMULATION_TUNING } from "../config/tuning.js";
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
    this.accumulator = 0;
    this.elapsedTime = 0;
    this.ants = [];
    this.nextAntId = 0;
    this.queen = new Queen(SIMULATION_TUNING.queenPosition);
    this.goal = {
      position: { ...SIMULATION_TUNING.exitPosition },
    };

    this.#spawnInitialAnts();
    this.sensorSystem.update(this.ants, this.mapSystem, this.queen);
    this.brainSystem.update(this.ants);
  }

  update(deltaTime) {
    const safeDelta = Math.min(deltaTime, SIMULATION_TUNING.maxDeltaTime);
    this.accumulator += safeDelta;
    this.elapsedTime += safeDelta;

    while (this.accumulator >= SIMULATION_TUNING.fixedTimeStep) {
      this.sensorSystem.update(this.ants, this.mapSystem, this.queen);
      this.brainSystem.update(this.ants);
      this.movementSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.attachmentSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.physicsSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem);
      this.foodSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep, this.mapSystem, this.queen, this);
      this.accumulator -= SIMULATION_TUNING.fixedTimeStep;
    }
  }

  spawnAntBatch({ count, origin, genomeSource = null }) {
    for (let index = 0; index < count; index += 1) {
      const ant = this.#createAnt({
        x: origin.x - randomRange(this.random, FOOD_TUNING.spawnOffsetLeftMin, FOOD_TUNING.spawnOffsetLeftMax),
        y: SIMULATION_TUNING.groundY + randomRange(this.random, 0, SIMULATION_TUNING.groundBandHeight * 0.35),
      }, genomeSource);
      this.ants.push(ant);
    }
  }

  #spawnInitialAnts() {
    this.ants.length = 0;
    this.nextAntId = 0;

    for (let index = 0; index < SIMULATION_TUNING.antCount; index += 1) {
      const row = index % 2;
      const xOffset = randomRange(this.random, -24, SIMULATION_TUNING.spawnWidth);
      const groundOffset = row * 10 + randomRange(this.random, 0, SIMULATION_TUNING.groundBandHeight * 0.35);

      this.ants.push(this.#createAnt({
        x: this.queen.position.x + xOffset,
        y: SIMULATION_TUNING.groundY + groundOffset,
      }));
    }
  }

  #createAnt(position, genomeSource = null) {
    const initialDirection = this.random() > 0.35 ? 1 : -1;
    const visualState = ANT_TUNING.visualStateCycle[this.nextAntId % ANT_TUNING.visualStateCycle.length];
    const ant = new Ant({
      id: this.nextAntId,
      position,
      movementProfile: {
        forwardBias: randomRange(this.random, 0.92, 1.08),
        turnResponsiveness: randomRange(this.random, 0.85, 1.15),
        initialDirection,
        groundY: position.y,
        postureTimer: randomRange(
          this.random,
          ANT_TUNING.postureDurationMin,
          ANT_TUNING.postureDurationMax
        ),
      },
      visualProfile: {
        state: visualState,
        facing: initialDirection,
        animationOffset: randomRange(this.random, 0, 1),
        frameSeed: randomRange(this.random, 0, 10),
      },
      random: this.random,
    });

    ant.lineageSource = genomeSource;
    this.nextAntId += 1;
    return ant;
  }
}

