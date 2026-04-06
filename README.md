# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project has completed Phase 4:
- side-view ant presentation and modular PixiJS rendering
- lower-left colony spawn area and climb-test wall/food layout
- fixed world-clock local sensing with ray-driven wedge aggregation
- per-ant feedforward neural nets with explicit sensor-to-brain wiring
- direct neural movement outputs: `xVel`, `yVel`, `graspIntent`, `interaction`
- ant-on-ant climbing and perching behavior
- local grasp polling with threshold-based attachment negotiation
- temporary grasp groups with thrill-based persistence and decay
- intentional falls versus collapse falls
- unstable free-stack collapse with diagonal scatter behavior
- tracked-ant debug for sensor wedges, brain IO, support state, and fall totals

Not implemented yet:
- full structural spring-damper physics constraints
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

## Current Prototype Notes

The current build intentionally avoids global map knowledge for the ants.

Ant perception is currently shaped around local-only inputs such as:
- 6 fixed wedges in world-clock order: `1, 3, 5, 7, 9, 11`
- 6 closest-object proximity inputs
- 6 averaged danger-range color inputs
- nondirectional local food scent scalar
- nondirectional pheromone scalar

Phase 4 extends that brain-driven behavior into early structure building:
- ants may climb onto other ants and perch
- perched ants may trigger local grasp polls
- successful groups attach temporarily
- thrill boosts help a fresh grasp persist, but must fully decay before a new boost can be earned again
- unsupported motion can lead to intentional falls or collapse falls depending on support logic

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
