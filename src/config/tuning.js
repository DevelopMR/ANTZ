export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const SIMULATION_TUNING = {
  antCount: 72,
  spawnWidth: 220,
  fixedTimeStep: 1 / 60,
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
  headRadius: 5,
  thoraxRadius: 5,
  abdomenRadius: 8,
  maxSpeed: 46,
  forwardDrive: 60,
  steeringNoiseIntervalMin: 0.45,
  steeringNoiseIntervalMax: 1.3,
  steeringImpulseMin: -1,
  steeringImpulseMax: 1,
  steeringSmoothing: 2.4,
  postureDurationMin: 1.4,
  postureDurationMax: 3.2,
  visualStateCycle: ["walking", "reaching", "walking", "grasping"],
};
