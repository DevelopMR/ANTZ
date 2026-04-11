# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 10 - Traits + Mutation In Progress

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
- sorted food nodes into learning order from left to right and bottom to top, and sorted other map objects left to right for future discovery/index experiments
- preserved prior queen queueing, death, season rollover, lineage, and debug systems from Phase 9

## Verification
Current checks passing:
- `node --check` on modified Phase 10 systems and UI files
- trait inheritance / mutation verification was run successfully before the temporary harness was removed
- browser controls for `Normal` / `No Display` / `Headless` / `Batch` are working and user-verified
- map ordering checks confirmed food index `0` is now the lowest-left reachable food
- `npm run spellcheck`

Observed in-browser behavior confirmed during this phase:
- faster season observation is working through the new display / batch controls
- mutation-enabled colonies still run stably after the first inheritable-trait pass
- food, queen processing, season rollover, and reproduction remain functional with traits enabled

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
- direct support-path credit may still miss structurally meaningful ants outside the traced chain
- stronger reward and spawn tuning could overfit ants to the current handcrafted map if left in place too long
- mutation is now live, so too much extra tuning stacked on top could make causality harder to read
- dynamic dropped food prevents naive “first N food indexes only” optimizations from staying correct
- a later return to a more natural struggle will probably require dialing back the temporary upward-progress boosts

## Environment Status
- core workflow toolchain is healthy: `git`, `node`, `npm`, `gh`, `rg`, `fd`, `jq`, `bat`
- repo spellcheck is configured and passing
- GitHub CLI auth is configured for regular GitHub-based workflow
- shared workflow scripts exist for tool checking, GitHub status, spellcheck, and Phase 5 smoke tests

## Current Tuning Intent
This is the current agreed direction for the next observation pass. The goal is to make upward progress fun and obvious first, then later dial it back if the colony becomes too efficient.

Planned boost profile:
- `1.` give a STRONG boost to connection-tree climber reward pressure
- `2.` give a STRONG boost to direct food-delivery reproductive payoff
- `3.` give a SMALL boost to survival / lifespan extension pressure
- `4.` give a MODERATE boost to climbing willingness
- `5.` give a MODERATE boost to grasp formation / persistence
- `6.` give a MODERATE boost to selection pressure over random drift

## Immediate Next Actions
1. Apply the agreed aggressive upward-progress tuning pass
2. Observe whether stronger connection-tree, delivery, and spawn pressure improves third-food reach attempts
3. Record which boosts feel effective versus overly artificial
4. Revisit later whether to dial the struggle back toward a more natural climb after success

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context
