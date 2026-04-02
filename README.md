# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project is currently in an early prototype stage around Phase 1 / Phase 1.5:
- side-view ant presentation
- lower-left colony spawn area
- ground-bound ant movement prototype
- multiple ant visual states
- PixiJS rendering with a sprite-atlas ant pipeline
- benchmark controls for comparing animated vs static ants

Not implemented yet:
- sensors
- neural control
- attachment mechanics
- structural physics
- food interaction
- rewards / reproduction
- pheromones
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

## Benchmark Panel

The current prototype includes a small benchmark panel in the browser so render cost can be compared visually.

Current controls:
- animated vs static ants
- running vs paused simulation
- single-step simulation advance
- live FPS and frame-time readout

This is intended to help evaluate render-path decisions while the prototype is still small.

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
- `src/systems/SimulationController.js`
- `src/systems/MovementSystem.js`
- `src/render/WorldRenderer.js`
- `src/render/AntView.js`
- `src/render/AntSpriteLibrary.js`
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
