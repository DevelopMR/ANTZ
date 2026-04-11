import assert from 'node:assert/strict';
import { SimulationController } from '../src/systems/SimulationController.js';
import { TRAIT_TUNING } from '../src/config/tuning.js';

function createSequenceRandom(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

function makeGenomeSnapshot(ant, traits) {
  return {
    brainLayers: ant.brain.clone().layers,
    traits: { ...traits },
  };
}

function assertTraitsEqual(actual, expected, label) {
  for (const name of TRAIT_TUNING.names) {
    assert.equal(actual[name], expected[name], `${label}: expected exact ${name}`);
  }
}

function assertTraitsMutated(actual, expected, label) {
  let changedCount = 0;

  for (const name of TRAIT_TUNING.names) {
    const delta = Math.abs(actual[name] - expected[name]);
    assert.ok(actual[name] >= TRAIT_TUNING.min && actual[name] <= TRAIT_TUNING.max, `${label}: ${name} out of bounds`);
    assert.ok(delta <= TRAIT_TUNING.mutationRange + 1e-9, `${label}: ${name} exceeded mutation range`);
    if (delta > 1e-9) {
      changedCount += 1;
    }
  }

  assert.ok(changedCount > 0, `${label}: expected at least one trait to change`);
}

const random = createSequenceRandom([0.73, 0.18, 0.91, 0.34, 0.82, 0.27, 0.66, 0.12]);
const controller = new SimulationController({ random });
const templateAnt = controller.ants[0];
const baseTraits = {
  forwardBias: 1.02,
  graspDriveBias: 0.97,
  interactDriveBias: 1.03,
  climbCommitment: 0.99,
  carryCaution: 1.01,
  graspHoldBias: 0.98,
  stabilityBias: 1.04,
  supportPreferenceBias: 0.96,
};
const genomeSnapshot = makeGenomeSnapshot(templateAnt, baseTraits);
const origin = { x: 200, y: templateAnt.movement.groundY };

const [fitnessExact] = controller.spawnAntBatch({
  count: 1,
  origin,
  genomeSource: {
    sourceType: 'fitness-clone',
    antId: 900,
    genomeSnapshot,
    shouldMutate: false,
  },
});

const [fitnessMutated] = controller.spawnAntBatch({
  count: 1,
  origin,
  genomeSource: {
    sourceType: 'fitness-clone',
    antId: 901,
    genomeSnapshot,
    shouldMutate: true,
  },
});

const [seasonExact] = controller.spawnAntBatch({
  count: 1,
  origin,
  genomeSource: {
    sourceType: 'season-pack',
    antId: 902,
    packIndex: 0,
    genomeSnapshot,
    shouldMutate: false,
  },
});

const [seasonMutated] = controller.spawnAntBatch({
  count: 1,
  origin,
  genomeSource: {
    sourceType: 'season-pack',
    antId: 903,
    packIndex: 1,
    genomeSnapshot,
    shouldMutate: true,
  },
});

assertTraitsEqual(fitnessExact.traits, baseTraits, 'fitness exact');
assertTraitsEqual(seasonExact.traits, baseTraits, 'season exact');
assertTraitsMutated(fitnessMutated.traits, baseTraits, 'fitness mutated');
assertTraitsMutated(seasonMutated.traits, baseTraits, 'season mutated');
assert.equal(fitnessMutated.lineageSource?.shouldMutate, true, 'fitness mutated lineage flag');
assert.equal(seasonMutated.lineageSource?.shouldMutate, true, 'season mutated lineage flag');
assert.equal(fitnessExact.lineageSource?.sourceType, 'fitness-clone', 'fitness source type');
assert.equal(seasonExact.lineageSource?.sourceType, 'season-pack', 'season source type');

for (const ant of controller.ants.slice(0, 5)) {
  for (const name of TRAIT_TUNING.names) {
    assert.ok(name in ant.traits, `initial ant missing trait ${name}`);
  }
}

console.log('Phase 10 trait inheritance checks passed.');
console.log({
  fitnessMutated: fitnessMutated.traits,
  seasonMutated: seasonMutated.traits,
});
