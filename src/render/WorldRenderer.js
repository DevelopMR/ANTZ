import { Application, Container, Graphics, ParticleContainer, Text } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import {
  FOOD_SCENT_TUNING,
  MAP_TUNING,
  NEURAL_TUNING,
  SENSOR_TUNING,
  SIMULATION_TUNING,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../config/tuning.js";
import { AntView } from "./AntView.js";
import { createAntSpriteLibrary } from "./AntSpriteLibrary.js";

const EMPTY_WEDGE_COLOR = 0x9e9a90;
const SENSOR_TEXT_STYLE = {
  fontFamily: "Consolas, 'Courier New', monospace",
  fontSize: 9,
  fill: 0x2a2119,
  stroke: 0xf4e6c7,
  strokeThickness: 3,
  lineJoin: "round",
};
const LEG_TEXT_STYLE = {
  fontFamily: "Consolas, 'Courier New', monospace",
  fontSize: 9,
  fill: 0x213327,
  stroke: 0xf4e6c7,
  strokeThickness: 3,
  lineJoin: "round",
};
const BRAIN_TEXT_STYLE = {
  fontFamily: "Consolas, 'Courier New', monospace",
  fontSize: 11,
  fill: 0x2a2119,
  stroke: 0xf4e6c7,
  strokeThickness: 4,
  lineJoin: "round",
};
const LABEL_MARGIN = 8;
const DEBUG_PANEL_LAYOUT = {
  inputsX: 18,
  outputsX: 170,
  antX: 356,
  fitnessRightX: WORLD_WIDTH - 18,
  topY: 51,
  scenarioX: 18,
  scenarioY: 299,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sensorScalarToHex(value) {
  if (value >= 0.8) {
    return 0x5f9b42;
  }
  if (value >= 0.2) {
    return 0xa53a28;
  }
  if (value >= -0.35) {
    return 0x2a2119;
  }
  if (value > -1) {
    return 0x8f6a3d;
  }
  return EMPTY_WEDGE_COLOR;
}

function formatScalar(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue >= 0 ? `+${safeValue.toFixed(2)}` : safeValue.toFixed(2);
}

function formatWedgeCensus(wedge) {
  if (!wedge.objectCount || !wedge.contributors?.length) {
    return `${wedge.name}\navg ${formatScalar(0)}\nempty`;
  }

  const lines = [`${wedge.name}`, `avg ${formatScalar(wedge.colorScalar)}`];
  const visibleContributors = wedge.contributors.slice(0, 4);

  for (const contributor of visibleContributors) {
    lines.push(`${contributor.label} x${contributor.tallyCount}`);
  }

  if (wedge.contributors.length > visibleContributors.length) {
    lines.push(`+${wedge.contributors.length - visibleContributors.length} more`);
  }

  return lines.join("\n");
}

function formatLegDebug(leg) {
  const target = leg.targetType === "ant"
    ? `a${leg.targetId}`
    : leg.targetType === "wall"
      ? "wall"
      : "ground";

  return `${leg.slot + 1} ${target}\nx${leg.stretchRatio.toFixed(2)}`;
}

function formatInputDebug(ant) {
  const inputs = ant.brainState?.inputs ?? [];
  const wedgeNames = SENSOR_TUNING.wedgeNames;
  const lines = [
    `Tracked ant ${ant.id}`,
    "Inputs",
  ];

  for (let index = 0; index < wedgeNames.length; index += 1) {
    lines.push(`P ${wedgeNames[index]} ${formatScalar(inputs[index] ?? 0)}`);
  }

  for (let index = 0; index < wedgeNames.length; index += 1) {
    lines.push(`C ${wedgeNames[index]} ${formatScalar(inputs[index + wedgeNames.length] ?? 0)}`);
  }

  lines.push(`food scent ${formatScalar(inputs[12] ?? 0)}`);
  lines.push(`pheromone ${formatScalar(inputs[13] ?? 0)}`);
  return lines.join("\n");
}

function formatOutputDebug(ant) {
  const outputs = ant.brainState?.outputs ?? [];
  return [
    "Outputs",
    `xVel ${formatScalar(outputs[NEURAL_TUNING.xVelOutputIndex] ?? 0)}`,
    `yVel ${formatScalar(outputs[NEURAL_TUNING.yVelOutputIndex] ?? 0)}`,
    `grasp ${formatScalar(outputs[NEURAL_TUNING.graspOutputIndex] ?? 0)}`,
    `interact ${formatScalar(outputs[NEURAL_TUNING.interactionOutputIndex] ?? 0)}`,
    `intent grasp ${formatScalar(ant.brainState?.graspIntent ?? 0)}`,
    `intent interact ${formatScalar(ant.brainState?.interaction ?? 0)}`,
  ].join("\n");
}

function formatAntDebug(ant) {
  const activeLegCount = ant.attachment?.legs?.filter((leg) => leg.active).length ?? 0;
  const lines = [
    "Tracked Ant",
    `fitness ${formatScalar(ant.season?.fitnessScore ?? 0)}`,
    `state ${ant.movement?.verticalState ?? "unknown"}`,
    `support ${ant.movement?.supportType ?? "unknown"}`,
    `legs ${activeLegCount}`,
    `carry ${formatScalar(ant.food?.carriedAmount ?? 0)}`,
    `mode ${ant.food?.returnMode ?? "none"}`,
  ];

  if (ant.state === "dead" || ant.state === "decaying") {
    lines.push(`corpse ${ant.corpse?.state ?? ant.state}`);
    lines.push(`corpse food ${ant.corpse?.availableFoodUnits ?? 0}`);
    lines.push(`corpse spent ${ant.corpse?.harvestedFoodUnits ?? 0}`);
  }

  const carriedPayload = ant.food?.carriedPayload;
  if (carriedPayload) {
    lines.push(`payload grabs ${carriedPayload.acquisitionCount ?? 0}`);
    lines.push(`payload packs ${carriedPayload.acquisitionPacks?.length ?? 0}`);
    for (const contributor of carriedPayload.contributors.slice(0, 4)) {
      lines.push(`reward ant-${contributor.antId} ${formatScalar(contributor.weight)}`);
    }
    if ((carriedPayload.contributors?.length ?? 0) > 4) {
      lines.push(`reward +${carriedPayload.contributors.length - 4} more`);
    }
    if (carriedPayload.latestPath?.baseType) {
      const baseLabel = carriedPayload.latestPath.baseId != null
        ? `${carriedPayload.latestPath.baseType}-${carriedPayload.latestPath.baseId}`
        : carriedPayload.latestPath.baseType;
      lines.push(`reward base ${baseLabel}`);
    }
  }

  if (ant.lineageSource?.sourceType) {
    lines.push(`lineage ${ant.lineageSource.sourceType}`);
    lines.push(`mutated ${ant.lineageSource.shouldMutate ? "yes" : "no"}`);
    if (ant.lineageSource.antId != null) {
      lines.push(`parent ant-${ant.lineageSource.antId}`);
    }
  } else {
    lines.push("lineage random");
  }

  if ((ant.food?.saluteTimer ?? 0) > 0) {
    lines.push("saluting yes");
  }
  if (ant.physics?.lastBreakReason) {
    lines.push(`break ${ant.physics.lastBreakReason}`);
  }
  if (ant.physics?.lastImpactId != null) {
    lines.push(`impact ant ${ant.physics.lastImpactId}`);
  }

  return lines.join("\n");
}

function formatTrackedFitness(ant) {
  const fitness = ant?.season?.fitnessScore ?? 0;
  return [
    "Fitness",
    Number.isFinite(fitness) ? fitness.toFixed(2) : "0.00",
  ].join("\n");
}

function formatScenarioDebug(simulation) {
  const livingAnts = simulation?.ants?.filter((ant) => ant.state === "alive").length ?? 0;
  const deadAnts = simulation?.ants?.filter((ant) => ant.state === "dead").length ?? 0;
  const decayingAnts = simulation?.ants?.filter((ant) => ant.state === "decaying").length ?? 0;
  const harvestableCorpses = simulation?.ants?.filter((ant) => (ant.corpse?.availableFoodUnits ?? 0) > 0).length ?? 0;
  const spentCorpses = simulation?.ants?.filter((ant) => (ant.corpse?.availableFoodUnits ?? 0) <= 0 && (ant.corpse?.harvestedFoodUnits ?? 0) > 0).length ?? 0;
  return [
    "Scenario",
    `season ${simulation?.currentSeason?.index ?? 1}`,
    `season time ${Math.floor(simulation?.currentSeason?.elapsedSeconds ?? 0)}s`,
    `alive ants ${livingAnts}`,
    `dead ants ${deadAnts}`,
    `decaying ants ${decayingAnts}`,
    `corpse food ${harvestableCorpses}`,
    `corpse spent ${spentCorpses}`,
    `queen delivered ${simulation?.queen?.foodDelivered ?? 0}`,
    `queen food ${simulation?.queen?.foodReceived ?? 0}`,
    `queen meals ${simulation?.queen?.mealQueue?.length ?? 0}`,
    `queen queue ${simulation?.queen?.pendingSpawnQueue?.length ?? 0}`,
    `queen pool ${simulation?.queen?.pendingGenomePool?.length ?? 0}`,
    `queen pending ${simulation?.queen?.pendingSpawnCount ?? 0}`,
    `queen meal cd ${formatScalar(simulation?.queen?.mealCooldown ?? 0)}`,
    `queen cooldown ${formatScalar(simulation?.queen?.spawnCooldown ?? 0)}`,
    `queen spawns ${simulation?.queen?.spawnedAntCount ?? 0}`,
    `fallen ants ${simulation?.movementSystem?.totalFalls ?? 0}`,
  ].join("\n");
}

function clampLabelToWorld(label) {
  const anchorX = label.anchor?.x ?? 0;
  const anchorY = label.anchor?.y ?? 0;
  const left = label.x - label.width * anchorX;
  const top = label.y - label.height * anchorY;
  const right = left + label.width;
  const bottom = top + label.height;

  let shiftX = 0;
  let shiftY = 0;

  if (left < LABEL_MARGIN) {
    shiftX = LABEL_MARGIN - left;
  } else if (right > WORLD_WIDTH - LABEL_MARGIN) {
    shiftX = (WORLD_WIDTH - LABEL_MARGIN) - right;
  }

  if (top < LABEL_MARGIN) {
    shiftY = LABEL_MARGIN - top;
  } else if (bottom > WORLD_HEIGHT - LABEL_MARGIN) {
    shiftY = (WORLD_HEIGHT - LABEL_MARGIN) - bottom;
  }

  label.position.set(label.x + shiftX, label.y + shiftY);
}

export class WorldRenderer {
  constructor(simulation) {
    this.simulation = simulation;
    this.antViews = [];
    this.app = null;
    this.antSpriteLibrary = null;
    this.antLayer = null;
    this.foodLayer = null;
    this.foodScentLayer = null;
    this.carryOverlay = null;
    this.sensorOverlay = null;
    this.sensorLabelLayer = null;
    this.sensorLabelTexts = [];
    this.legLabelTexts = [];
    this.debugInputsText = null;
    this.debugOutputsText = null;
    this.debugAntText = null;
    this.debugFitnessText = null;
    this.debugScenarioText = null;
    this.showFoodScentMap = false;
  }

  async initialize(container) {
    this.app = new Application({
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      antialias: false,
      backgroundAlpha: 0,
      resolution: 1,
      autoDensity: true,
    });

    container.appendChild(this.app.view);
    this.app.view.style.width = "100%";
    this.app.view.style.height = "100%";

    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);
    this.antSpriteLibrary = createAntSpriteLibrary();

    this.#drawWorldBackdrop();
    this.#drawMapGeometry();
    this.#createFoodScentLayer();
    this.#createFoodLayer();
    this.#createGoalMarker();
    this.#createQueenMarker();
    this.#createAntViews();
    this.#createCarryOverlay();
    this.#createSensorOverlay();
  }

  render(elapsedTime) {
    this.#syncAntViews();
    this.#drawFoodScentMap();
    this.#drawFoodNodes();
    this.#drawCarryOverlay();

    for (const antView of this.antViews) {
      antView.sync(elapsedTime);
    }
    this.#drawSensorDebug();
  }

  destroy() {
    this.app.destroy(true, { children: true });
  }

  setShowFoodScentMap(enabled) {
    this.showFoodScentMap = enabled;
  }

  #drawWorldBackdrop() {
    const backdrop = new Graphics();
    backdrop.beginFill(0xe8d8b8);
    backdrop.drawRoundedRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 22);
    backdrop.endFill();

    backdrop.lineStyle(2, 0xc89d62, 0.13);
    for (let x = 0; x <= WORLD_WIDTH; x += 128) {
      backdrop.moveTo(x, 0);
      backdrop.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += 96) {
      backdrop.moveTo(0, y);
      backdrop.lineTo(WORLD_WIDTH, y);
    }

    backdrop.beginFill(MAP_TUNING.groundColor);
    backdrop.drawRect(0, SIMULATION_TUNING.groundY + 10, WORLD_WIDTH, WORLD_HEIGHT - (SIMULATION_TUNING.groundY + 10));
    backdrop.endFill();

    backdrop.lineStyle(5, 0x8f6a3d, 0.85);
    backdrop.moveTo(0, SIMULATION_TUNING.groundY + 8);
    backdrop.lineTo(WORLD_WIDTH, SIMULATION_TUNING.groundY + 8);

    this.worldContainer.addChild(backdrop);
  }

  #drawMapGeometry() {
    const { walls, pegs } = this.simulation.mapSystem.getRenderState();
    const geometry = new Graphics();

    for (const wall of walls) {
      geometry.beginFill(wall.color);
      geometry.drawRect(wall.x, wall.y, wall.width, wall.height);
      geometry.endFill();
    }

    for (const peg of pegs) {
      geometry.lineStyle(3, 0xf5d7a8, 0.55);
      geometry.beginFill(peg.color);
      geometry.drawCircle(peg.x, peg.y, peg.radius);
      geometry.endFill();
    }

    this.worldContainer.addChild(geometry);
  }

  #createFoodScentLayer() {
    this.foodScentLayer = new Graphics();
    this.worldContainer.addChild(this.foodScentLayer);
  }

  #drawFoodScentMap() {
    this.foodScentLayer.clear();
    const overlay = this.simulation.foodScentSystem?.getOverlayState?.();
    if (!this.showFoodScentMap || !overlay?.enabled) {
      return;
    }

    for (let row = 0; row < overlay.rows; row += 1) {
      for (let column = 0; column < overlay.columns; column += 1) {
        const intensity = overlay.field[row * overlay.columns + column] ?? 0;
        if (intensity < FOOD_SCENT_TUNING.overlayThreshold) {
          continue;
        }

        const alpha = clamp(
          FOOD_SCENT_TUNING.overlayMinAlpha + intensity * (FOOD_SCENT_TUNING.overlayMaxAlpha - FOOD_SCENT_TUNING.overlayMinAlpha),
          FOOD_SCENT_TUNING.overlayMinAlpha,
          FOOD_SCENT_TUNING.overlayMaxAlpha
        );

        this.foodScentLayer.beginFill(FOOD_SCENT_TUNING.overlayColor, alpha);
        this.foodScentLayer.drawRect(
          column * overlay.cellSize,
          row * overlay.cellSize,
          overlay.cellSize,
          overlay.cellSize
        );
        this.foodScentLayer.endFill();
      }
    }
  }

  #createFoodLayer() {
    this.foodLayer = new Graphics();
    this.worldContainer.addChild(this.foodLayer);
    this.#drawFoodNodes();
  }

  #drawFoodNodes() {
    const { foodNodes } = this.simulation.mapSystem.getRenderState();
    this.foodLayer.clear();

    for (const foodNode of foodNodes) {
      if (!foodNode.available || foodNode.radius <= 0) {
        continue;
      }

      const ratio = foodNode.remainingTrips / Math.max(foodNode.maxTrips, 1);
      const alpha = clamp(0.45 + ratio * 0.55, 0.45, 1);
      this.foodLayer.lineStyle(2, 0xd7f2b8, 0.7);
      this.foodLayer.beginFill(foodNode.color, alpha);
      this.foodLayer.drawCircle(foodNode.x, foodNode.y, foodNode.radius);
      this.foodLayer.endFill();
    }
  }

  #createCarryOverlay() {
    this.carryOverlay = new Graphics();
    this.worldContainer.addChild(this.carryOverlay);
  }

  #drawCarryOverlay() {
    this.carryOverlay.clear();

    for (const ant of this.simulation.ants) {
      if (ant.carryingFood) {
        const carryX = ant.position.x + ant.facing * 12;
        const carryY = ant.position.y - 20;
        this.carryOverlay.lineStyle(1, 0xeaf7d2, 0.9);
        this.carryOverlay.beginFill(0x5f9b42, 0.95);
        this.carryOverlay.drawCircle(carryX, carryY, 4.5);
        this.carryOverlay.endFill();
      }

      if ((ant.food?.saluteTimer ?? 0) > 0) {
        this.carryOverlay.lineStyle(2, 0xf1ddb5, 0.85);
        this.carryOverlay.drawCircle(ant.position.x, ant.position.y - 18, 8);
      }
    }
  }

  #createSensorOverlay() {
    this.sensorOverlay = new Graphics();
    this.worldContainer.addChild(this.sensorOverlay);

    this.sensorLabelLayer = new Container();
    this.worldContainer.addChild(this.sensorLabelLayer);

    this.sensorLabelTexts = Array.from({ length: SENSOR_TUNING.wedgeCount }, () => {
      const label = new Text("", SENSOR_TEXT_STYLE);
      label.visible = false;
      this.sensorLabelLayer.addChild(label);
      return label;
    });

    this.legLabelTexts = Array.from({ length: 4 }, () => {
      const label = new Text("", LEG_TEXT_STYLE);
      label.anchor?.set?.(0.5, 0.5);
      label.visible = false;
      this.sensorLabelLayer.addChild(label);
      return label;
    });

    this.debugInputsText = new Text("", BRAIN_TEXT_STYLE);
    this.debugInputsText.position.set(DEBUG_PANEL_LAYOUT.inputsX, DEBUG_PANEL_LAYOUT.topY);
    this.worldContainer.addChild(this.debugInputsText);

    this.debugOutputsText = new Text("", BRAIN_TEXT_STYLE);
    this.debugOutputsText.position.set(DEBUG_PANEL_LAYOUT.outputsX, DEBUG_PANEL_LAYOUT.topY);
    this.worldContainer.addChild(this.debugOutputsText);

    this.debugAntText = new Text("", BRAIN_TEXT_STYLE);
    this.debugAntText.position.set(DEBUG_PANEL_LAYOUT.antX, DEBUG_PANEL_LAYOUT.topY);
    this.worldContainer.addChild(this.debugAntText);


    this.debugScenarioText = new Text("", BRAIN_TEXT_STYLE);
    this.debugScenarioText.position.set(DEBUG_PANEL_LAYOUT.scenarioX, DEBUG_PANEL_LAYOUT.scenarioY);
    this.worldContainer.addChild(this.debugScenarioText);
  }

  #drawSensorDebug() {
    const focusedAnt = this.simulation.debugFocusAntId != null
      ? this.simulation.ants.find((candidate) => candidate.id === this.simulation.debugFocusAntId)
      : null;
    const fallbackIndex = this.simulation.ants.length > 0
      ? Math.floor(this.simulation.elapsedTime / SENSOR_TUNING.debugFallbackHoldSeconds) % this.simulation.ants.length
      : SENSOR_TUNING.debugAntIndex;
    const ant = focusedAnt ?? this.simulation.ants[fallbackIndex] ?? this.simulation.ants[SENSOR_TUNING.debugAntIndex];
    if (!ant || !ant.sensorState?.rays || !ant.sensorState?.wedges) {
      this.sensorOverlay.clear();
      for (const label of this.sensorLabelTexts) {
        label.visible = false;
      }
      for (const label of this.legLabelTexts) {
        label.visible = false;
      }
      if (this.debugInputsText) {
        this.debugInputsText.text = "";
      }
      if (this.debugOutputsText) {
        this.debugOutputsText.text = "";
      }
      if (this.debugAntText) {
        this.debugAntText.text = "";
      }

      if (this.debugScenarioText) {
        this.debugScenarioText.text = "";
      }
      return;
    }

    const sensorOrigin = ant.sensorState.debug?.origin ?? {
      x: ant.position.x,
      y: ant.position.y - 10,
    };
    const g = this.sensorOverlay;
    g.clear();

    for (const ray of ant.sensorState.rays) {
      const endPoint = ray.hit
        ? ray.hit.point
        : {
          x: sensorOrigin.x + Math.cos(ray.angle) * SENSOR_TUNING.maxDistance,
          y: sensorOrigin.y + Math.sin(ray.angle) * SENSOR_TUNING.maxDistance,
        };
      const lineColor = ray.hit ? sensorScalarToHex(ray.colorScalar) : EMPTY_WEDGE_COLOR;
      const lineWidth = ray.isCenterRay ? 1.5 : 1;
      const lineAlpha = ray.hit ? (ray.isCenterRay ? 0.72 : 0.58) : 0.18;

      g.lineStyle(lineWidth, lineColor, lineAlpha);
      g.moveTo(sensorOrigin.x, sensorOrigin.y);
      g.lineTo(endPoint.x, endPoint.y);

      for (const hit of ray.hits) {
        const hitColor = sensorScalarToHex(hit.colorScalar);
        const markerRadius = hit.occludesVision ? 3 : 2;
        g.lineStyle(1, 0xf2e6c8, 0.45);
        g.beginFill(hitColor, hit.occludesVision ? 0.95 : 0.78);
        g.drawCircle(hit.point.x, hit.point.y, markerRadius);
        g.endFill();
      }
    }

    for (let wedgeIndex = 0; wedgeIndex < ant.sensorState.wedges.length; wedgeIndex += 1) {
      const wedge = ant.sensorState.wedges[wedgeIndex];
      const worldAngle = wedge.localAngle;
      const dotRadius = SENSOR_TUNING.maxDistance - 8;
      const dotX = sensorOrigin.x + Math.cos(worldAngle) * dotRadius;
      const dotY = sensorOrigin.y + Math.sin(worldAngle) * dotRadius;
      const dotColor = wedge.objectCount > 0 ? sensorScalarToHex(wedge.colorScalar) : EMPTY_WEDGE_COLOR;

      g.lineStyle(1, 0xf2e6c8, 0.7);
      g.beginFill(dotColor, 0.95);
      g.drawCircle(dotX, dotY, 4.2);
      g.endFill();

      const label = this.sensorLabelTexts[wedgeIndex];
      const labelOffset = 12;
      const horizontalDirection = Math.cos(worldAngle) >= 0 ? 1 : -1;
      const verticalDirection = Math.sin(worldAngle) >= 0 ? 1 : -1;

      label.text = formatWedgeCensus(wedge);
      if (label.anchor) {
        label.anchor.set(horizontalDirection > 0 ? 0 : 1, verticalDirection > 0 ? 0 : 1);
      }
      label.position.set(
        dotX + Math.cos(worldAngle) * labelOffset + horizontalDirection * 4,
        dotY + Math.sin(worldAngle) * labelOffset + verticalDirection * 2
      );
      clampLabelToWorld(label);
      label.visible = true;
    }

    const activeLegs = ant.attachment?.legs?.filter((leg) => leg.active) ?? [];
    for (let index = 0; index < this.legLabelTexts.length; index += 1) {
      const label = this.legLabelTexts[index];
      const leg = activeLegs[index];
      if (!leg) {
        label.visible = false;
        continue;
      }

      const directionX = leg.debugDirectionX || Math.cos(leg.preferredAngle || 0);
      const directionY = leg.debugDirectionY || Math.sin(leg.preferredAngle || 0);
      const radius = 34;
      label.text = formatLegDebug(leg);
      if (label.anchor) {
        label.anchor.set(0.5, 0.5);
      }
      label.position.set(
        sensorOrigin.x + directionX * radius,
        sensorOrigin.y + directionY * radius
      );
      clampLabelToWorld(label);
      label.visible = true;
    }

    if (this.debugInputsText) {
      this.debugInputsText.text = formatInputDebug(ant);
    }
    if (this.debugOutputsText) {
      this.debugOutputsText.text = formatOutputDebug(ant);
    }
    if (this.debugAntText) {
      this.debugAntText.text = formatAntDebug(ant);
    }

    if (this.debugScenarioText) {
      this.debugScenarioText.text = formatScenarioDebug(this.simulation);
    }
  }

  #createQueenMarker() {
    const queenMarker = new Graphics();
    queenMarker.lineStyle(3, 0xfce0a7, 1);
    queenMarker.beginFill(MAP_TUNING.queenColor);
    queenMarker.drawCircle(0, 0, 18);
    queenMarker.endFill();
    queenMarker.position.set(
      this.simulation.queen.position.x,
      this.simulation.queen.position.y
    );

    this.worldContainer.addChild(queenMarker);
  }

  #createGoalMarker() {
    const goalMarker = new Graphics();
    goalMarker.lineStyle(3, 0xf9f1c8, 1);
    goalMarker.beginFill(0x496c42);
    goalMarker.drawRoundedRect(-24, -20, 48, 40, 10);
    goalMarker.endFill();
    goalMarker.moveTo(-12, 0);
    goalMarker.lineTo(12, 0);
    goalMarker.moveTo(0, -10);
    goalMarker.lineTo(0, 10);
    goalMarker.position.set(
      this.simulation.goal.position.x,
      this.simulation.goal.position.y
    );

    this.worldContainer.addChild(goalMarker);
  }

  #createAntViews() {
    this.antLayer = new ParticleContainer(Math.max(this.simulation.ants.length + 256, 512), {
      position: true,
      scale: true,
      uvs: true,
    });
    this.worldContainer.addChild(this.antLayer);

    this.antViews = [];
    this.#syncAntViews();
  }

  #syncAntViews() {
    const needsRebuild =
      this.antViews.length !== this.simulation.ants.length ||
      this.antViews.some((antView, index) => antView.ant !== this.simulation.ants[index]);

    if (needsRebuild) {
      for (const antView of this.antViews) {
        this.antLayer.removeChild(antView.sprite);
      }
      this.antViews = [];
    }

    while (this.antViews.length < this.simulation.ants.length) {
      const ant = this.simulation.ants[this.antViews.length];
      const antView = new AntView(ant, this.antSpriteLibrary);
      this.antLayer.addChild(antView.sprite);
      antView.sync(this.simulation.elapsedTime);
      this.antViews.push(antView);
    }
  }
}
