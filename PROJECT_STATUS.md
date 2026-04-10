# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 9 - Queen and Reproduction Complete

## Phase Goal
Phase 9 turned the reward pipeline into a real seasonal colony loop. The completed phase now:
- lets the Red Queen process delivered food through a FIFO meal queue
- spaces queen meals and spawn emissions over time
- gives ants lifespan, food healing, death, and season fitness
- archives compact season reward data for next-generation construction
- restarts the colony when all worker ants die
- builds the next season from random ants, fitness clones, and season connection-tree packs

## What Was Built
- added ant lifespan, uncapped meal healing, death state, and season fitness bookkeeping
- split queen-side processing into delivered food, queued meals, and delayed spawn work
- made delivered food enter a FIFO queen meal queue instead of becoming immediate growth
- preserved delivered payload packs into season history for later generation building
- added season rollover when all living ants die and reset food map / queues cleanly
- built next-generation composition as 40% random, 20% fitness-clone, and 40% season-pack sourced ants
- kept mutation as explicit no-op hooks for the next phase rather than partially enabling it early
- added renderer support for season stats and ant-view rebuilding across season resets
- added a dedicated dead-ant icon for clearer lifecycle readability
- removed `turnResponsiveness` after confirming it was an old unused concept rather than a live movement trait

## Verification
Current checks passing:
- `node --check` on modified Phase 9 systems and rendering files
- headless `SimulationController` runs showing food delivery, queen meal processing, spawning, ant death, and season rollover
- `npm run spellcheck`

Observed in-browser behavior confirmed during this phase:
- queen meal FIFO and delayed spawning feel stable in live runs
- ants gain lifespan from food and still die out over time
- full seasons now complete and restart cleanly
- season progression appears stable over many observed seasons
- dead ants display with the dedicated corpse icon

## Explicit Non-Goals (Still Not Implemented)
- actual mutation effects on cloned / season-pack offspring
- broader trait inheritance beyond current movement hooks and packed brain snapshots
- pheromone map simulation
- dead-ant recycling into food
- cutscenes or more theatrical season transitions
- later map progression / campaign structure

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, food-carry, lifespan, death, and season fitness state
- Queen entity with food delivery totals, FIFO meal queue, delayed spawn queue, and spawn history
- NeuralNet feedforward module with clone + mutate support hooks
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, free-stack collapse, and carrier return motion
- AttachmentSystem for poll-based grasp negotiation plus release-on-carry / release-on-death handling
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- FoodSystem for pickup, depletion, carry, drop, delivery, healing, and queen queue handoff
- FoodScentSystem for scent field update, drift, and scalar sampling
- ConnectionTreeSystem for support-path resolution, payload packing, and spawn-plan generation
- Rendering layer with tracked-ant debug, scenario season stats, and dead-ant visuals

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current return-to-queen logic is still scripted rather than learned
- reward attribution remains intentionally simple and only follows the direct support path
- season archives are compact payload/pack summaries rather than full colony replays
- next-generation sourcing is in place, but mutation remains intentionally disabled until Phase 10

## Warning Predictions
These are not blockers, but they should be watched in later analysis:
- current fitness weighting may bias strongly toward simple survival if food pressure is too weak
- direct support-path credit may still miss structurally meaningful ants outside the traced chain
- season-pack share vs fitness-clone share may need retuning once mutation turns on
- longer queen meal delays may need stronger visualization if reproduction becomes harder to read
- dead-ant persistence and future recycling could change season pacing significantly once introduced

## Environment Status
- core workflow toolchain is healthy: `git`, `node`, `npm`, `gh`, `rg`, `fd`, `jq`, `bat`
- repo spellcheck is configured and passing
- GitHub CLI auth is configured for regular GitHub-based workflow
- shared workflow scripts exist for tool checking, GitHub status, spellcheck, and Phase 5 smoke tests

## Next Phase
Phase 10 - Traits + Mutation

Primary focus for the next phase:
- turn on mutation for half of fitness-clone offspring and half of season-pack offspring
- decide exactly which numeric traits are inherited and mutated
- keep network topology fixed while mutating weights and biases conservatively
- tune mutation strength to preserve learned structure-building while allowing exploration

## Immediate Next Actions
1. Re-read `AGENTS.md` and `ARCHITECTURE.md` before starting mutation work
2. Decide the first inheritable trait set beyond current movement hooks
3. Turn the current mutation no-op hooks into real selective mutation paths
4. Add debug that helps verify which offspring are mutated versus exact copies

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context
