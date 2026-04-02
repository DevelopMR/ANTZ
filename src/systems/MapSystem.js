import {
  ANT_TUNING,
  MAP_TUNING,
  SENSOR_TUNING,
  SIMULATION_TUNING,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../config/tuning.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeCellKey(cellX, cellY) {
  return `${cellX},${cellY}`;
}

function getObjectBounds(object) {
  if (object.shape === "rect") {
    return {
      minX: object.x,
      maxX: object.x + object.width,
      minY: object.y,
      maxY: object.y + object.height,
    };
  }

  return {
    minX: object.x - object.radius,
    maxX: object.x + object.radius,
    minY: object.y - object.radius,
    maxY: object.y + object.radius,
  };
}

function createSpatialIndex(objects, cellSize) {
  const index = new Map();

  for (const object of objects) {
    const bounds = getObjectBounds(object);
    const minCellX = Math.floor(bounds.minX / cellSize);
    const maxCellX = Math.floor(bounds.maxX / cellSize);
    const minCellY = Math.floor(bounds.minY / cellSize);
    const maxCellY = Math.floor(bounds.maxY / cellSize);

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
        const key = makeCellKey(cellX, cellY);
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key).push(object);
      }
    }
  }

  return index;
}

function querySpatialIndex(index, position, radius, cellSize) {
  const results = [];
  const seen = new Set();
  const minCellX = Math.floor((position.x - radius) / cellSize);
  const maxCellX = Math.floor((position.x + radius) / cellSize);
  const minCellY = Math.floor((position.y - radius) / cellSize);
  const maxCellY = Math.floor((position.y + radius) / cellSize);

  for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      const key = makeCellKey(cellX, cellY);
      const bucket = index.get(key);
      if (!bucket) {
        continue;
      }

      for (const object of bucket) {
        if (!seen.has(object.id)) {
          seen.add(object.id);
          results.push(object);
        }
      }
    }
  }

  return results;
}

function makeWall(id, x, y, width, height) {
  return {
    id,
    type: "wall",
    shape: "rect",
    x,
    y,
    width,
    height,
    climbable: true,
    occludesVision: true,
    color: MAP_TUNING.wallColor,
    sensorColorScalar: SENSOR_TUNING.colorRange.obstacle,
  };
}

function makePeg(id, x, y, radius) {
  return {
    id,
    type: "peg",
    shape: "circle",
    x,
    y,
    radius,
    climbable: true,
    occludesVision: false,
    color: MAP_TUNING.pegColor,
    sensorColorScalar: SENSOR_TUNING.colorRange.obstacle,
  };
}

function makeFood(id, x, y, radius) {
  return {
    id,
    type: "food",
    shape: "circle",
    x,
    y,
    radius,
    climbable: false,
    occludesVision: false,
    color: MAP_TUNING.foodColor,
    sensorColorScalar: SENSOR_TUNING.colorRange.food,
  };
}

function makeGround(y) {
  return {
    id: "ground",
    type: "ground",
    shape: "rect",
    x: 0,
    y,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT - y,
    climbable: false,
    occludesVision: false,
    color: MAP_TUNING.groundColor,
    sensorColorScalar: SENSOR_TUNING.colorRange.obstacle,
  };
}

function rayCircleIntersection(origin, direction, circle, maxDistance) {
  const dx = origin.x - circle.x;
  const dy = origin.y - circle.y;
  const b = 2 * (dx * direction.x + dy * direction.y);
  const c = dx * dx + dy * dy - circle.radius * circle.radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) {
    return null;
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDiscriminant) / 2;
  const t2 = (-b + sqrtDiscriminant) / 2;
  const t = t1 > 0 ? t1 : t2 > 0 ? t2 : null;

  if (t === null || t > maxDistance) {
    return null;
  }

  return {
    distance: t,
    point: {
      x: origin.x + direction.x * t,
      y: origin.y + direction.y * t,
    },
  };
}

