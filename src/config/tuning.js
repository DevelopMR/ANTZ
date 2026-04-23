export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const SIMULATION_TUNING = {
  antCount: 20,
  spawnWidth: 220,
  fixedTimeStep: 1 / 30,
  maxDeltaTime: 1 / 20,
  linearDamping: 0.82,
  boundaryMargin: 48,
  groundY: WORLD_HEIGHT - 90,
  groundBandHeight: 24,
  queenPosition: {
    x: 54,
    y: WORLD_HEIGHT - 106,
  },
  exitPosition: {
    x: WORLD_WIDTH - 122,
    y: 114,
  },
};

export const ANT_TUNING = {
  spriteWidth: 56,
  spriteHeight: 56,
  maxSpeed: 82,
  forwardDrive: 86.4,
  postureDurationMin: 1.4,
  postureDurationMax: 3.2,
  collisionRadius: 11,
  supportHeight: 26,
  supportHalfWidth: 12,
  supportTopFlatHalfWidth: 8,
  supportEdgeRollZone: 4,
  wallSupportPadding: 4,
  climbSpeed: 58,
  climbIntentThreshold: 0.14,
  supportSnapDistance: 3,
  climbHorizontalRange: 26,
  collapseScatterStepX: 18,
  collapseScatterStepY: 14,
  gravity: 320,
  maxFallSpeed: 220,
  maxSafeFallDistance: WORLD_HEIGHT * 0.5,
  maxFallsBeforeDeath: 10,
  maxConnections: 4,
  graspVerticalTolerance: 2.6,
  graspHorizontalTolerance: 5.6,
  graspCoverageRatio: 2 / 3,
  graspPollMinNeighbors: 1,
  graspPollMaxNeighbors: 5,
  graspNeighborRadiusX: 34,
  graspNeighborRadiusY: 24,
  graspHardRejectThreshold: 0.12,
  graspSuccessThresholdPerAnt: 0.46,
  graspHoldThreshold: 0.31,
  graspThrillBoostMin: 0.08,
  graspThrillBoostMax: 0.22,
  graspThrillDecayPerSecond: 0.08,
  graspPollCooldownMin: 0.4,
  graspPollCooldownMax: 1.15,
  graspLegSlotCount: 4,
  wallAnchorReachX: 18,
  wallAnchorReachY: 34,
  groundAnchorOffsetX: 10,
  wallAnchorOffsetY: 10,
  extraAnchorSpreadX: 8,
  maxBounceCount: 5,
  tumbleBounceSpeedX: 72,
  tumbleBounceSpeedY: 138,
  visualStateCycle: ["standing", "walking", "reaching", "walking", "grasping"],
  animationTickRate: 12,
  animationFps: {
    standing: 2.4,
    walking: 7.5,
    reaching: 4.2,
    grasping: 2.2,
    dead: 1,
    decaying: 1,
  },
};

export const PHYSICS_TUNING = {
  attachedGravityScale: 0.6,
  attachedLinearDamping: 0.93,
  solverIterations: 5,
  legRestLength: 18,
  legRestLengthVariance: 4,
  legStiffness: 0.36,
  legDamping: 0.18,
  legAngularBias: 0.24,
  legAnchorPull: 0.48,
  legBreakStretchRatio: 1.8,
  legBreakDistanceBuffer: 10,
  positionCorrectionFactor: 0.42,
  impactBounceFactor: 0.52,
  impactTransferFactor: 0.24,
  impactHorizontalJitter: 34,
  supportRideFollow: 0.72,
  supportRideVerticalSnap: 0.42,
  microVelocityClamp: 140,
};

export const FOOD_TUNING = {
  interactionThreshold: 0.4,
  pickupInset: 2,
  mealUnitAmount: 1,
  carryUnitAmount: 1,
  corpseSpawnNutritionValue: 0.5,
  carrySpeedScale: 0.75,
  normalFoodRewardMultiplier: 1.75,
  randomSpawnChance: 0.08,
  queenDeliveryOffsetX: 0,
  queenDeliveryRadius: 18,
  saluteDuration: 0.5,
  spawnOnFeedMin: 0,
  spawnOnFeedMax: 2,
  queenMealInterval: 8,
  spawnQueueInterval: 2,
  spawnOffsetRightMin: 100,
  spawnOffsetRightMax: 200,
  droppedFoodGroundOffsetY: 18,
  droppedFoodRadius: 8,
  smallNodeTrips: 3,
  largeNodeTrips: 5,
  smallNodeRadius: 10,
  largeNodeRadius: 14,
  minimumFoodRadiusRatio: 0.42,
};


