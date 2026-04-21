# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 11 - Death + Recycling In Progress

## Next Planned Phase
Phase 11 - Death + Recycling

The roadmap has been reordered so death/recycling now comes before the pheromone system. The goal is to add a stronger resource-recovery loop before introducing another navigation signal.

## Phase 11 Planning Snapshot
Agreed implementation shape for `Death + Recycling`:
- add explicit ant lifecycle stages: `dead`, `decaying`, then remove from world at `gone`
- dead and decaying ants are inert exoskeletons with no brain activity, no new fitness gain, and no active resistance
- unsupported corpses fall to the next stable resting location and then remain physically support-capable
- grasped corpses can remain in structures and support normal ant loads
- corpse visuals stay present through the full decay window
- corpse harvesting yields a single green food-unit style carry load; the carrier heals first and then returns one load to the queen
- dead and decaying ants may still appear in connection-tree genome packing, but under weight-based caps so they do not dominate
- corpse-derived food may contribute up to `20%` additional genetic influence when consumed
- future pheromone work gets a death-scent hook using a power-curve decay, but that signal stays internal for this phase

Planned first implementation slice:
- Step 1: add corpse lifecycle state and timing data to `Ant` plus centralized tuning values

## Phase Goal
Phase 11 is adding the corpse lifecycle and recycling loop on top of the existing seasonal/evolution systems. The current focus is to:
- keep dead and decaying ants in the world as inert support-capable bodies
- allow unsupported corpses to fall and settle physically
- let living ants harvest corpses as one-load green food returns to the queen
- preserve corpse gene influence in payloads, but under corpse-weight caps
- keep corpse visuals readable and fun while postponing final removal/cleanup spectacle to later slices

## What Was Built
- turned on selective mutation for half of fitness-clone offspring and half of season-pack offspring
- added inheritable traits for forward drive, grasp drive, interaction drive, climb commitment, carry caution, grasp hold bias, stability bias, and support preference bias
- packed the full current trait set into connection-tree food payload genome snapshots
- threaded the new traits into attachment, food pickup, carry-return, and climb-selection behavior conservatively
- added temporary automated verification for trait inheritance and mutation, then removed the one-off harness after validation
- added simulation display controls: `Normal`, `No Display`, `Headless`, and `Batch`
- added a season chip beside the `Ant Sim` title for faster long-run reading
- added tracked-ant `Fitness` display in the rightmost top debug column
- sorted food nodes into learning order from left to right and bottom to top, and sorted other map objects left to right for future discovery/index experiments
- added per-ant fall counting and a configurable fall-death rule
- increased horizontal ant locomotion substantially for faster left/right travel
- preserved prior queen queueing, death, season rollover, lineage, and debug systems from Phase 9
- added explicit corpse lifecycle state and timing data on ants
- added `dead` to `decaying` progression with a future death-scent hook and pending-removal marker
- added distinct corpse visuals: black dead icon and greenish decaying icon
- kept corpses in physics/support evaluation as inert exoskeletons
- allowed corpses to fall and settle in some circumstances while still persisting in-world
- added corpse harvesting as a one-load food source that heals the carrier and returns one unit to the queen
- added corpse debug counters such as `corpse food`, `corpse spent`, and `payload corpse`
- added corpse-weighted genome contribution and capped corpse influence in payload packing
- blocked postmortem reward gain for dead and decaying ants

## Verification
Current checks passing:
- `node --check` on modified Phase 10 and Phase 11 systems/UI files
- `node --check` on updated fall-death, corpse, food, movement, and renderer files
- trait inheritance / mutation verification was run successfully before the temporary harness was removed
- browser controls for `Normal` / `No Display` / `Headless` / `Batch` are working and user-verified
- map ordering checks confirmed food index `0` is now the lowest-left reachable food
- aggressive upward-progress tuning pass is now applied in `src/config/tuning.js`
- `npm run spellcheck`

