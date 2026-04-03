# ANTZ

ANTZ is a browser-first ant colony simulation prototype focused on readable emergent behavior, modular systems, and later evolutionary learning.

The long-term fantasy is a side-view ant-farm world where ants learn to cooperate by forming bridges and tower-like structures to reach food, return it to the queen, and eventually climb through progressively harder maps.

## Current Status

The project is currently at the end of Phase 2:
- side-view ant presentation
- lower-left colony spawn area
- ground-bound ant movement prototype
- multiple ant visual states
- PixiJS rendering with a sprite-atlas ant pipeline
- side-view obstacle map with walls, pegs, ground, queen, and early food nodes
- ray-driven local sensing aggregated into 6 fixed world-clock wedges
- wedge outputs built from closest ray-hit distance plus averaged danger-range color scalar
- local social sensing that includes nearby ants without global map knowledge
- sensor debug visualization for a tracked ant, including ray hits, wedge dots, and wedge census labels
- basic sensor-driven steering demo code

Not implemented yet:
- neural control
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
- 3 sensing rays per wedge conceptually: left border, center, right border
- closest ray-hit distance per wedge
- averaged wedge danger-range scalar from weighted ray tallies
- nondirectional local food scent scalar
- nondirectional pheromone placeholder scalar
- small scalar body-state inputs

The current V2 sensor rules are:
- wedge orientation does not rotate or flip with ant display direction
- border-ray hits contribute to both adjacent wedges
- center-ray hits contribute more strongly to their wedge
- rays continue through non-occluding objects and stop at the first occluding object
- only ground and walls occlude vision
- occluders still contribute to wedge color before ending the ray
- only nearby ants are queried dynamically for sensing efficiency

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
- `src/systems/MapSystem.js`
- `src/systems/SensorSystem.js`
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
