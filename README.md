# README.md

# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project has completed Phase 5:
- side-view ant presentation and modular PixiJS rendering
- lower-left colony spawn area and climb-test wall/food layout
- fixed world-clock local sensing with ray-driven wedge aggregation
- per-ant feedforward neural nets with explicit sensor-to-brain wiring
- direct neural movement outputs: `xVel`, `yVel`, `graspIntent`, `interaction`
- ant-on-ant climbing and perching behavior
- local grasp polling with threshold-based attachment negotiation
- temporary grasp groups with thrill-based persistence and decay
- spring-damper grasp-leg physics with up to 4 active grasp legs per ant
- ground / wall anchor priority with corner preference for walls
- impact jolt, bounce, and break behavior for attached structures
- support-floor and wall-padding polish to keep structures visually rational
- tracked-ant debug for sensor wedges, brain IO, support state, grasp legs, and recent impact/break state
- Phase 5 smoke coverage for corner priority, bridge stability, wall sheets, impact jolts, and long-idle boundedness

Not implemented yet:
- food pickup / carry-return loop
- reward accounting for structural contribution
- pheromone map simulation
- queen progression / reproduction
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

Phase 5 extends that brain-driven behavior into real structural motion:
- ants may climb onto other ants and perch
- perched ants may trigger local grasp polls
- successful groups attach and transition into soft spring-damper grasp physics
- grasping ants can anchor to ground, walls, and neighboring ants
- falling ants can jolt and rebound off structures
- unsupported motion still distinguishes intentional falls from collapse falls
- support surfaces now bias toward a flatter central perch with roll-off near the edges

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
- `src/systems/MapSystem.js`
- `src/systems/SensorSystem.js`
- `src/render/WorldRenderer.js`
- `src/config/tuning.js`

## Build Roadmap

Intended build sequence:
1. Core movement prototype
2. Sensor system
3. Neural network integration
4. Attachment system
5. Physics constraints
6. Food system
7. Connection tree + rewards
8. Queen + reproduction
9. Traits + mutation
10. Pheromone system
11. Death + recycling
12. Map progression
13. Visual polish

## Notes

This repository is being built phase-by-phase. The current code intentionally leaves hooks for future systems, but avoids implementing future mechanics too early.

If you are contributing, use the repository design docs and architecture notes as the source of truth before extending systems.
