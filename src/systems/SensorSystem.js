import { SENSOR_TUNING } from "../config/tuning.js";

const FULL_CIRCLE = Math.PI * 2;
const WEDGE_SPAN = FULL_CIRCLE / SENSOR_TUNING.wedgeCount;
const HALF_WEDGE_SPAN = WEDGE_SPAN * 0.5;
const SENSOR_ORIGIN_Y_OFFSET = -10;

function normalizeAngle(angle) {
  while (angle < 0) {
    angle += FULL_CIRCLE;
  }
  while (angle >= FULL_CIRCLE) {
    angle -= FULL_CIRCLE;
  }
  return angle;
}

function createRayLayout() {
  const borderAngles = [];
  const centerAngles = [];

  for (let index = 0; index < SENSOR_TUNING.wedgeCount; index += 1) {
    centerAngles.push(normalizeAngle(SENSOR_TUNING.wedgeCenters[index]));
    borderAngles.push(normalizeAngle(SENSOR_TUNING.wedgeCenters[index] - HALF_WEDGE_SPAN));
  }

  return {
    borderAngles,
    centerAngles,
  };
}

function getCenterRayContribution(wedgeIndex) {
  return [{ wedgeIndex, tallyWeight: SENSOR_TUNING.centerRayTallyWeight }];
}

function getBorderRayContribution(borderIndex) {
  const leftWedge = borderIndex;
  const rightWedge = (borderIndex - 1 + SENSOR_TUNING.wedgeCount) % SENSOR_TUNING.wedgeCount;
  return [
    { wedgeIndex: leftWedge, tallyWeight: SENSOR_TUNING.borderRayTallyWeight },
    { wedgeIndex: rightWedge, tallyWeight: SENSOR_TUNING.borderRayTallyWeight },
  ];
}

function createEmptyWedge(index) {
  return {
    index,
    name: SENSOR_TUNING.wedgeNames[index],
    localAngle: SENSOR_TUNING.wedgeCenters[index],
    tallyCount: 0,
    colorTallySum: 0,
    closestDistance: null,
    closestPoint: null,
    closestObjectType: null,
    contributors: new Map(),
  };
}

function formatObjectLabel(object) {
  switch (object.type) {
    case "queen":
      return "queen";
    case "food":
      return object.id || "food";
    case "ground":
      return "ground";
    case "wall":
      return object.id || "wall";
    case "peg":
      return object.id || "peg";
    case "ant":
      return object.sourceId !== undefined ? `ant-${object.sourceId}` : object.id || "ant";
    default:
      return object.id || object.type || "object";
  }
}

function getSensorOrigin(ant) {
  return {
    x: ant.position.x,
    y: ant.position.y + SENSOR_ORIGIN_Y_OFFSET,
  };
}

function addHitToWedge(wedge, hit, tallyWeight) {
  wedge.colorTallySum += hit.object.sensorColorScalar * tallyWeight;
  wedge.tallyCount += tallyWeight;

  if (wedge.closestDistance === null || hit.distance < wedge.closestDistance) {
    wedge.closestDistance = hit.distance;
    wedge.closestPoint = hit.point;
    wedge.closestObjectType = hit.object.type;
  }

  const contributorKey = hit.object.id || `${hit.object.type}-${formatObjectLabel(hit.object)}`;
  if (!wedge.contributors.has(contributorKey)) {
    wedge.contributors.set(contributorKey, {
      key: contributorKey,
      label: formatObjectLabel(hit.object),
      type: hit.object.type,
      tallyCount: 0,
      hitCount: 0,
      colorScalar: hit.object.sensorColorScalar,
      closestDistance: hit.distance,
    });
  }

  const contributor = wedge.contributors.get(contributorKey);
  contributor.tallyCount += tallyWeight;
  contributor.hitCount += 1;
  contributor.closestDistance = Math.min(contributor.closestDistance, hit.distance);
}

export class SensorSystem {
  constructor() {
    this.rayLayout = createRayLayout();
  }

  update(ants, mapSystem, queen) {
    const dynamicObjects = mapSystem.createDynamicSensorObjects(ants, queen);
    const dynamicIndex = mapSystem.buildDynamicSensorIndex(dynamicObjects);

    for (const ant of ants) {
      this.#sampleAnt(ant, mapSystem, dynamicIndex);
    }
  }