Observed in-browser behavior confirmed during this phase:
- faster season observation is working through the new display / batch controls
- mutation-enabled colonies still run stably after the first inheritable-trait pass
- food, queen processing, season rollover, and reproduction remain functional with traits enabled
- ants are moving correctly under the newer speed tuning
- corpse conveyor-belt behavior is now visible and fun
- mass graves of decaying ants can form near the queen
- ants can visibly carry corpse-derived food back to the queen
- however, even after `50+` seasons there was still not much visible learned "thinking" behavior

## Explicit Non-Goals (Still Not Implemented)
- pheromone map simulation
- final corpse removal / cleanup spectacle after decay ends
- cutscenes or more theatrical season transitions
- later map progression / campaign structure
- a true detached offline batch runner outside the browser loop
- discovery-index or partial-world collision / sensor optimization based on season knowledge

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, food-carry, lifespan, corpse state, season fitness, and inheritable trait state
- Queen entity with food delivery totals, FIFO meal queue, delayed spawn queue, pending genome pool, and spawn history
- NeuralNet feedforward module with clone + mutate support
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, free-stack collapse, carrier return, and trait-influenced climb choice
- AttachmentSystem for poll-based grasp negotiation plus trait-influenced grasp/hold behavior
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- FoodSystem for pickup, depletion, carry, drop, delivery, healing, and queen queue handoff
- FoodScentSystem for scent field update, drift, and scalar sampling
- ConnectionTreeSystem for support-path resolution, payload packing, trait snapshot packing, and spawn-plan generation
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

## Warning Predictions
These are not blockers, but they should be watched in later analysis:
- current fitness weighting may still bias toward easy-food farming unless upward progress rewards are pushed harder
- much faster horizontal motion could amplify noise and make weak policies look busy rather than intelligent
- the new fall-death rule could punish unstable experimentation before useful scaffold behavior takes hold
- direct support-path credit may still miss structurally meaningful ants outside the traced chain
- stronger reward and spawn tuning could overfit ants to the current handcrafted map if left in place too long
- mutation is now live, so too much extra tuning stacked on top could make causality harder to read
- dynamic dropped food prevents naive `first N food indexes only` optimizations from staying correct
- a later return to a more natural struggle will probably require dialing back the temporary upward-progress boosts

## Environment Status
- core workflow toolchain is healthy: `git`, `node`, `npm`, `gh`, `rg`, `fd`, `jq`, `bat`
- repo spellcheck is configured and passing
- GitHub CLI auth is configured for regular GitHub-based workflow
- shared workflow scripts exist for tool checking, GitHub status, spellcheck, and Phase 5 smoke tests

## Current Tuning Intent
The aggressive upward-progress tuning pass is now live in `src/config/tuning.js`. The goal is to make upward progress fun and obvious first, then later dial it back if the colony becomes too efficient.

Applied boost profile:
- `1.` STRONG boost to connection-tree climber reward pressure
- `2.` STRONG boost to direct food-delivery reproductive payoff
- `3.` SMALL boost to survival / lifespan extension pressure
- `4.` MODERATE boost to climbing willingness
- `5.` MODERATE boost to grasp formation / persistence
- `6.` MODERATE boost to selection pressure over random drift

Most important live dial changes:
- `antCount = 50`
- `mealWeight = 40`
- `foodDeliveryWeight = 30`
- `rewardContributionWeight = 100`
- `maxSpeed = 66.24`
- `forwardDrive = 86.4`
- `maxFallsBeforeDeath = 10`
- tracked-ant debug now shows `Fitness`

## Immediate Next Actions
1. Test the local queen spawn-yield reduction now sitting uncommitted in `src/config/tuning.js`
2. Decide whether corpse-driven food inflow still overfeeds the queen after the new spawn-yield cut
3. Continue later Phase 11 slices for corpse cleanup/removal and any larger collapse spectacle
4. Keep watching whether the stronger death/recycling loop changes visible learning pressure in useful ways

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context
