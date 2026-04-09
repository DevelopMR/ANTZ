# README.md

# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project has completed Phase 6:
- side-view ant presentation and modular PixiJS rendering
- fixed world-clock local sensing with ray-driven wedge aggregation
- per-ant feedforward neural nets with explicit sensor-to-brain wiring
- direct neural movement outputs: `xVel`, `yVel`, `graspIntent`, `interaction`
- ant-on-ant climbing, perching, and spring-damper grasp physics
- food pickup from full containment within food nodes
- visible food depletion and shrinking food circles
- automatic carry-back behavior with slower carrier motion
- queen delivery, salute beat, and immediate spawning
- spawn flow with a future `genomeSource` interface hook for evolution
- tracked-ant debug for sensor wedges, brain IO, support state, grasp legs, carry state, and queen totals

Not implemented yet:
- food scent field and scent-driven seeking
- reward accounting for structural contribution
- connection tree resolution
- inherited offspring generation from successful parents
- pheromone map simulation
- queen progression / reproduction policy
- death / recycling

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

Phase 6 completed the first full food loop:
- ants can see food visually and interact with it
- successful pickup consumes a meal and starts a scripted carry run
- carriers can physically move across supports while returning to the queen
- delivery drops food to the queen, triggers a salute, and causes immediate spawning
- the offspring creation path already has a future hook for genome-based evolution work

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
9. Queen + reproduction
10. Traits + mutation
11. Pheromone system
12. Death + recycling
13. Map progression
14. Visual polish

## Notes

This repository is being built phase-by-phase. The current code intentionally leaves hooks for future systems, but avoids implementing future mechanics too early.

If you are contributing, use the repository design docs and architecture notes as the source of truth before extending systems.

