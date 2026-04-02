import { SENSOR_TUNING } from "../config/tuning.js";

function normalizeAngle(angle) {
  while (angle < 0) {
    angle += Math.PI * 2;
  }
  while (angle >= Math.PI * 2) {
    angle -= Math.PI * 2;
  }
  return angle;
}

export class SensorSystem {
  update(ants, mapSystem) {
    for (const ant of ants) {
      this.#sampleAnt(ant, mapSystem);
    }
  }

  #sampleAnt(ant, mapSystem) {
    const facingOffset = ant.facing > 0 ? 0 : Math.PI;
    const rays = [];
    const wedges = [];

    for (let wedgeIndex = 0; wedgeIndex < SENSOR_TUNING.wedgeCount; wedgeIndex += 1) {
      const wedgeCenter = SENSOR_TUNING.wedgeCenters[wedgeIndex];
      const localAngles = [wedgeCenter - Math.PI / 12, wedgeCenter + Math.PI / 12];
      const wedgeHits = [];

      for (const localAngle of localAngles) {
        const worldAngle = normalizeAngle(localAngle + facingOffset);
        const hit = mapSystem.castRay(ant.position, worldAngle, SENSOR_TUNING.maxDistance);
        const proximity = hit ? 1 - hit.distance / SENSOR_TUNING.maxDistance : 0;
        const color = hit ? hit.object.colorRgb : [0, 0, 0];
        rays.push({
          angle: worldAngle,
          localAngle: normalizeAngle(localAngle),
          hit,
          proximity,
          color,
        });
        wedgeHits.push({ proximity, color });
      }

      const closestProximity = wedgeHits.reduce(
        (maxProximity, ray) => Math.max(maxProximity, ray.proximity),
        0
      );
      const avgColor = wedgeHits.reduce(
        (sum, ray) => [sum[0] + ray.color[0], sum[1] + ray.color[1], sum[2] + ray.color[2]],
        [0, 0, 0]
      ).map((channel) => channel / wedgeHits.length);
      const scent = mapSystem.sampleFoodScent(ant.position, normalizeAngle(wedgeCenter + facingOffset), SENSOR_TUNING.scentRange);

      wedges.push({
        index: wedgeIndex,
        name: SENSOR_TUNING.wedgeNames[wedgeIndex],
        localAngle: wedgeCenter,
        proximity: closestProximity,
        color: avgColor,
        scent,
        pheromone: 0,
      });
    }

    ant.sensorState = {
      wedges,
      rays,
      scalars: {
        speed: Math.min(1, Math.abs(ant.velocity.x) / 60),
        attached: ant.attached ? 1 : 0,
        connectionCount: Math.min(1, ant.connectionIds.length / 4),
      },
    };
  }
}