function rayRectIntersection(origin, direction, rect, maxDistance) {
  const minX = rect.x;
  const maxX = rect.x + rect.width;
  const minY = rect.y;
  const maxY = rect.y + rect.height;

  const invDx = direction.x !== 0 ? 1 / direction.x : Number.POSITIVE_INFINITY;
  const invDy = direction.y !== 0 ? 1 / direction.y : Number.POSITIVE_INFINITY;

  const tx1 = (minX - origin.x) * invDx;
  const tx2 = (maxX - origin.x) * invDx;
  const ty1 = (minY - origin.y) * invDy;
  const ty2 = (maxY - origin.y) * invDy;

  const tMin = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2));
  const tMax = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));

  if (tMax < 0 || tMin > tMax) {
    return null;
  }

  const distance = tMin >= 0 ? tMin : tMax;
  if (distance < 0 || distance > maxDistance) {
    return null;
  }

  return {
    distance,
    point: {
      x: origin.x + direction.x * distance,
      y: origin.y + direction.y * distance,
    },
  };
}

function getObjectCenter(object) {
  if (object.shape === "rect") {
    return {
      x: object.x + object.width * 0.5,
      y: object.y + object.height * 0.5,
    };
  }

  return {
    x: object.x,
    y: object.y,
  };
}

function getNearestPointOnRect(origin, rect) {
  return {
    x: clamp(origin.x, rect.x, rect.x + rect.width),
    y: clamp(origin.y, rect.y, rect.y + rect.height),
  };
}

function getNearestPointOnCircle(origin, circle) {
  const dx = circle.x - origin.x;
  const dy = circle.y - origin.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return {
      x: circle.x + circle.radius,
      y: circle.y,
    };
  }

  const scale = Math.max(0, distance - circle.radius) / distance;
  return {
    x: origin.x + dx * scale,
    y: origin.y + dy * scale,
  };
}

function getDistanceToObject(origin, object) {
  const nearestPoint = object.shape === "rect"
    ? getNearestPointOnRect(origin, object)
    : getNearestPointOnCircle(origin, object);

  return {
    nearestPoint,
    distance: Math.hypot(nearestPoint.x - origin.x, nearestPoint.y - origin.y),
  };
}

export class MapSystem {
  constructor() {
    const groundTop = SIMULATION_TUNING.groundY + 8;

    this.ground = makeGround(groundTop);

    this.walls = [
      makeWall("wall-0", 276, 500, 26, this.ground.y - 500),
      makeWall("wall-1", 544, 360, 28, this.ground.y - 360),
      makeWall("wall-2", 840, 246, 26, this.ground.y - 246),
      makeWall("wall-3", 1082, 182, 24, this.ground.y - 182),
      makeWall("ledge-0", 632, 412, 162, 16),
    ];

    this.pegs = [
      makePeg("peg-0", 372, 452, 16),
      makePeg("peg-1", 668, 332, 18),
      makePeg("peg-2", 950, 228, 19),
    ];

    this.foodNodes = [
      makeFood("food-0", 372, 424, 10),
      makeFood("food-1", 668, 302, 10),
      makeFood("food-2", 950, 198, 10),
      makeFood("food-3", 208, this.ground.y - 18, 9),
    ];

    this.staticSensorObjects = [this.ground, ...this.walls, ...this.pegs, ...this.foodNodes];
    this.staticSensorIndex = createSpatialIndex(this.staticSensorObjects, SENSOR_TUNING.spatialHashCellSize);
  }

  getRenderState() {
    return {
      ground: this.ground,
      walls: this.walls,
      pegs: this.pegs,
      foodNodes: this.foodNodes,
    };
  }

  getStaticSensorCandidates(position, radius) {
    return querySpatialIndex(
      this.staticSensorIndex,
      position,
      radius,
      SENSOR_TUNING.spatialHashCellSize
    );
  }

  buildDynamicSensorIndex(objects) {
    return createSpatialIndex(objects, SENSOR_TUNING.spatialHashCellSize);
  }

  getDynamicSensorCandidates(index, position, radius) {
    return querySpatialIndex(index, position, radius, SENSOR_TUNING.spatialHashCellSize);
  }

