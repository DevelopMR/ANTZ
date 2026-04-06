import { Ant } from "../src/entities/Ant.js";
import { ANT_TUNING, SIMULATION_TUNING } from "../src/config/tuning.js";
import { AttachmentSystem } from "../src/systems/AttachmentSystem.js";
import { MapSystem } from "../src/systems/MapSystem.js";
import { MovementSystem } from "../src/systems/MovementSystem.js";
import { PhysicsSystem } from "../src/systems/PhysicsSystem.js";

function createDeterministicRandom() {
  let seed = 123456789;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function createAnt({ id, x, y, supportType = "ground", supportId = null, verticalState = "grounded", groundY = SIMULATION_TUNING.groundY, random }) {
  const ant = new Ant({
    id,
    position: { x, y },
    movementProfile: {
      forwardBias: 1,
      turnResponsiveness: 1,
      initialDirection: 1,
      groundY,
      postureTimer: 999,
    },
    visualProfile: {
      state: "walking",
      facing: 1,
      animationOffset: 0,
      frameSeed: 0,
    },
    random,
  });

  ant.movement.supportType = supportType;
  ant.movement.supportId = supportId;
  ant.movement.verticalState = verticalState;
  ant.movement.groundY = groundY;
  ant.brainState.xVel = 0;
  ant.brainState.yVel = 0;
  ant.brainState.graspIntent = 1;
  ant.brainState.interaction = 0;
  return ant;
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function activeLegs(ant) {
  return ant.attachment.legs.filter((leg) => leg.active);
}

function createHarness() {
  const random = createDeterministicRandom();
  return {
    random,
    mapSystem: new MapSystem(),
    movementSystem: new MovementSystem(random),
    attachmentSystem: new AttachmentSystem(random),
    physicsSystem: new PhysicsSystem(random),
  };
}

function runTicks(harness, ants, steps, deltaTime = SIMULATION_TUNING.fixedTimeStep) {
  for (let index = 0; index < steps; index += 1) {
    harness.movementSystem.update(ants, deltaTime, harness.mapSystem);
    harness.attachmentSystem.update(ants, deltaTime, harness.mapSystem);
    harness.physicsSystem.update(ants, deltaTime, harness.mapSystem);
  }
}

function buildCornerCluster() {
  const harness = createHarness();
  const wall = harness.mapSystem.getWallById("wall-0");
  const baseX = wall.x + 4;
  const baseY = SIMULATION_TUNING.groundY;

  const support = createAnt({
    id: 0,
    x: baseX,
    y: baseY,
    supportType: "ground",
    verticalState: "grounded",
    random: harness.random,
  });
  const perched = createAnt({
    id: 1,
    x: baseX,
    y: baseY - ANT_TUNING.supportHeight,
    supportType: "ant",
    supportId: support.id,
    verticalState: "perched",
    random: harness.random,
  });
  const neighbor = createAnt({
    id: 2,
    x: baseX + 8,
    y: baseY - 4,
    supportType: "ground",
    verticalState: "grounded",
    random: harness.random,
  });

  const ants = [support, perched, neighbor];
  harness.attachmentSystem.update(ants, SIMULATION_TUNING.fixedTimeStep, harness.mapSystem);
  return { harness, ants, wall };
}

function testCornerPriority() {
  const { ants } = buildCornerCluster();
  for (const ant of ants) {
    const firstLeg = activeLegs(ant)[0];
    ensure(firstLeg, `ant ${ant.id} failed to form any grasp legs in corner test`);
    ensure(firstLeg.targetType === "wall", `ant ${ant.id} should prefer wall first in corner, got ${firstLeg.targetType}`);
  }
  return "wall priority first leg confirmed";
}

function testSimpleBridge() {
  const { harness, ants } = buildCornerCluster();
  const extraLeft = createAnt({
    id: 3,
    x: ants[0].position.x - 14,
    y: SIMULATION_TUNING.groundY - 2,
    supportType: "ground",
    verticalState: "grounded",
    random: harness.random,
  });
  const extraRight = createAnt({
    id: 4,
    x: ants[2].position.x + 14,
    y: SIMULATION_TUNING.groundY - 2,
    supportType: "ground",
    verticalState: "grounded",
    random: harness.random,
  });
  ants.push(extraLeft, extraRight);
  harness.attachmentSystem.update(ants, SIMULATION_TUNING.fixedTimeStep, harness.mapSystem);
  runTicks(harness, ants, 120);

  ensure(ants.filter((ant) => ant.attached).length >= 3, "simple bridge test lost too many attached ants");
  ensure(ants.every((ant) => ant.position.y <= ant.movement.groundY + 0.001), "simple bridge test let an ant tunnel below ground");
  ensure(ants.every((ant) => activeLegs(ant).length <= ANT_TUNING.graspLegSlotCount), "simple bridge exceeded leg slot count");
  return "ground bridge stayed attached and above ground";
}

function testWallSheet() {
  const harness = createHarness();
  const wall = harness.mapSystem.getWallById("wall-1");
  const baseX = wall.x + wall.width * 0.5;
  const baseY = wall.y - ANT_TUNING.supportHeight;

  const support = createAnt({
    id: 10,
    x: baseX,
    y: baseY,
    supportType: "wall",
    supportId: wall.id,
    verticalState: "grounded",
    random: harness.random,
  });
  const perched = createAnt({
    id: 11,
    x: baseX,
    y: baseY - ANT_TUNING.supportHeight,
    supportType: "ant",
    supportId: support.id,
    verticalState: "perched",
    random: harness.random,
  });
  const neighborA = createAnt({
    id: 12,
    x: baseX - 8,
    y: baseY - 8,
    supportType: "wall",
    supportId: wall.id,
    verticalState: "grounded",
    random: harness.random,
  });
  const neighborB = createAnt({
    id: 13,
    x: baseX + 8,
    y: baseY - 8,
    supportType: "wall",
    supportId: wall.id,
    verticalState: "grounded",
    random: harness.random,
  });

  const ants = [support, perched, neighborA, neighborB];
  harness.attachmentSystem.update(ants, SIMULATION_TUNING.fixedTimeStep, harness.mapSystem);
  runTicks(harness, ants, 180);

  ensure(ants.some((ant) => activeLegs(ant).some((leg) => leg.targetType === "wall")), "wall sheet test never anchored to wall");
  ensure(ants.every((ant) => ant.position.y <= ant.movement.groundY + 0.001), "wall sheet test let an ant tunnel below ground");
  ensure(ants.filter((ant) => ant.attached).length >= 3, "wall sheet test detached too aggressively");
  return "wall-supported sheet remained anchored";
}

function testImpactJolt() {
  const { harness, ants } = buildCornerCluster();
  runTicks(harness, ants, 30);

  const falling = createAnt({
    id: 20,
    x: ants[1].position.x,
    y: ants[1].position.y - 8,
    supportType: "none",
    verticalState: "falling",
    random: harness.random,
  });
  falling.movement.fallMode = "collapse";
  falling.velocity.y = 180;
  ants.push(falling);

  runTicks(harness, ants, 8);

  ensure(falling.physics.lastImpactId != null, "impact test did not record a collision with the structure");
  const joltedTargets = ants.filter((ant) => ant.id !== falling.id && Math.abs(ant.velocity.x) + Math.abs(ant.velocity.y) > 1.2);
  ensure(joltedTargets.length > 0, "impact test failed to transfer any visible jolt to the structure");
  return "falling ant transferred jolt into structure";
}

function testLongRunningIdle() {
  const { harness, ants } = buildCornerCluster();
  runTicks(harness, ants, 600);

  ensure(ants.every((ant) => Number.isFinite(ant.position.x) && Number.isFinite(ant.position.y)), "idle test produced non-finite positions");
  ensure(ants.every((ant) => ant.position.y <= ant.movement.groundY + 0.001), "idle test let an ant drift below ground");
  const maxSpeed = Math.max(...ants.map((ant) => Math.hypot(ant.velocity.x, ant.velocity.y)));
  ensure(maxSpeed < 120, `idle test left excessive drift/jitter speed (${maxSpeed.toFixed(2)})`);
  return `idle structure remained bounded (max speed ${maxSpeed.toFixed(2)})`;
}

const tests = [
  ["Corner Priority", testCornerPriority],
  ["Simple Bridge", testSimpleBridge],
  ["Wall Sheet", testWallSheet],
  ["Impact Jolt", testImpactJolt],
  ["Long Idle", testLongRunningIdle],
];

let failed = false;

for (const [name, test] of tests) {
  try {
    const detail = test();
    console.log(`[pass] ${name}: ${detail}`);
  } catch (error) {
    failed = true;
    console.error(`[fail] ${name}: ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
}
