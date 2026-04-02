import { NeuralNet } from "../ai/NeuralNet.js";
import { SENSOR_TUNING } from "../config/tuning.js";

function createVector(x = 0, y = 0) {
  return { x, y };
}

export class Ant {
  constructor({ id, position, movementProfile, visualProfile }) {
    this.id = id;
    this.position = createVector(position.x, position.y);
    this.velocity = createVector();
    this.facing = visualProfile.facing;
    this.state = "alive";
    this.visualState = visualProfile.state;
    this.attached = false;
    this.carryingFood = false;
    this.connectionIds = [];
    this.traits = {
      forwardBias: movementProfile.forwardBias,
      turnResponsiveness: movementProfile.turnResponsiveness,
    };
    this.brain = new NeuralNet({
      inputCount: SENSOR_TUNING.wedgeCount * 5 + 3,
      hiddenLayers: [],
      outputCount: 2,
    });

    this.sensorState = {
      wedges: [],
      rays: [],
      scalars: {
        speed: 0,
        attached: 0,
        connectionCount: 0,
      },
    };

    this.movement = {
      desiredDirection: movementProfile.initialDirection,
      steeringNoiseTimer: movementProfile.initialNoiseTimer,
      steeringTarget: movementProfile.initialSteeringTarget,
      wanderStrength: movementProfile.wanderStrength,
      groundY: movementProfile.groundY,
      postureTimer: movementProfile.postureTimer,
    };

    this.visual = {
      animationOffset: visualProfile.animationOffset,
      frameSeed: visualProfile.frameSeed,
    };
  }
}
