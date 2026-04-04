import { NeuralNet } from "../ai/NeuralNet.js";
import { NEURAL_TUNING } from "../config/tuning.js";

function createVector(x = 0, y = 0) {
  return { x, y };
}

export class Ant {
  constructor({ id, position, movementProfile, visualProfile, random = Math.random }) {
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
      inputCount: NEURAL_TUNING.inputCount,
      hiddenLayers: NEURAL_TUNING.hiddenLayers,
      outputCount: NEURAL_TUNING.outputCount,
      outputActivations: ["tanh", "sigmoid", "sigmoid", "sigmoid"],
      random,
    });

    this.brainState = {
      inputs: new Array(NEURAL_TUNING.inputCount).fill(0),
      outputs: new Array(NEURAL_TUNING.outputCount).fill(0),
      turn: 0,
      forward: 0,
      graspIntent: 0,
      interaction: 0,
    };

    this.sensorState = {
      wedges: [],
      rays: [],
      debug: {
        origin: null,
        visibleObjects: [],
      },
      scalars: {
        foodScent: 0,
        pheromone: 0,
      },
    };

    this.movement = {
      desiredDirection: movementProfile.initialDirection,
      groundY: movementProfile.groundY,
      postureTimer: movementProfile.postureTimer,
    };

    this.visual = {
      animationOffset: visualProfile.animationOffset,
      frameSeed: visualProfile.frameSeed,
    };
  }
}
