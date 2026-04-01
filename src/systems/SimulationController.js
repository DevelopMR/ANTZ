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

    this.#spawnAnts();
  }

  update(deltaTime) {
    const safeDelta = Math.min(deltaTime, SIMULATION_TUNING.maxDeltaTime);
    this.accumulator += safeDelta;
    this.elapsedTime += safeDelta;

    while (this.accumulator >= SIMULATION_TUNING.fixedTimeStep) {
      this.movementSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep);
      this.accumulator -= SIMULATION_TUNING.fixedTimeStep;
    }
  }

  #spawnAnts() {
    this.ants.length = 0;

    for (let index = 0; index < SIMULATION_TUNING.antCount; index += 1) {
      const xOffset = randomRange(this.random, -24, SIMULATION_TUNING.spawnWidth);
      const bandOffset = randomRange(this.random, 0, SIMULATION_TUNING.groundBandHeight);
      const visualState = ANT_TUNING.visualStateCycle[index % ANT_TUNING.visualStateCycle.length];
      const initialDirection = this.random() > 0.35 ? 1 : -1;

      this.ants.push(new Ant({
        id: index,
        position: {
          x: this.queen.position.x + xOffset,
          y: SIMULATION_TUNING.groundY + bandOffset,
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
          groundY: SIMULATION_TUNING.groundY + bandOffset,
          postureTimer: randomRange(
            this.random,
            ANT_TUNING.postureDurationMin,
            ANT_TUNING.postureDurationMax
          ),
        },
        visualProfile: {
          state: visualState,
          facing: initialDirection,
          animationOffset: randomRange(this.random, 0, Math.PI * 2),
          legPhase: randomRange(this.random, 0, Math.PI * 2),
          wiggleStrength: randomRange(this.random, 0.75, 1.15),
        },
      }));
    }
  }
}
