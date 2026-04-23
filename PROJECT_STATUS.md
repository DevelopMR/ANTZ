# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 11 - Death + Recycling In Progress

## Next Planned Phase
Phase 10 - Pheromone System

The roadmap has been reordered so `Death + Recycling` now comes before the pheromone system. Phase 11 is already materially underway, and the current work has shifted from implementation-only to tuning the queen/resource loop around corpse recycling.

## Current Working Snapshot
Phase 11 now includes:
- explicit corpse lifecycle stages: `dead`, `decaying`, then removal from the world
- inert corpse physics and structure support
- corpse harvesting as recyclable food
- corpse-weighted genome contribution with caps
- actual corpse cleanup after decay
- queen spawn nutrition buffering so corpse deliveries count as half a spawn unit
- a small random queen-spawn chance to keep meal-born ants from becoming too genetically closed

Current tuning focus:
- reduce runaway queen overproduction
- make normal map food clearly more valuable than corpse-food
- keep corpse recycling fun and visible without letting it dominate the sim

## Phase Goal
Phase 11 is adding the corpse lifecycle and recycling loop on top of the existing seasonal/evolution systems. The current focus is to:
- keep dead and decaying ants in the world as inert support-capable bodies
- allow unsupported corpses to fall and settle physically
- let living ants harvest corpses as recyclable green food returns to the queen
- preserve corpse gene influence in payloads, but under corpse-weight caps
- make finished corpses actually leave the world
- tune the queen food loop so corpse-heavy runs do not turn into a perpetual ant machine

## What Was Built
- turned on selective mutation for half of fitness-clone offspring and half of season-pack offspring
- added inheritable traits for forward drive, grasp drive, interaction drive, climb commitment, carry caution, grasp hold bias, stability bias, and support preference bias
- packed the full current trait set into connection-tree food payload genome snapshots
- threaded the new traits into attachment, food pickup, carry-return, and climb-selection behavior conservatively
- added simulation display controls: `Normal`, `No Display`, `Headless`, and `Batch`
- added a season chip beside the `Ant Sim` title for faster long-run reading
- added tracked-ant `Fitness` display in the rightmost top debug column
- added per-ant fall counting and a configurable fall-death rule
- added explicit corpse lifecycle state and timing data on ants
- added `dead` to `decaying` progression with a future death-scent hook
- added distinct corpse visuals: black dead icon and greenish decaying icon
- kept corpses in physics/support evaluation as inert exoskeletons
- allowed corpses to fall and settle in some circumstances while still acting as structural bodies
- added corpse harvesting as a one-load food source that heals the carrier and returns food to the queen
- added corpse debug counters such as `corpse food`, `corpse spent`, `payload corpse`, and `queen buffer`
- added corpse-weighted genome contribution and capped corpse influence in payload packing
- blocked postmortem reward gain for dead and decaying ants
- added actual corpse cleanup so `removePending` corpses detach and are removed from `simulation.ants`
- added queen spawn nutrition buffering so corpse deliveries only count as half a spawn unit
- added a small random queen meal spawn chance for occasional fresh ants in queen births
- increased normal map-food reward relative to corpse-food reward

## Verification
Current checks passing:
- `node --check` on modified Phase 11 systems/UI files
- `npm run spellcheck`

Observed in-browser behavior confirmed during this phase:
- corpse conveyor-belt behavior is visible and fun
- mass graves of decaying ants can form near the queen before cleanup removes them
- ants can visibly carry corpse-derived food back to the queen
- corpse harvesting is readable and productive
- corpse cleanup is now live, so finished corpses do leave the world
- queen overproduction is still the main tuning issue to watch next

## Explicit Non-Goals (Still Not Implemented)
- pheromone map simulation
- corpse-scent-driven ant behavior
- cutscenes or theatrical season transitions
- later map progression / campaign structure
- a true detached offline batch runner outside the browser loop
- discovery-index or partial-world collision / sensor optimization based on season knowledge

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, food-carry, lifespan, corpse state, season fitness, and inheritable trait state
- Queen entity with food delivery totals, FIFO meal queue, delayed spawn queue, spawn nutrition buffer, pending genome pool, and spawn history
- NeuralNet feedforward module with clone + mutate support
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, free-stack collapse, carrier return, and trait-influenced climb choice
- AttachmentSystem for poll-based grasp negotiation plus trait-influenced grasp/hold behavior
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- FoodSystem for pickup, depletion, carry, drop, delivery, healing, queen queue handoff, and corpse-vs-food reward differentiation
- FoodScentSystem for scent field update, drift, and scalar sampling
- ConnectionTreeSystem for support-path resolution, payload packing, corpse influence capping, and spawn-plan generation
- Rendering layer with tracked-ant debug, scenario season stats, display-mode controls, corpse counters, and season HUD chip

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current return-to-queen logic is still scripted rather than learned
- reward attribution remains intentionally simple and only follows the direct support path
- season archives are compact payload/pack summaries rather than full colony replays
- current batch mode is browser-batch rather than a separate offline runner
- dynamic dropped food means future discovery-index optimizations must treat static and spawned food separately

## Current Tuning Snapshot
Live values in `src/config/tuning.js` now include:
- `SIMULATION_TUNING.antCount = 20`
- `ANT_TUNING.maxSpeed = 82`
- `LIFE_TUNING.baseLifespanSeconds = 45`
- `FOOD_TUNING.spawnOnFeedMin = 0`
- `FOOD_TUNING.spawnOnFeedMax = 2`
- `FOOD_TUNING.corpseSpawnNutritionValue = 0.5`
- `FOOD_TUNING.normalFoodRewardMultiplier = 1.75`
- `FOOD_TUNING.randomSpawnChance = 0.08`
- `CORPSE_TUNING.deadDurationSeconds = 5`
- `CORPSE_TUNING.decayDurationSeconds = 10`
- `FITNESS_TUNING.mealWeight = 40`
- `FITNESS_TUNING.foodDeliveryWeight = 30`
- `FITNESS_TUNING.rewardContributionWeight = 100`

Interpretation of the newest tuning:
- corpse deliveries are still worth carrying, but only two of them make one queen spawn unit
- normal map food now pays substantially better than corpse-food
- queen births can occasionally inject a fresh random ant even during meal-driven spawning

## Immediate Next Actions
1. Test the current local tuning in `src/config/tuning.js`, especially queen throughput under corpse-heavy runs
2. Decide whether `normalFoodRewardMultiplier = 1.75` feels right or still needs movement
3. Decide whether `randomSpawnChance = 0.08` is noticeable enough to keep
4. Continue watching whether the stronger death/recycling loop produces clearer learning pressure

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context