export const LIFE_TUNING = {
  baseLifespanSeconds: 45,
  lifespanVarianceRatio: 0.4,
  mealRestoreSeconds: 20,
};

export const CORPSE_TUNING = {
  deadDurationSeconds: 5,
  decayDurationSeconds: 10,
  harvestFoodUnits: 1,
  pickupRadius: 14,
  genomeInfluenceCap: 0.2,
  deadContributorWeightMultiplier: 0.4,
  decayingContributorWeightMultiplier: 0.2,
  scentBaseIntensity: 1,
  scentCurveExponent: 2,
};

export const FITNESS_TUNING = {
  ageWeight: 1,
  mealWeight: 40,
  foodDeliveryWeight: 30,
  rewardContributionWeight: 100,
  connectionTreeBaseReward: .25,
  connectionTreeClimberMultiplier: 2.1,
};

export const SEASON_TUNING = {
  randomShare: 0.3,
  fitnessCloneShare: 0.25,
  connectionTreeShare: 0.45,
};

export const MUTATION_TUNING = {
  fitnessCloneMutationShare: 0.5,
  seasonPackMutationShare: 0.5,
};

export const TRAIT_TUNING = {
  initialMin: 0.96,
  initialMax: 1.04,
  mutationRange: 0.035,
  min: 0.7,
  max: 1.3,
  names: [
    "forwardBias",
    "graspDriveBias",
    "interactDriveBias",
    "climbCommitment",
    "carryCaution",
    "graspHoldBias",
    "stabilityBias",
    "supportPreferenceBias",
  ],
};
export const FOOD_SCENT_TUNING = {
  gridCellSize: 24,
  decayPerSecond: 0.25,
  diffusionRate: 0.18,
  emissionStrength: 1.2,
  emissionRadius: 122,
  coreRadiusRatio: 0.5,
  coreEdgeIntensity: 0.9,
  sampleClamp: 1,
  overlayMinAlpha: 0.04,
  overlayMaxAlpha: 0.3,
  overlayThreshold: 0.03,
  overlayColor: 0x6ba84a,
  windBaseDirectionRadians: Math.PI,
  windBaseSpeed: 0.7,
  windVarianceRatio: 0.15,
  windDirectionVarianceRadians: 0.22,
  windOscillationSeconds: 8,
};

export const SENSOR_TUNING = {
  wedgeCount: 6,
  raysPerWedge: 3,
  maxDistance: 110,
  debugAntIndex: 0,
  debugFallbackHoldSeconds: 4.3,
  spatialHashCellSize: 96,
  scalarInputCount: 2,
  wedgeCenters: [
    (5 * Math.PI) / 3,
    0,
    Math.PI / 3,
    (2 * Math.PI) / 3,
    Math.PI,
    (4 * Math.PI) / 3,
  ],
  wedgeNames: ["one", "three", "five", "seven", "nine", "eleven"],
  borderRayTallyWeight: 1,
  centerRayTallyWeight: 4,
  colorRange: {
    food: 1,
    queen: 0.45,
    ant: -0.1,
    obstacle: -0.65,
  },
  localFoodScentRange: 220,
  antSenseRadius: 10,
  queenSenseRadius: 20,
  localAntQueryPadding: 16,
};

export const NEURAL_TUNING = {
  inputCount: SENSOR_TUNING.wedgeCount * 2 + SENSOR_TUNING.scalarInputCount,
  hiddenLayers: [12],
  outputCount: 4,
  xVelOutputIndex: 0,
  yVelOutputIndex: 1,
  graspOutputIndex: 2,
  interactionOutputIndex: 3,
};


export const CONNECTION_TREE_TUNING = {
  maxSupportDepth: 4,
  obtainerWeight: 1,
  supportDepthWeights: [0.45, 0.2, 0.08, 0.03],
  brainMutationRate: 0.06,
  brainMutationMagnitude: 0.12,
  traitMutationRange: 0.06,
};
export const MAP_TUNING = {
  groundColor: 0xd0ae79,
  wallColor: 0x9d7749,
  pegColor: 0x7a5632,
  foodColor: 0x4f8a3b,
  queenColor: 0x8d2a1e,
};
