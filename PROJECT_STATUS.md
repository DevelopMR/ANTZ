# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 10 - Traits + Mutation In Progress

## Next Planned Phase
Phase 11 - Death + Recycling

The roadmap has been reordered so death/recycling now comes before the pheromone system. The goal is to add a stronger resource-recovery loop before introducing another navigation signal.

## Phase Goal
Phase 10 is turning the seasonal colony loop into a true evolutionary system. The current focus is to:
- inherit compact brain snapshots and selected numeric ant traits across seasons
- selectively mutate half of fitness-clone offspring and half of season-pack offspring
- keep trait effects intentionally small and readable while preserving current behavior
- accelerate observation using display-mode controls and faster browser batch stepping
- tune selection pressure toward upward structure building so ants can reach the third food

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

## Verification
Current checks passing:
- `node --check` on modified Phase 10 systems and UI files
- `node --check` on updated fall-death and movement files
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
- however, even after `50+` seasons there was still not much visible learned "thinking" behavior

## Explicit Non-Goals (Still Not Implemented)
- pheromone map simulation
- dead-ant recycling into food
- cutscenes or more theatrical season transitions
- later map progression / campaign structure
- a true detached offline batch runner outside the browser loop
- discovery-index or partial-world collision / sensor optimization based on season knowledge

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, food-carry, lifespan, death, season fitness, and inheritable trait state
- Queen entity with food delivery totals, FIFO meal queue, delayed spawn queue, pending genome pool, and spawn history
- NeuralNet feedforward module with clone + mutate support
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, free-stack collapse, carrier return, and trait-influenced climb choice
- AttachmentSystem for poll-based grasp negotiation plus trait-influenced grasp/hold behavior
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- FoodSystem for pickup, depletion, carry, drop, delivery, healing, and queen queue handoff
- FoodScentSystem for scent field update, drift, and scalar sampling
- ConnectionTreeSystem for support-path resolution, payload packing, trait snapshot packing, and spawn-plan generation
- Rendering layer with tracked-ant debug, scenario season stats, display-mode controls, and season HUD chip

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
1. Observe whether the current reward mix produces any visible learned behavior after long runs
2. Watch whether faster movement improves exploration or just increases chaotic motion
3. Check whether the 10-fall death rule helps selection or suppresses emerging structure attempts
4. Reassess whether fitness, selection pressure, or movement tuning should be softened or redirected next
5. Start Phase 11 as `Death + Recycling` before returning to the pheromone system

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context