  #sampleAnt(ant, mapSystem, dynamicIndex) {
    const sensorOrigin = getSensorOrigin(ant);
    const staticCandidates = mapSystem.getStaticSensorCandidates(sensorOrigin, SENSOR_TUNING.maxDistance);
    const dynamicCandidates = mapSystem.getDynamicSensorCandidates(
      dynamicIndex,
      sensorOrigin,
      SENSOR_TUNING.maxDistance + SENSOR_TUNING.localAntQueryPadding
    );
    const candidates = [...staticCandidates, ...dynamicCandidates].filter(
      (object) => !(object.sourceType === "ant" && object.sourceId === ant.id)
    );
    const wedges = Array.from({ length: SENSOR_TUNING.wedgeCount }, (_, index) => createEmptyWedge(index));
    const rays = [];

    for (let wedgeIndex = 0; wedgeIndex < SENSOR_TUNING.wedgeCount; wedgeIndex += 1) {
      const centerAngle = this.rayLayout.centerAngles[wedgeIndex];
      const centerHits = mapSystem.getRayHits(sensorOrigin, centerAngle, SENSOR_TUNING.maxDistance, candidates);
      const processedCenterHits = this.#collectVisibleHits(centerHits);
      const centerRay = this.#createRayDebug(centerAngle, processedCenterHits, true);
      rays.push(centerRay);

      for (const hit of processedCenterHits.visibleHits) {
        for (const contribution of getCenterRayContribution(wedgeIndex)) {
          addHitToWedge(wedges[contribution.wedgeIndex], hit, contribution.tallyWeight);
        }
      }
    }

    for (let borderIndex = 0; borderIndex < SENSOR_TUNING.wedgeCount; borderIndex += 1) {
      const borderAngle = this.rayLayout.borderAngles[borderIndex];
      const borderHits = mapSystem.getRayHits(sensorOrigin, borderAngle, SENSOR_TUNING.maxDistance, candidates);
      const processedBorderHits = this.#collectVisibleHits(borderHits);
      const borderRay = this.#createRayDebug(borderAngle, processedBorderHits, false);
      rays.push(borderRay);

      const contributions = getBorderRayContribution(borderIndex);
      for (const hit of processedBorderHits.visibleHits) {
        for (const contribution of contributions) {
          addHitToWedge(wedges[contribution.wedgeIndex], hit, contribution.tallyWeight);
        }
      }
    }

    ant.sensorState = {
      wedges: wedges.map((wedge) => ({
        index: wedge.index,
        name: wedge.name,
        localAngle: wedge.localAngle,
        proximity: wedge.closestDistance === null
          ? 0
          : 1 - wedge.closestDistance / SENSOR_TUNING.maxDistance,
        closestDistance: wedge.closestDistance,
        colorScalar: wedge.tallyCount > 0 ? wedge.colorTallySum / wedge.tallyCount : 0,
        objectCount: wedge.tallyCount,
        closestPoint: wedge.closestPoint,
        closestObjectType: wedge.closestObjectType,
        contributors: Array.from(wedge.contributors.values()).sort((left, right) => {
          if (right.tallyCount !== left.tallyCount) {
            return right.tallyCount - left.tallyCount;
          }
          return left.closestDistance - right.closestDistance;
        }),
      })),
      rays,
      debug: {
        origin: sensorOrigin,
        visibleObjects: [],
      },
      scalars: {
        foodScent: mapSystem.sampleFoodScentAt(ant.position),
        pheromone: 0,
      },
    };
  }

  #collectVisibleHits(sortedHits) {
    const visibleHits = [];
    let terminalHit = null;

    for (const hit of sortedHits) {
      visibleHits.push(hit);
      terminalHit = hit;

      if (hit.object.occludesVision) {
        break;
      }
    }

    return {
      visibleHits,
      terminalHit,
    };
  }

  #createRayDebug(angle, processedHits, isCenterRay) {
    const { visibleHits, terminalHit } = processedHits;

    return {
      angle,
      isCenterRay,
      hits: visibleHits.map((hit) => ({
        distance: hit.distance,
        point: hit.point,
        objectType: hit.object.type,
        objectId: hit.object.id,
        label: formatObjectLabel(hit.object),
        colorScalar: hit.object.sensorColorScalar,
        occludesVision: hit.object.occludesVision,
      })),
      hit: terminalHit
        ? {
            distance: terminalHit.distance,
            point: terminalHit.point,
            object: terminalHit.object,
          }
        : null,
      colorScalar: terminalHit ? terminalHit.object.sensorColorScalar : null,
    };
  }
}