  createDynamicSensorObjects(ants, queen) {
    const queenObject = {
      id: "queen",
      sourceType: "queen",
      sourceId: "queen",
      type: "queen",
      shape: "circle",
      x: queen.position.x,
      y: queen.position.y,
      radius: SENSOR_TUNING.queenSenseRadius,
      occludesVision: false,
      sensorColorScalar: SENSOR_TUNING.colorRange.queen,
    };

    const antObjects = ants.map((ant) => ({
      id: `ant-${ant.id}`,
      sourceType: "ant",
      sourceId: ant.id,
      type: "ant",
      shape: "circle",
      x: ant.position.x,
      y: ant.position.y - 8,
      radius: SENSOR_TUNING.antSenseRadius,
      occludesVision: false,
      sensorColorScalar: SENSOR_TUNING.colorRange.ant,
    }));

    return [queenObject, ...antObjects];
  }

  getNearestPointOnObject(origin, object) {
    return object.shape === "rect"
      ? getNearestPointOnRect(origin, object)
      : getNearestPointOnCircle(origin, object);
  }

  getDistanceToObject(origin, object) {
    return getDistanceToObject(origin, object);
  }

  getObjectCenter(object) {
    return getObjectCenter(object);
  }

  getSensorSamplePoints(origin, object) {
    if (object.type === "ground") {
      return [this.getNearestPointOnObject(origin, object)];
    }

    if (object.shape === "circle") {
      return [
        this.getNearestPointOnObject(origin, object),
        this.getObjectCenter(object),
        { x: object.x + object.radius, y: object.y },
        { x: object.x - object.radius, y: object.y },
        { x: object.x, y: object.y + object.radius },
        { x: object.x, y: object.y - object.radius },
      ];
    }

    return [
      this.getNearestPointOnObject(origin, object),
      this.getObjectCenter(object),
      { x: object.x, y: object.y },
      { x: object.x + object.width, y: object.y },
      { x: object.x, y: object.y + object.height },
      { x: object.x + object.width, y: object.y + object.height },
      { x: object.x + object.width * 0.5, y: object.y },
      { x: object.x + object.width * 0.5, y: object.y + object.height },
      { x: object.x, y: object.y + object.height * 0.5 },
      { x: object.x + object.width, y: object.y + object.height * 0.5 },
    ];
  }

  isWallOccluding(origin, targetPoint, targetDistance, nearbyWalls, ignoreWallId = null) {
    if (targetDistance <= 0) {
      return false;
    }

    const direction = {
      x: (targetPoint.x - origin.x) / targetDistance,
      y: (targetPoint.y - origin.y) / targetDistance,
    };

    for (const wall of nearbyWalls) {
      if (wall.id === ignoreWallId) {
        continue;
      }

      const hit = rayRectIntersection(origin, direction, wall, targetDistance);
      if (hit && hit.distance < targetDistance - 0.75) {
        return true;
      }
    }

    return false;
  }

  sampleFoodScentAt(position) {
    let totalScent = 0;

    for (const foodNode of this.foodNodes) {
      const dx = foodNode.x - position.x;
      const dy = foodNode.y - position.y;
      const distance = Math.hypot(dx, dy);
      if (distance === 0 || distance > SENSOR_TUNING.localFoodScentRange) {
        continue;
      }

      totalScent += 1 - distance / SENSOR_TUNING.localFoodScentRange;
    }

    return Math.min(1, totalScent);
  }

  constrainHorizontalMovement(ant, nextX) {
    let resolvedX = nextX;

    for (const wall of this.walls) {
      const blocksGroundLane = ant.movement.groundY >= wall.y - ANT_TUNING.collisionRadius &&
        ant.movement.groundY <= wall.y + wall.height + ANT_TUNING.collisionRadius;

      if (!blocksGroundLane) {
        continue;
      }

      const minX = wall.x - ANT_TUNING.collisionRadius;
      const maxX = wall.x + wall.width + ANT_TUNING.collisionRadius;

      if (resolvedX >= minX && resolvedX <= maxX) {
        resolvedX = ant.facing > 0 ? minX : maxX;
      }
    }

    return Math.max(24, Math.min(WORLD_WIDTH - 24, resolvedX));
  }
}
