import { SENSOR_TUNING } from "../config/tuning.js";

const FULL_CIRCLE = Math.PI * 2;
const HALF_WEDGE_SPAN = Math.PI / SENSOR_TUNING.wedgeCount;
const WEDGE_SPAN = FULL_CIRCLE / SENSOR_TUNING.wedgeCount;

function normalizeAngle(angle) {
  while (angle < 0) {
    angle += FULL_CIRCLE;
  }
  while (angle >= FULL_CIRCLE) {
    angle -= FULL_CIRCLE;
  }
  return angle;
}

function shortestAngleDifference(a, b) {
  let diff = normalizeAngle(a - b);
  if (diff > Math.PI) {
    diff -= FULL_CIRCLE;
  }
  return diff;
}

function getFacingOffset(ant) {
  return ant.facing > 0 ? 0 : Math.PI;
}

function getWedgeIndex(localAngle) {
  let bestIndex = 0;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 0; index < SENSOR_TUNING.wedgeCenters.length; index += 1) {
    const difference = Math.abs(shortestAngleDifference(localAngle, SENSOR_TUNING.wedgeCenters[index]));
    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return bestDifference <= HALF_WEDGE_SPAN + 0.001 ? bestIndex : null;
}

function getRayOffsets() {
  const rayOffsets = [];
  const rayCount = SENSOR_TUNING.raysPerWedge;
  const step = WEDGE_SPAN / rayCount;
  const start = -HALF_WEDGE_SPAN + step * 0.5;

  for (let index = 0; index < rayCount; index += 1) {
    rayOffsets.push(start + step * index);
  }

  return rayOffsets;
}

function getSampleWeight(distance) {
  const normalized = Math.max(0, 1 - distance / SENSOR_TUNING.maxDistance);
  return normalized * normalized;
}

export class SensorSystem {
  constructor() {
    this.rayOffsets = getRayOffsets();
  }

  update(ants, mapSystem, queen) {
    const dynamicObjects = mapSystem.createDynamicSensorObjects(ants, queen);
    const dynamicIndex = mapSystem.buildDynamicSensorIndex(dynamicObjects);

    for (const ant of ants) {
      this.#sampleAnt(ant, mapSystem, dynamicIndex);
    }
  }

  #sampleAnt(ant, mapSystem, dynamicIndex) {
    const facingOffset = getFacingOffset(ant);
    const staticCandidates = mapSystem.getStaticSensorCandidates(ant.position, SENSOR_TUNING.maxDistance);
    const dynamicCandidates = mapSystem.getDynamicSensorCandidates(dynamicIndex, ant.position, SENSOR_TUNING.maxDistance);
    const nearbyWalls = staticCandidates.filter((object) => object.occludesVision);
    const candidates = [...staticCandidates, ...dynamicCandidates].filter(
      (object) => !(object.sourceType === "ant" && object.sourceId === ant.id)
    );
    const wedgeData = Array.from({ length: SENSOR_TUNING.wedgeCount }, (_, index) => ({
      index,
      name: SENSOR_TUNING.wedgeNames[index],
      localAngle: SENSOR_TUNING.wedgeCenters[index],
      colorWeightSum: 0,
      weightedColorSum: 0,
      closestDistance: null,
      closestPoint: null,
      closestObjectType: null,
      contributingObjects: new Set(),
    }));
    const visibleObjects = [];
    const rays = [];

    for (const object of candidates) {
      const { nearestPoint, distance } = mapSystem.getDistanceToObject(ant.position, object);
      if (distance > SENSOR_TUNING.maxDistance) {
        continue;
      }

      const occluded = object.occludesVision
        ? false
        : mapSystem.isWallOccluding(ant.position, nearestPoint, distance, nearbyWalls);

      if (occluded) {
        continue;
      }

      const wedgeIndices = new Set();
      for (const samplePoint of mapSystem.getSensorSamplePoints(ant.position, object)) {
        const dx = samplePoint.x - ant.position.x;
        const dy = samplePoint.y - ant.position.y;
        const sampleDistance = Math.hypot(dx, dy);
        if (sampleDistance === 0 || sampleDistance > SENSOR_TUNING.maxDistance) {
          continue;
        }

        const worldAngle = normalizeAngle(Math.atan2(dy, dx));
        const localAngle = normalizeAngle(worldAngle - facingOffset);
        const wedgeIndex = getWedgeIndex(localAngle);
        if (wedgeIndex === null) {
          continue;
        }

        const weight = getSampleWeight(sampleDistance);
        if (weight <= 0) {
          continue;
        }

        const wedge = wedgeData[wedgeIndex];
        wedge.weightedColorSum += object.sensorColorScalar * weight;
        wedge.colorWeightSum += weight;
        wedge.contributingObjects.add(object.id);
        wedgeIndices.add(wedgeIndex);
      }

      if (wedgeIndices.size === 0) {
        continue;
      }

      visibleObjects.push({
        type: object.type,
        x: nearestPoint.x,
        y: nearestPoint.y,
        centerX: nearestPoint.x,
        centerY: nearestPoint.y,
        colorScalar: object.sensorColorScalar,
        distance,
        wedges: [...wedgeIndices],
      });

      for (const wedgeIndex of wedgeIndices) {
        const wedge = wedgeData[wedgeIndex];
        if (wedge.closestDistance === null || distance < wedge.closestDistance) {
          wedge.closestDistance = distance;
          wedge.closestPoint = nearestPoint;
          wedge.closestObjectType = object.type;
        }
      }
    }

    for (let wedgeIndex = 0; wedgeIndex < SENSOR_TUNING.wedgeCount; wedgeIndex += 1) {
      const wedgeCenter = SENSOR_TUNING.wedgeCenters[wedgeIndex];

      for (let rayIndex = 0; rayIndex < this.rayOffsets.length; rayIndex += 1) {
        const localAngle = normalizeAngle(wedgeCenter + this.rayOffsets[rayIndex]);
        const worldAngle = normalizeAngle(localAngle + facingOffset);
        const hit = mapSystem.castVisionRay(ant.position, worldAngle, SENSOR_TUNING.maxDistance, candidates);

        rays.push({
          wedgeIndex,
          rayIndex,
          localAngle,
          angle: worldAngle,
          hit,
          colorScalar: hit ? hit.object.sensorColorScalar : null,
        });
      }
    }

    const wedges = wedgeData.map((wedge) => ({
      index: wedge.index,
      name: wedge.name,
      localAngle: wedge.localAngle,
      proximity: wedge.closestDistance === null
        ? 0
        : 1 - wedge.closestDistance / SENSOR_TUNING.maxDistance,
      closestDistance: wedge.closestDistance,
      colorScalar: wedge.colorWeightSum > 0 ? wedge.weightedColorSum / wedge.colorWeightSum : 0,
      objectCount: wedge.contributingObjects.size,
      closestPoint: wedge.closestPoint,
      closestObjectType: wedge.closestObjectType,
    }));

    ant.sensorState = {
      wedges,
      rays,
      debug: {
        visibleObjects,
      },
      scalars: {
        foodScent: mapSystem.sampleFoodScentAt(ant.position),
        pheromone: 0,
        speed: Math.min(1, Math.abs(ant.velocity.x) / 60),
        attached: ant.attached ? 1 : 0,
        connectionCount: Math.min(1, ant.connectionIds.length / 4),
      },
    };
  }
}
