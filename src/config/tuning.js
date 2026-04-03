export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const SIMULATION_TUNING = {
  antCount: 1,
  spawnWidth: 220,
  fixedTimeStep: 1 / 30,
  maxDeltaTime: 1 / 20,
  linearDamping: 0.82,
  boundaryMargin: 48,
  groundY: WORLD_HEIGHT - 90,
  groundBandHeight: 24,
  queenPosition: {
    x: 108,
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
  maxSpeed: 46,
  forwardDrive: 60,
  steeringNoiseIntervalMin: 0.45,
  steeringNoiseIntervalMax: 1.3,
  steeringImpulseMin: -1,
  steeringImpulseMax: 1,
  postureDurationMin: 1.4,
  postureDurationMax: 3.2,
  collisionRadius: 11,
  visualStateCycle: ["standing", "walking", "reaching", "walking", "grasping"],
  animationTickRate: 12,
  animationFps: {
    standing: 2.4,
    walking: 7.5,
    reaching: 4.2,
    grasping: 2.2,
  },
};

export const SENSOR_TUNING = {
  wedgeCount: 6,
  raysPerWedge: 3,
  maxDistance: 110,
  debugAntIndex: 0,
  spatialHashCellSize: 96,
  scalarInputCount: 5,
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

export const MAP_TUNING = {
  groundColor: 0xd0ae79,
  wallColor: 0x9d7749,
  pegColor: 0x7a5632,
  foodColor: 0x4f8a3b,
  queenColor: 0x8d2a1e,
};
