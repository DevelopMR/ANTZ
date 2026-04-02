import { ANT_TUNING, MAP_TUNING, SIMULATION_TUNING, WORLD_WIDTH } from "../config/tuning.js";

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
    color: MAP_TUNING.wallColor,
    colorRgb: [0.62, 0.47, 0.29],
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
    color: MAP_TUNING.pegColor,
    colorRgb: [0.48, 0.34, 0.2],
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
    color: MAP_TUNING.foodColor,
    colorRgb: [0.31, 0.54, 0.23],
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

  let tx1 = (minX - origin.x) * invDx;
  let tx2 = (maxX - origin.x) * invDx;
  let ty1 = (minY - origin.y) * invDy;
  let ty2 = (maxY - origin.y) * invDy;

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

export class MapSystem {
  constructor() {
    this.ground = {
      y: SIMULATION_TUNING.groundY + 8,
      color: MAP_TUNING.groundColor,
    };

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

    this.sensorObjects = [...this.walls, ...this.pegs, ...this.foodNodes];
  }

  getRenderState() {
    return {
      ground: this.ground,
      walls: this.walls,
      pegs: this.pegs,
      foodNodes: this.foodNodes,
    };
  }

  castRay(origin, angle, maxDistance) {
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    let closestHit = null;

    for (const object of this.sensorObjects) {
      const hit = object.shape === "rect"
        ? rayRectIntersection(origin, direction, object, maxDistance)
        : rayCircleIntersection(origin, direction, object, maxDistance);

      if (!hit) {
        continue;
      }

      if (!closestHit || hit.distance < closestHit.distance) {
        closestHit = {
          ...hit,
          object,
          angle,
          direction,
        };
      }
    }

    return closestHit;
  }

  sampleFoodScent(origin, angle, maxDistance) {
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    let totalScent = 0;

    for (const foodNode of this.foodNodes) {
      const dx = foodNode.x - origin.x;
      const dy = foodNode.y - origin.y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxDistance || distance === 0) {
        continue;
      }

      const alignment = (dx * direction.x + dy * direction.y) / distance;
      if (alignment <= 0) {
        continue;
      }

      totalScent += alignment * (1 - distance / maxDistance);
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
