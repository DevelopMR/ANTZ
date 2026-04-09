# README.md

# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project has completed Phase 8:
- side-view ant presentation and modular PixiJS rendering
- fixed world-clock local sensing with ray-driven wedge aggregation
- per-ant feedforward neural nets with explicit sensor-to-brain wiring
- direct neural movement outputs: `xVel`, `yVel`, `graspIntent`, `interaction`
- ant-on-ant climbing, perching, and spring-damper grasp physics
- full food pickup / carry / delivery / spawn loop
- food scent field with diffusion, decay, and wind drift
- direct support-path reward tracing for food acquisition
- packed food genome payloads with repeat-grab accumulation
- queue-driven queen spawning with pack-balanced offspring planning
- inherited offspring brains and movement traits from queued genome snapshots
- reorganized tracked-ant debug for inputs, outputs, ant state, and scenario stats

Not implemented yet:
- final queen progression / reproduction policy
- broader structural credit beyond the direct support path
- richer trait system beyond current inherited movement hooks
- pheromone map simulation
- death / recycling
- map progression and late-game polish

## Goals

Design priorities for the project:
- keep simulation logic decoupled from rendering
- build in clearly scoped phases
- preserve modularity for later AI / evolution work
- favor local sensing and emergent behavior over scripted intelligence
- keep the simulation visually interpretable at swarm scale
- scale toward larger ant populations over time

## Tech Stack

- JavaScript
- PixiJS
- Browser-first prototype
- No backend required for early phases

## Running Locally

From the repository root:

```powershell
npm start
```

Then open:

```text
http://localhost:8000
```

For the shared debug and review workflow, see [WORKFLOW.md](/d:/dev/ANTZ/WORKFLOW.md).

Useful repo checks:

```powershell
npm run tools:check
npm run spellcheck
npm run test:phase5
npm run gh:status
```

## Current Prototype Notes

The current build intentionally avoids global map knowledge for the ants.

Ant perception is currently shaped around local-only inputs such as:
- 6 fixed wedges in world-clock order: `1, 3, 5, 7, 9, 11`
- 6 closest-object proximity inputs
- 6 averaged danger-range color inputs
- nondirectional local food scent scalar
- nondirectional pheromone scalar

Phase 8 completed the first real reward pipeline:
- ants now earn structural reward through the direct support path beneath a successful food grab
- that reward is packed onto the food as one or more genome sets
- repeated grabs append additional acquisition packs instead of overwriting earlier ones
- the queen now consumes queued food rewards over time instead of spawning everything instantly
- offspring are selected from those packed genome sets and inherit mutated brain/trait snapshots

## Project Structure

```text
src/
  ai/
  config/
  entities/
  render/
  systems/
```

Key current files:
- `src/ai/NeuralNet.js`
- `src/systems/BrainSystem.js`
- `src/systems/SimulationController.js`
- `src/systems/MovementSystem.js`
- `src/systems/AttachmentSystem.js`
- `src/systems/PhysicsSystem.js`
- `src/systems/FoodSystem.js`
- `src/systems/FoodScentSystem.js`
- `src/systems/ConnectionTreeSystem.js`
- `src/systems/MapSystem.js`
- `src/systems/SensorSystem.js`
- `src/render/WorldRenderer.js`
- `src/config/tuning.js`

## Build Roadmap

Intended build sequence for the current implementation track:
1. Core movement prototype
2. Sensor system
3. Neural network integration
4. Attachment system
5. Physics constraints
6. Food system
7. Food scent map
8. Connection Tree + Rewards
9. Queen and Reproduction
10. Traits + mutation
11. Pheromone system
12. Death + recycling
13. Map progression
14. Visual polish

## Notes

This repository is being built phase-by-phase. The current code intentionally leaves hooks for future systems, but avoids implementing future mechanics too early.

If you are contributing, use the repository design docs and architecture notes as the source of truth before extending systems.
