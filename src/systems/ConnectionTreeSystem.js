import { CONNECTION_TREE_TUNING, CORPSE_TUNING } from "../config/tuning.js";

function roundWeight(value) {
  return Math.round(value * 1000) / 1000;
}

function cloneBrainLayers(layers) {
  return (layers ?? []).map((layer) => ({
    activation: layer.activation,
    weights: layer.weights.map((row) => [...row]),
    biases: [...layer.biases],
  }));
}

function snapshotAntGenome(ant, contributor) {
  return {
    antId: ant.id,
    weight: roundWeight(contributor.weight),
    role: contributor.role,
    depth: contributor.depth,
    isCorpse: contributor.isCorpse ?? false,
    genomeSnapshot: {
      brainLayers: cloneBrainLayers(ant.brain?.layers ?? []),
      traits: { ...ant.traits },
    },
  };
}

function makeContributorEntry(antId, weight, role, depth, isCorpse = false) {
  return {
    antId,
    weight: roundWeight(weight),
    role,
    depth,
    isCorpse,
  };
}

function isCorpseAnt(ant) {
  return ant?.state === "dead" || ant?.state === "decaying";
}

function clampCorpseInfluence(contributors, capRatio = CORPSE_TUNING.genomeInfluenceCap) {
  const livingWeight = contributors
    .filter((contributor) => !contributor.isCorpse)
    .reduce((sum, contributor) => sum + contributor.weight, 0);
  const corpseWeight = contributors
    .filter((contributor) => contributor.isCorpse)
    .reduce((sum, contributor) => sum + contributor.weight, 0);

  if (corpseWeight <= 0 || livingWeight <= 0 || capRatio <= 0 || capRatio >= 1) {
    return contributors.map((contributor) => ({ ...contributor, weight: roundWeight(contributor.weight) }));
  }

  const maxCorpseWeight = (livingWeight * capRatio) / (1 - capRatio);
  if (corpseWeight <= maxCorpseWeight) {
    return contributors.map((contributor) => ({ ...contributor, weight: roundWeight(contributor.weight) }));
  }

  const corpseScale = maxCorpseWeight / corpseWeight;
  return contributors.map((contributor) => ({
    ...contributor,
    weight: roundWeight(contributor.isCorpse ? contributor.weight * corpseScale : contributor.weight),
  }));
}

