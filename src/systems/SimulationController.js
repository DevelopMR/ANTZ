import { Ant } from "../entities/Ant.js";
import { Queen } from "../entities/Queen.js";
import { ANT_TUNING, SIMULATION_TUNING, WORLD_HEIGHT, WORLD_WIDTH } from "../config/tuning.js";
import { MovementSystem } from "./MovementSystem.js";

function randomRange(random, min, max) {
  return min + (max - min) * random();
}

export class SimulationController {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.movementSystem = new MovementSystem(random);
    this.accumulator = 0;
    this.ants = [];
    this.queen = new Queen({
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
    });

    this.#spawnAnts();
  }

  update(deltaTime) {
    const safeDelta = Math.min(deltaTime, SIMULATION_TUNING.maxDeltaTime);
    this.accumulator += safeDelta;

    while (this.accumulator >= SIMULATION_TUNING.fixedTimeStep) {
      this.movementSystem.update(this.ants, SIMULATION_TUNING.fixedTimeStep);
      this.accumulator -= SIMULATION_TUNING.fixedTimeStep;
    }
  }

  #spawnAnts() {
    this.ants.length = 0;

    for (let index = 0; index < SIMULATION_TUNING.antCount; index += 1) {
      const angle = randomRange(this.random, 0, Math.PI * 2);
      const distance = Math.sqrt(this.random()) * SIMULATION_TUNING.spawnRadius;

      this.ants.push(new Ant({
        id: index,
        position: {
          x: this.queen.position.x + Math.cos(angle) * distance,
          y: this.queen.position.y + Math.sin(angle) * distance,
        },
        rotation: randomRange(this.random, 0, Math.PI * 2),
        movementProfile: {
          forwardBias: randomRange(this.random, 0.9, 1.08),
          turnResponsiveness: randomRange(this.random, 0.85, 1.15),
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
          wanderStrength: randomRange(this.random, 0.55, 1),
        },
      }));
    }
  }
}
