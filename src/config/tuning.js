export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const SIMULATION_TUNING = {
  antCount: 160,
  spawnRadius: 42,
  fixedTimeStep: 1 / 60,
  maxDeltaTime: 1 / 20,
  linearDamping: 0.92,
  angularDamping: 0.82,
  boundaryMargin: 48,
  boundaryTurnStrength: 1.4,
};

export const ANT_TUNING = {
  radius: 4,
  segmentSpacing: 6,
  maxSpeed: 62,
  maxTurnRate: 3.4,
  forwardDrive: 90,
  steeringNoiseIntervalMin: 0.3,
  steeringNoiseIntervalMax: 1.2,
  steeringImpulseMin: -0.85,
  steeringImpulseMax: 0.85,
  steeringSmoothing: 2.8,
};
