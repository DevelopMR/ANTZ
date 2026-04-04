import { NEURAL_TUNING } from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildInputVector(sensorState) {
  const wedges = sensorState.wedges ?? [];
  const inputs = [];

  for (let index = 0; index < 6; index += 1) {
    inputs.push(wedges[index]?.proximity ?? 0);
  }

  for (let index = 0; index < 6; index += 1) {
    inputs.push(wedges[index]?.colorScalar ?? 0);
  }

  inputs.push(sensorState.scalars?.foodScent ?? 0);
  inputs.push(sensorState.scalars?.pheromone ?? 0);

  return inputs;
}

export class BrainSystem {
  update(ants) {
    for (const ant of ants) {
      const inputs = buildInputVector(ant.sensorState);
      const outputs = ant.brain.forward(inputs);

      ant.brainState = {
        inputs,
        outputs,
        xVel: clamp(outputs[NEURAL_TUNING.xVelOutputIndex] ?? 0, -1, 1),
        yVel: clamp(outputs[NEURAL_TUNING.yVelOutputIndex] ?? 0, -1, 1),
        graspIntent: clamp(outputs[NEURAL_TUNING.graspOutputIndex] ?? 0, 0, 1),
        interaction: clamp(outputs[NEURAL_TUNING.interactionOutputIndex] ?? 0, 0, 1),
      };
    }
  }
}
