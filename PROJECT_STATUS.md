# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 6 - Food System Complete

## Phase Goal
Phase 6 made food mechanically meaningful without jumping ahead into full evolution. The completed food loop now lets ants:
- visually detect food as green circles through the existing wedge system
- interact only when fully inside the food pickup zone
- consume a meal portion on pickup
- carry food in an automatic return-to-queen mode
- drop food at the queen's right side, salute, and return to free-ant behavior
- trigger immediate queen-fed spawning
- lose carried food if they fall during the return trip

## What Was Built
- added a dedicated `FoodSystem`
- food nodes now have finite trip counts and shrink visibly as they are depleted
- ants can pick up food only from fully-contained overlap, not edge touches
- pickup consumes a meal and loads a carried food unit
- carriers enter scripted physical return mode at reduced speed
- carriers do not participate in grasp polling while hauling or saluting
- carriers can traverse ant ridgelines while returning instead of getting locked to one back
- carriers drop food to the queen's right, salute with the `reaching` pose, and reset to free mode
- queen feeding now increments colony totals and immediately spawns new ants to the queen's left
- spawn flow now already accepts a future `genomeSource` hook for evolution work
- tracked debug can follow active food carriers and shows carry/return/queen totals
- food carrying, shrink, salute, queen feed, and spawn were all visually confirmed in-browser

## Verification
Current checks passing:
- `node --check` on modified Phase 6 systems
- headless `SimulationController` tick
- `npm run spellcheck`

Observed in-browser behavior confirmed during this phase:
- food pickup occurs from within the food node
- carried food appears visually on the ant
- food nodes shrink after successful pickup
- carriers can deliver to the queen and trigger a spawn
- the salute beat plays on delivery
- the debug focus can lock onto active food carriers

## Explicit Non-Goals (Still Not Implemented)
- food scent field propagation
- scent input changes to the neural network
- structural reward accounting
- connection-tree contribution resolution
- inherited offspring generation from successful parents
- pheromone map simulation
- death / recycling systems

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, grasp-leg, and food-carry state
- Queen entity with delivery and spawn bookkeeping
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, free-stack collapse, and carrier return motion
- AttachmentSystem for poll-based grasp negotiation with carrier exclusions
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- FoodSystem for pickup, depletion, carry, drop, delivery, and spawn triggers
- Rendering layer with tracked-ant support / leg / carry / queen debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current return-to-queen logic is scripted rather than learned
- spawning is still random even though the interface now exposes a future genome hook
- food scent is intentionally deferred to the next phase

## Environment Status
- core workflow toolchain is healthy: `git`, `node`, `npm`, `gh`, `rg`, `fd`, `jq`, `bat`
- repo spellcheck is configured and passing
- GitHub CLI auth is configured for regular GitHub-based workflow
- shared workflow scripts exist for tool checking, GitHub status, spellcheck, and Phase 5 smoke tests

## Next Phase
Phase 7 - Food Scent Map

Primary focus for the next phase:
- add a real food scent field in the world
- feed that scent into the existing local sensor model
- verify the new input reaches the network cleanly
- preserve the currently working pickup / carry / delivery loop while expanding food-seeking behavior

## Immediate Next Actions
1. Re-read `AGENTS.md` and `ARCHITECTURE.md` before starting scent work
2. Plan the scent field representation and update order
3. Decide where scent state lives: map-only vs dedicated system
4. Add scent debug visibility before tuning values too aggressively

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + phase handoff context

