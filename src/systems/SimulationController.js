import { Ant } from "../entities/Ant.js";
import { Queen } from "../entities/Queen.js";
import { ANT_TUNING, SIMULATION_TUNING } from "../config/tuning.js";
import { MovementSystem } from "./MovementSystem.js";

function randomRange(random, min, max) {
  return min + (max - min) * random();
}

export class SimulationController {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.movementSystem = new MovementSystem(random);
    this.accumulator = 0;
    this.elapsedTime = 0;
    this.ants = [];
    this.queen = new Queen(SIMULATION_TUNING.queenPosition);
    this.goal = {
      position: { ...SIMULATION_TUNING.exitPosition },
    };
    this.runtimeSettings = null;

    this.respawn({ spreadMode: "grounded" });
  }

  update(deltaTime, runtimeSettings) {
    const safeDelta = Math.min(deltaTime, SIMULATION_TUNING.maxDeltaTime);
    this.accumulator += safeDelta;
    this.elapsedTime += safeDelta;
    this.runtimeSettings = runtimeSettings;

    const stepHz = runtimeSettings?.simulationHz === 30 ? 30 : 60;
    const fixedStep = 1 / stepHz;

    while (this.accumulator >= fixedStep) {
      this.movementSystem.update(this.ants, fixedStep, runtimeSettings);
      this.accumulator -= fixedStep;
    }
  }

  step(runtimeSettings) {
    const stepHz = runtimeSettings?.simulationHz === 30 ? 30 : 60;
    const fixedStep = 1 / stepHz;
    this.update(fixedStep, runtimeSettings);
  }

  respawn(runtimeSettings = this.runtimeSettings || { spreadMode: "grounded" }) {
    this.runtimeSettings = runtimeSettings;
    this.accumulator = 0;
    this.ants.length = 0;

    const spreadMode = runtimeSettings.spreadMode || "grounded";
    const spawnRows = spreadMode === "spread" ? 4 : 2;
    const spawnWidth = spreadMode === "spread" ? SIMULATION_TUNING.spawnWidth * 3.4 : SIMULATION_TUNING.spawnWidth;
    const rowSpacing = spreadMode === "spread" ? 18 : 10;

    for (let index = 0; index < SIMULATION_TUNING.antCount; index += 1) {
      const row = index % spawnRows;
      const laneOffset = spreadMode === "spread"
        ? ((index / spawnRows) % 2) * 8
        : 0;
      const xOffset = randomRange(this.random, -24, spawnWidth) + laneOffset;
      const groundOffset = row * rowSpacing + randomRange(this.random, 0, SIMULATION_TUNING.groundBandHeight * 0.35);
      const visualState = ANT_TUNING.visualStateCycle[index % ANT_TUNING.visualStateCycle.length];
      const initialDirection = this.random() > 0.35 ? 1 : -1;

      this.ants.push(new Ant({
        id: index,
        position: {
          x: this.queen.position.x + xOffset,
          y: SIMULATION_TUNING.groundY + groundOffset,
        },
        movementProfile: {
          forwardBias: randomRange(this.random, 0.92, 1.08),
          turnResponsiveness: randomRange(this.random, 0.85, 1.15),
          initialDirection,
          initialNoiseTimer: randomRange(
            this.random,
            ANT_TUNING.steeringNoiseIntervalMin,
            ANT_TUNING.steeringNoiseIntervalMax
          ),
          initialSteeringTarget: randomRange(
            this.random,
            ANT_TUNING.steeringImpulseMin,
            ANT_TUNING.steeringImpulseMax
          ),
          wanderStrength: randomRange(this.random, 0.45, 1),
          groundY: SIMULATION_TUNING.groundY + groundOffset,
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
      }));
    }
  }
}
