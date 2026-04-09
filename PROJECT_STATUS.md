# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 8 - Connection Tree + Rewards Complete

## Phase Goal
Phase 8 turned successful food acquisition into the first real evolution reward pipeline. The completed phase now:
- traces a simple direct support path from the obtaining ant toward ground or wall
- records weighted contributors from that path
- stores those contributors as genetic packs on the food itself
- preserves and extends that payload if food is dropped and re-grabbed
- queues queen spawning separately from food delivery
- converts queued food into spaced-out offspring using balanced pack-aware selection

## What Was Built
- added a dedicated `ConnectionTreeSystem`
- resolved a direct reward path from the obtaining ant down its support chain
- weighted obtainer and support-depth contribution in centralized tuning
- added real `acquisitionPacks` to food payloads, including packed brain layers and trait snapshots
- merged repeated grabs of the same food into the payload as additional packs
- moved queen reproduction to a queue-driven spawn flow instead of instant burst spawning at delivery time
- added a spawn cooldown so multiple deliveries can stack without blocking food carriers
- balanced spawn planning across acquisition packs before weighted per-pack genome selection
- made spawned ants inherit packed genome snapshots with light mutation to brain and movement traits
- curated the early map so the first elevated foods push more climbing / structure pressure
- cleaned up the main debug layout into separate Inputs / Outputs / Tracked Ant / Scenario blocks

## Verification
Current checks passing:
- `node --check` on modified Phase 8 systems
- headless `SimulationController` tick
- `npm run spellcheck`

Observed in-browser behavior confirmed during this phase:
- food pickup / carry / delivery loop remained active after reward integration
- reward-path context appears in the tracked carrier debug
- payload packs are being created and carried with the food
- queen food queue converts deliveries into delayed spawns over time
- offspring continue spawning while the simulation remains stable
- elevated foods now bias the colony toward higher climbing / support attempts
- reorganized debug layout is easier to read during live observation

## Explicit Non-Goals (Still Not Implemented)
- full lateral / delta structural credit
- complex continuous graph solving every frame
- final reproduction policy and queen progression rules
- broader trait system beyond the current inherited movement hooks
- pheromone map simulation
- death / recycling systems

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, grasp-leg, food-carry, and lineage state
- Queen entity with delivery totals, queued spawn state, and pending genome pool debug
- NeuralNet feedforward module with clone + mutate support
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, free-stack collapse, and carrier return motion
- AttachmentSystem for poll-based grasp negotiation plus carrier release-for-food handling
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- FoodSystem for pickup, depletion, carry, drop, delivery, and queue handoff
- FoodScentSystem for scent field update, drift, and scalar sampling
- ConnectionTreeSystem for support-path resolution, payload packing, and spawn-plan generation
- Rendering layer with tracked-ant support / leg / reward / queen queue debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current return-to-queen logic is still scripted rather than learned
- reward attribution is intentionally simple and only follows the direct support path
- equal division across acquisition packs may preserve diversity at the cost of some short-term selection sharpness
- stronger long-run scent-driven behavior is still expected to emerge later through evolution

## Warning Predictions
These are not blockers, but they should be watched in later analysis:
- reward fairness may under-credit ants that mattered physically without being in the direct traced chain
- queue readability may need stronger visualization if spawn delays are increased later
- pack balancing may feel flatter than expected if very strong and very weak packs are forced into equal shares
- current mutation strength may need retuning once longer-run lineage drift is observable
- richer pack / spawn debug may become necessary if parent-selection fairness is questioned

## Environment Status
- core workflow toolchain is healthy: `git`, `node`, `npm`, `gh`, `rg`, `fd`, `jq`, `bat`
- repo spellcheck is configured and passing
- GitHub CLI auth is configured for regular GitHub-based workflow
- shared workflow scripts exist for tool checking, GitHub status, spellcheck, and Phase 5 smoke tests

## Next Phase
Phase 9 - Queen and Reproduction

Primary focus for the next phase:
- define the queen's actual eating / processing behavior beyond simple queue timing
- shape reproduction policy and cadence more explicitly
- clarify how queued food becomes colony growth over time
- preserve the currently working reward packs and queued spawn plumbing while making queen behavior more intentional

## Immediate Next Actions
1. Re-read `AGENTS.md` and `ARCHITECTURE.md` before starting queen / reproduction work
2. Plan how queen processing differs from the current queue placeholder timing
3. Decide what belongs to queen policy vs what remains in generic food / reward systems
4. Add any debug needed to watch queen-side processing before tuning too aggressively

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context
