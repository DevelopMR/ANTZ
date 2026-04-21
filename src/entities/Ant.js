import { NeuralNet } from "../ai/NeuralNet.js";
import { ANT_TUNING, CORPSE_TUNING, NEURAL_TUNING } from "../config/tuning.js";

function createVector(x = 0, y = 0) {
  return { x, y };
}

function createEmptyLeg(slot) {
  return {
    slot,
    active: false,
    targetType: null,
    targetId: null,
    anchorX: 0,
    anchorY: 0,
    targetOffsetX: 0,
    targetOffsetY: 0,
    preferredAngle: 0,
    restLength: 0,
    stiffnessScale: 1,
    dampingScale: 1,
    label: "",
    debugDirectionX: 0,
    debugDirectionY: -1,
    stretchRatio: 1,
  };
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
      graspDriveBias: movementProfile.graspDriveBias,
      interactDriveBias: movementProfile.interactDriveBias,
      climbCommitment: movementProfile.climbCommitment,
      carryCaution: movementProfile.carryCaution,
      graspHoldBias: movementProfile.graspHoldBias,
      stabilityBias: movementProfile.stabilityBias,
      supportPreferenceBias: movementProfile.supportPreferenceBias,
    };
    this.brain = new NeuralNet({
      inputCount: NEURAL_TUNING.inputCount,
      hiddenLayers: NEURAL_TUNING.hiddenLayers,
      outputCount: NEURAL_TUNING.outputCount,
      outputActivations: ["tanh", "tanh", "sigmoid", "sigmoid"],
      random,
    });

    this.brainState = {
      inputs: new Array(NEURAL_TUNING.inputCount).fill(0),
      outputs: new Array(NEURAL_TUNING.outputCount).fill(0),
      xVel: 0,
      yVel: 0,
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
      supportType: "ground",
      supportId: null,
      verticalState: "grounded",
      localSupportOffsetX: 0,
      fallStartY: movementProfile.groundY,
      fallMode: null,
      fallCounted: false,
      collapseScatterNextY: null,
      bounceCount: 0,
    };

    this.attachment = {
      groupId: null,
      thrillBoost: 0,
      pollCooldown: 0,
      legs: Array.from({ length: ANT_TUNING.graspLegSlotCount }, (_, slot) => createEmptyLeg(slot)),
    };

    this.food = {
      carrying: false,
      carriedAmount: 0,
      sourceNodeId: null,
      carriedPayload: null,
      rewardPathPreview: null,
      mealsEaten: 0,
      deliveryCount: 0,
      returnMode: "none",
      deliveryTargetX: 0,
      deliveryTargetY: 0,
      saluteTimer: 0,
      lastDeliveredAmount: 0,
      lastDroppedAmount: 0,
    };

    this.life = {
      ageSeconds: 0,
      lifespanRemaining: movementProfile.lifespanSeconds,
      baseLifespanSeconds: movementProfile.lifespanSeconds,
      fallCount: 0,
      deadAtSeasonTime: null,
    };

    this.corpse = {
      state: "none",
      stateElapsedSeconds: 0,
      deadDurationSeconds: CORPSE_TUNING.deadDurationSeconds,
      decayDurationSeconds: CORPSE_TUNING.decayDurationSeconds,
      availableFoodUnits: CORPSE_TUNING.harvestFoodUnits,
      harvestedFoodUnits: 0,
      harvestedAtSeasonTime: null,
      removePending: false,
      genomeInfluenceCap: CORPSE_TUNING.genomeInfluenceCap,
      deadContributorWeightMultiplier: CORPSE_TUNING.deadContributorWeightMultiplier,
      decayingContributorWeightMultiplier: CORPSE_TUNING.decayingContributorWeightMultiplier,
      scentBaseIntensity: CORPSE_TUNING.scentBaseIntensity,
      scentCurveExponent: CORPSE_TUNING.scentCurveExponent,
      scentIntensity: 0,
    };

    this.season = {
      mealsEaten: 0,
      foodDelivered: 0,
      rewardContribution: 0,
      fitnessScore: 0,
    };

    this.physics = {
      anchorPriority: null,
      lastBreakReason: null,
      lastImpactId: null,
      impactCooldown: 0,
    };

    this.visual = {
      animationOffset: visualProfile.animationOffset,
      frameSeed: visualProfile.frameSeed,
    };
  }
}
