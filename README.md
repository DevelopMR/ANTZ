# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project has completed Phase 3:
- side-view ant presentation
- lower-left colony spawn area
- ground-bound ant movement prototype
- multiple ant visual states
- PixiJS rendering with a sprite-atlas ant pipeline
- side-view obstacle map with walls, pegs, ground, queen, and early food nodes
- ray-driven local sensing aggregated into 6 fixed world-clock wedges
- per-ant feedforward neural nets with configurable hidden layers
- explicit brain input assembly from wedge proximity, wedge danger-color, food scent, and pheromone
- neural control of turn and forward motion
- stored `graspIntent` and `interaction` outputs ready for later phases
- tracked-ant debug visualization for both sensor data and brain IO
- improved wall collision handling and clamped wedge-debug labels for readability

Not implemented yet:
- attachment mechanics
- structural physics and climbing behavior
- food pickup / carry-return loop
- rewards / reproduction
- pheromone map simulation
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

Phase 3 wires those sensor values into a feedforward brain with 4 outputs:
- `turn`
- `forward`
- `graspIntent`
- `interaction`

Only `turn` and `forward` affect movement right now. `graspIntent` and `interaction` are stored as inert runtime intents for the next phase.

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
