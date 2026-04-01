import { NeuralNet } from "../ai/NeuralNet.js";

function createVector(x = 0, y = 0) {
  return { x, y };
}

export class Ant {
  constructor({ id, position, rotation, movementProfile }) {
    this.id = id;
    this.position = createVector(position.x, position.y);
    this.velocity = createVector();
    this.rotation = rotation;
    this.angularVelocity = 0;

    this.state = "alive";
    this.attached = false;
    this.carryingFood = false;
    this.connectionIds = [];
    this.traits = {
      forwardBias: movementProfile.forwardBias,
      turnResponsiveness: movementProfile.turnResponsiveness,
    };
    this.brain = new NeuralNet({
      inputCount: 0,
      hiddenLayers: [],
      outputCount: 2,
    });

    // Phase 2 sensor sampling can populate this without altering movement ownership.
    this.sensorState = {
      samples: [],
    };

    this.movement = {
      desiredTurn: 0,
      steeringNoiseTimer: movementProfile.initialNoiseTimer,
      steeringTarget: movementProfile.initialSteeringTarget,
      wanderStrength: movementProfile.wanderStrength,
    };
  }
}
