import { CONNECTION_TREE_TUNING } from "../config/tuning.js";

function roundWeight(value) {
  return Math.round(value * 1000) / 1000;
}

function makeContributorEntry(antId, weight, role, depth) {
  return {
    antId,
    weight: roundWeight(weight),
    role,
    depth,
  };
}

export class ConnectionTreeSystem {
  resolveFoodContributionPath(obtainer, ants) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));
    const contributors = [];
    const seenAntIds = new Set();

    contributors.push(
      makeContributorEntry(
        obtainer.id,
        CONNECTION_TREE_TUNING.obtainerWeight,
        "obtainer",
        0
      )
    );
    seenAntIds.add(obtainer.id);

    let currentAnt = obtainer;
    let depth = 0;
    let baseType = currentAnt.movement?.supportType ?? "ground";
    let baseId = currentAnt.movement?.supportId ?? null;

    while (depth < CONNECTION_TREE_TUNING.maxSupportDepth) {
      const supportType = currentAnt.movement?.supportType ?? "none";
      const supportId = currentAnt.movement?.supportId ?? null;

      if (supportType !== "ant" || supportId == null) {
        baseType = supportType;
        baseId = supportId;
        break;
      }

      const supportAnt = antById.get(supportId);
      if (!supportAnt || seenAntIds.has(supportAnt.id)) {
        baseType = "broken";
        baseId = supportId;
        break;
      }

      depth += 1;
      const weight = this.#getSupportWeight(depth);
      if (weight <= 0) {
        baseType = supportAnt.movement?.supportType ?? "ant";
        baseId = supportAnt.movement?.supportId ?? supportAnt.id;
        break;
      }

      contributors.push(
        makeContributorEntry(supportAnt.id, weight, "support", depth)
      );
      seenAntIds.add(supportAnt.id);
      currentAnt = supportAnt;
      baseType = currentAnt.movement?.supportType ?? "ant";
      baseId = currentAnt.movement?.supportId ?? currentAnt.id;
    }

    return {
      obtainerId: obtainer.id,
      contributors,
      baseType,
      baseId,
      acquisitionCount: 1,
    };
  }

  mergePayload(existingPayload, contributionPath) {
    const merged = {
      acquisitionCount: (existingPayload?.acquisitionCount ?? 0) + 1,
      contributors: new Map(),
      latestPath: {
        obtainerId: contributionPath.obtainerId,
        baseType: contributionPath.baseType,
        baseId: contributionPath.baseId,
        contributors: contributionPath.contributors.map((entry) => ({ ...entry })),
      },
    };

    for (const contributor of existingPayload?.contributors ?? []) {
      merged.contributors.set(contributor.antId, {
        antId: contributor.antId,
        weight: contributor.weight,
        roles: new Set(contributor.roles ?? []),
        touches: contributor.touches ?? 1,
      });
    }

    for (const contributor of contributionPath.contributors) {
      const existing = merged.contributors.get(contributor.antId);
      if (existing) {
        existing.weight = roundWeight(existing.weight + contributor.weight);
        existing.roles.add(contributor.role);
        existing.touches += 1;
        continue;
      }

      merged.contributors.set(contributor.antId, {
        antId: contributor.antId,
        weight: contributor.weight,
        roles: new Set([contributor.role]),
        touches: 1,
      });
    }

    const contributors = Array.from(merged.contributors.values())
      .map((entry) => ({
        antId: entry.antId,
        weight: roundWeight(entry.weight),
        roles: Array.from(entry.roles),
        touches: entry.touches,
      }))
      .sort((left, right) => right.weight - left.weight || left.antId - right.antId);

    return {
      acquisitionCount: merged.acquisitionCount,
      contributors,
      latestPath: merged.latestPath,
    };
  }

  pickGenomeSource(payload, random) {
    const contributors = payload?.contributors ?? [];
    if (!contributors.length) {
      return null;
    }

    const totalWeight = contributors.reduce((sum, contributor) => sum + contributor.weight, 0);
    if (totalWeight <= 0) {
      return {
        antId: contributors[0].antId,
        weight: contributors[0].weight,
      };
    }

    let roll = random() * totalWeight;
    for (const contributor of contributors) {
      roll -= contributor.weight;
      if (roll <= 0) {
        return {
          antId: contributor.antId,
          weight: contributor.weight,
        };
      }
    }

    const fallback = contributors[contributors.length - 1];
    return {
      antId: fallback.antId,
      weight: fallback.weight,
    };
  }

  #getSupportWeight(depth) {
    const index = Math.max(0, depth - 1);
    return CONNECTION_TREE_TUNING.supportDepthWeights[index] ?? 0;
  }
}