function clonePack(pack) {
  return {
    packIndex: pack.packIndex,
    obtainerId: pack.obtainerId,
    baseType: pack.baseType,
    baseId: pack.baseId,
      contributors: (pack.contributors ?? []).map((contributor) => ({
        antId: contributor.antId,
        weight: contributor.weight,
        role: contributor.role,
        depth: contributor.depth,
        isCorpse: contributor.isCorpse ?? false,
        genomeSnapshot: contributor.genomeSnapshot
          ? {
            brainLayers: cloneBrainLayers(contributor.genomeSnapshot.brainLayers),
            traits: { ...contributor.genomeSnapshot.traits },
          }
        : null,
    })),
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
          0,
          false
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

      const isCorpse = isCorpseAnt(supportAnt);
      const adjustedWeight = isCorpse
        ? weight * this.#getCorpseWeightMultiplier(supportAnt)
        : weight;

      contributors.push(
        makeContributorEntry(supportAnt.id, adjustedWeight, isCorpse ? "corpse-support" : "support", depth, isCorpse)
      );
      seenAntIds.add(supportAnt.id);
      currentAnt = supportAnt;
      baseType = currentAnt.movement?.supportType ?? "ant";
      baseId = currentAnt.movement?.supportId ?? currentAnt.id;
    }

    const cappedContributors = clampCorpseInfluence(contributors);

    return {
      obtainerId: obtainer.id,
      contributors: cappedContributors,
      baseType,
      baseId,
      acquisitionCount: 1,
    };
  }

  mergePayload(existingPayload, contributionPath, ants) {
    const antById = new Map(ants.map((ant) => [ant.id, ant]));
    const acquisitionPack = {
      packIndex: existingPayload?.acquisitionPacks?.length ?? 0,
      obtainerId: contributionPath.obtainerId,
      baseType: contributionPath.baseType,
      baseId: contributionPath.baseId,
      contributors: clampCorpseInfluence(
        contributionPath.contributors
        .map((contributor) => {
          const ant = antById.get(contributor.antId);
          return ant ? snapshotAntGenome(ant, contributor) : null;
        })
        .filter(Boolean)
      ),
    };

    const merged = {
      acquisitionCount: (existingPayload?.acquisitionCount ?? 0) + 1,
      acquisitionPacks: [
        ...(existingPayload?.acquisitionPacks ?? []).map((pack) => clonePack(pack)),
        acquisitionPack,
      ],
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
        isCorpse: contributor.isCorpse ?? false,
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
        isCorpse: contributor.isCorpse ?? false,
      });
    }

    const contributors = clampCorpseInfluence(Array.from(merged.contributors.values())
      .map((entry) => ({
        antId: entry.antId,
        weight: entry.weight,
        roles: Array.from(entry.roles),
        touches: entry.touches,
        isCorpse: entry.isCorpse ?? false,
      })))
      .sort((left, right) => right.weight - left.weight || left.antId - right.antId);

    return {
      acquisitionCount: merged.acquisitionCount,
      acquisitionPacks: merged.acquisitionPacks,
      contributors,
      latestPath: merged.latestPath,
    };
  }

  buildSpawnPlan(payload, totalCount, random) {
    const packs = (payload?.acquisitionPacks ?? []).filter((pack) => (pack.contributors?.length ?? 0) > 0);
    if (!packs.length || totalCount <= 0) {
      return [];
    }

    const plan = [];
    const basePerPack = Math.floor(totalCount / packs.length);
    let remainder = totalCount % packs.length;

    for (const pack of packs) {
      const targetCount = basePerPack + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);

      for (let index = 0; index < targetCount; index += 1) {
        const selected = this.#pickContributorFromPack(pack, random);
        if (!selected) {
          continue;
        }

        plan.push({
          antId: selected.antId,
          weight: selected.weight,
          role: selected.role,
          depth: selected.depth,
          packIndex: pack.packIndex,
          genomeSnapshot: selected.genomeSnapshot
            ? {
                brainLayers: cloneBrainLayers(selected.genomeSnapshot.brainLayers),
                traits: { ...selected.genomeSnapshot.traits },
              }
            : null,
        });
      }
    }

    return plan;
  }

  pickGenomeSource(payload, random) {
    const weightedContributors = [];

    for (const pack of payload?.acquisitionPacks ?? []) {
      for (const contributor of pack.contributors ?? []) {
        weightedContributors.push(contributor);
      }
    }

    if (!weightedContributors.length) {
      const contributors = payload?.contributors ?? [];
      if (!contributors.length) {
        return null;
      }

      return {
        antId: contributors[0].antId,
        weight: contributors[0].weight,
      };
    }

    const totalWeight = weightedContributors.reduce((sum, contributor) => sum + contributor.weight, 0);
    if (totalWeight <= 0) {
      const fallback = weightedContributors[0];
      return {
        antId: fallback.antId,
        weight: fallback.weight,
        genomeSnapshot: fallback.genomeSnapshot,
      };
    }

    let roll = random() * totalWeight;
    for (const contributor of weightedContributors) {
      roll -= contributor.weight;
      if (roll <= 0) {
        return {
          antId: contributor.antId,
          weight: contributor.weight,
          genomeSnapshot: contributor.genomeSnapshot,
        };
      }
    }

    const fallback = weightedContributors[weightedContributors.length - 1];
    return {
      antId: fallback.antId,
      weight: fallback.weight,
      genomeSnapshot: fallback.genomeSnapshot,
    };
  }

  #pickContributorFromPack(pack, random) {
    const contributors = pack.contributors ?? [];
    if (!contributors.length) {
      return null;
    }

    const totalWeight = contributors.reduce((sum, contributor) => sum + contributor.weight, 0);
    if (totalWeight <= 0) {
      return contributors[0];
    }

    let roll = random() * totalWeight;
    for (const contributor of contributors) {
      roll -= contributor.weight;
      if (roll <= 0) {
        return contributor;
      }
    }

    return contributors[contributors.length - 1];
  }

  #getSupportWeight(depth) {
    const index = Math.max(0, depth - 1);
    return CONNECTION_TREE_TUNING.supportDepthWeights[index] ?? 0;
  }

  #getCorpseWeightMultiplier(ant) {
    return ant?.state === "decaying"
      ? ant.corpse?.decayingContributorWeightMultiplier ?? CORPSE_TUNING.decayingContributorWeightMultiplier
      : ant.corpse?.deadContributorWeightMultiplier ?? CORPSE_TUNING.deadContributorWeightMultiplier;
  }
}
