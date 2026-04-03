import { Application, Container, Graphics, ParticleContainer, Text } from "https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.mjs";
import { MAP_TUNING, SENSOR_TUNING, SIMULATION_TUNING, WORLD_HEIGHT, WORLD_WIDTH } from "../config/tuning.js";
import { AntView } from "./AntView.js";
import { createAntSpriteLibrary } from "./AntSpriteLibrary.js";

const EMPTY_WEDGE_COLOR = 0x9e9a90;
const SENSOR_TEXT_STYLE = {
  fontFamily: "Consolas, 'Courier New', monospace",
  fontSize: 10,
  fill: 0x2a2119,
  stroke: 0xf4e6c7,
  strokeThickness: 3,
  lineJoin: "round",
};

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
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
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

export class WorldRenderer {
  constructor(simulation) {
    this.simulation = simulation;
    this.antViews = [];
    this.app = null;
    this.antSpriteLibrary = null;
    this.antLayer = null;
    this.sensorOverlay = null;
    this.sensorLabelLayer = null;
    this.sensorLabelTexts = [];
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
    this.#createGoalMarker();
    this.#createQueenMarker();
    this.#createAntViews();
    this.#createSensorOverlay();
  }

  render(elapsedTime) {
    for (const antView of this.antViews) {
      antView.sync(elapsedTime);
    }
    this.#drawSensorDebug();
  }

  destroy() {
    this.app.destroy(true, { children: true });
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
    const { walls, pegs, foodNodes } = this.simulation.mapSystem.getRenderState();
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

    for (const foodNode of foodNodes) {
      geometry.lineStyle(2, 0xd7f2b8, 0.7);
      geometry.beginFill(foodNode.color);
      geometry.drawCircle(foodNode.x, foodNode.y, foodNode.radius);
      geometry.endFill();
    }

    this.worldContainer.addChild(geometry);
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
  }

  #drawSensorDebug() {
    const ant = this.simulation.ants[SENSOR_TUNING.debugAntIndex];
    if (!ant || !ant.sensorState?.rays || !ant.sensorState?.wedges) {
      this.sensorOverlay.clear();
      for (const label of this.sensorLabelTexts) {
        label.visible = false;
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
      label.style = SENSOR_TEXT_STYLE;
      if (label.anchor) {
        label.anchor.set(horizontalDirection > 0 ? 0 : 1, verticalDirection > 0 ? 0 : 1);
      }
      label.position.set(
        dotX + Math.cos(worldAngle) * labelOffset + horizontalDirection * 4,
        dotY + Math.sin(worldAngle) * labelOffset + verticalDirection * 2
      );
      label.visible = true;
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
    this.antLayer = new ParticleContainer(this.simulation.ants.length, {
      position: true,
      scale: true,
      uvs: true,
    });
    this.worldContainer.addChild(this.antLayer);

    this.antViews = this.simulation.ants.map((ant) => {
      const antView = new AntView(ant, this.antSpriteLibrary);
      this.antLayer.addChild(antView.sprite);
      antView.sync(this.simulation.elapsedTime);
      return antView;
    });
  }
}
