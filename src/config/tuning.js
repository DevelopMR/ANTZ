export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const SIMULATION_TUNING = {
  antCount: 40,
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
  visualStateCycle: ["standing", "walking", "reaching", "walking", "grasping"],
  animationTickRate: 12,
  animationFps: {
    standing: 2.4,
    walking: 7.5,
    reaching: 4.2,
    grasping: 2.2,
  },
};
