# SESSION_NOTES.md

## Session Purpose

This note is a restart-safe handoff for the current state of the ANTZ repository and the local developer workflow.

Primary goals covered across this session arc:
- stabilize the local Codex + terminal toolchain
- add repo-level workflow helpers and spellcheck
- complete Phase 5 physics constraints and polish
- complete Phase 6 food loop
- complete Phase 7 food scent map
- complete Phase 8 connection tree + rewards
- complete Phase 9 queen / reproduction / season lifecycle
- continue through Phase 10 traits + mutation work
- move into Phase 11 death / recycling implementation and tuning

## Project Snapshot

- Repository: `d:\dev\ANTZ`
- Project: browser-based 2D ant colony simulation with emergent structure building
- Current documented phase: `Phase 11 - Death + Recycling In Progress`
- Current working focus: `test the newest queen throughput / reward tuning after corpse recycling became highly productive`

Key design constraints still in effect:
- keep simulation logic decoupled from rendering
- build only one phase at a time
- keep neural-net logic isolated
- avoid jumping ahead into future-phase mechanics except for small hooks
- favor readable, stable behavior over overcomplicated realism

## Workflow / Tooling State

Healthy shared CLI stack:
- `git`
- `node`
- `npm`
- `gh`
- `rg`
- `fd`
- `jq`
- `bat`

Important workflow additions now in the repo:
- [WORKFLOW.md](/d:/dev/ANTZ/WORKFLOW.md)
- [.editorconfig](/d:/dev/ANTZ/.editorconfig)
- [.gitattributes](/d:/dev/ANTZ/.gitattributes)
- [.gitignore](/d:/dev/ANTZ/.gitignore)
- [.gitmessage](/d:/dev/ANTZ/.gitmessage)
- [tooling/check-cli.js](/d:/dev/ANTZ/tooling/check-cli.js)
- [tooling/gh-status.js](/d:/dev/ANTZ/tooling/gh-status.js)
- [tooling/phase5-smoke.js](/d:/dev/ANTZ/tooling/phase5-smoke.js)
- [cspell.json](/d:/dev/ANTZ/cspell.json)
- [.cspell/antz-words.txt](/d:/dev/ANTZ/.cspell/antz-words.txt)

Useful commands:

```powershell
npm run tools:check
npm run gh:status
npm run spellcheck
npm run test:phase5
```

Current verification state:
- `tools:check` passes for the required stack
- `gh:status` works and GitHub auth is configured
- repo spellcheck passes
- Phase 5 smoke suite passes
- browser display controls for `Normal` / `No Display` / `Headless` / `Batch` are working
- syntax checks passed on the latest tuning, lifecycle, food, and renderer edits

## Current Codebase State

Important current files and modules:
- `src/main.js`
- `src/config/tuning.js`
- `src/ai/NeuralNet.js`
- `src/entities/Ant.js`
- `src/entities/Queen.js`
- `src/systems/SimulationController.js`
- `src/systems/SensorSystem.js`
- `src/systems/BrainSystem.js`
- `src/systems/MovementSystem.js`
- `src/systems/AttachmentSystem.js`
- `src/systems/PhysicsSystem.js`
- `src/systems/FoodSystem.js`
- `src/systems/FoodScentSystem.js`
- `src/systems/ConnectionTreeSystem.js`
- `src/systems/MapSystem.js`
- `src/render/WorldRenderer.js`
- `src/render/AntView.js`
- `src/render/AntSpriteLibrary.js`

## Current Phase Snapshot

Phase 11 is underway and no longer just planned.

Built during this phase so far:
- explicit corpse lifecycle state/timing data on ants
- `dead` and `decaying` visuals with readable black / green states
- inert corpse support participation in attachment / movement / physics handling
- corpse falling in some circumstances
- corpse harvesting as recyclable food
- corpse payloads showing in debug as `payload corpse`
- corpse gene influence discounted/capped in connection-tree packing
- no postmortem reward contribution
- actual corpse cleanup after decay ends
- queen meal nutrition buffering so corpse deliveries count as half a spawn unit
- a small random queen-spawn chance during meal births
- stronger normal map-food reward relative to corpse-food

Current tuning direction:
- keep death/recycling fun and legible
- prevent corpse-heavy runs from turning into a perpetual ant machine
- preserve a reason to pursue real map food instead of treating corpses as the whole economy

Key live values now include:
- `antCount = 20`
- `maxSpeed = 82`
- `mealWeight = 40`
- `foodDeliveryWeight = 30`
- `rewardContributionWeight = 100`
- `spawnOnFeedMin = 0`
- `spawnOnFeedMax = 2`
- `corpseSpawnNutritionValue = 0.5`
- `normalFoodRewardMultiplier = 1.75`
- `randomSpawnChance = 0.08`
- `baseLifespanSeconds = 45`
- `maxFallsBeforeDeath = 10`

## Notable Implementation Notes

- The queen now tracks delivered food, eaten food, meal queue, spawn queue, pending genome pool, spawn nutrition buffer, and spawn history separately.
- Delivered food payloads are archived compactly for season-to-season reuse rather than storing a full colony replay.
- Queen spawning from meals is no longer a direct `delivery -> full spawn count` relationship.
- Corpse deliveries now add half a spawn unit, while full food still adds a full spawn unit.
- Queen meal spawns can occasionally inject a fresh random ant instead of always drawing from a meal-derived contributor.
- Renderer ant views rebuild when a season reset swaps in a fresh ant array.

## Most Recent Observations

- the sim now produces a fun corpse conveyor belt and a mass grave near the queen
- ants visibly carry corpse-derived food on their backs
- corpse cleanup is now real, so finished bodies leave the world
- queen overproduction remains the main active tuning issue
- the latest local tuning is meant to damp corpse-driven spawning and make normal food more rewarding than corpse-food

## Remaining Near-Term Work

Most likely next step:
- test the latest local queen throughput tuning in `src/config/tuning.js`

Likely follow-ups after that:
- decide whether queen meal throughput still needs further reduction under corpse-heavy runs
- decide whether normal map food is now rewarded enough compared with corpse food
- decide whether the random queen-spawn trickle is worth keeping or should be tuned again
- keep watching whether the stronger death/recycling loop changes learning pressure in useful ways

## Session Close Summary

Built or completed:
- local workflow/tooling modernization
- repo spellcheck setup
- Phase 5 physics constraints and polish
- Phase 6 food loop
- Phase 7 food scent map with wind drift
- Phase 8 connection tree + rewards with packed food genomes and queued spawning
- Phase 9 queen / reproduction / season lifecycle with death and rollover
- Phase 10 mutation activation, first inheritable trait pass, browser speed controls, tracked-ant fitness HUD, per-ant fall-death rule, and faster locomotion tuning
- Phase 11 corpse lifecycle, corpse harvesting, corpse genome contribution, corpse cleanup, and queen nutrition-buffer tuning

Assumptions made:
- compact season payload archives are preferable to storing full colony histories
- mutation should start mild rather than dramatic
- a dedicated dead / decaying sprite is better than special render rotation logic
- strong temporary tuning is acceptable if it helps bootstrap readable behavior and can later be dialed back

Remaining next:
- decide whether the current queen tuning finally slows runaway reproduction enough
- decide whether normal map food now has enough advantage over corpse food
- decide whether `randomSpawnChance = 0.08` is worth keeping
