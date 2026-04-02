# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 2 - Sensor System

## Phase Goal
Establish a stable local-sensing prototype where ants:
- move in a side-view world from the lower-left colony area
- perceive nearby geometry and nearby ants using 360-degree local sensing grouped into wedges
- sample nearest visible-object distance per wedge
- sample averaged color-range scalar per wedge from visible hits only
- reserve scent and pheromone as separate nondirectional scalar inputs
- show sensor debug output for inspection

No neural decision making, attachment, structural physics, pheromone map logic, or reproduction yet.

## Definition of Done (Phase 2)
- walls, pegs, ground, queen, and food exist as side-view sensed world objects
- nearby ants can contribute to sensing without any global coordinates
- wedges report closest danger distance plus averaged visible color-range scalar
- only walls occlude vision
- sensor data is stored per ant in a future-brain-friendly shape
- debug visualization makes the sensor model inspectable
- simple procedural steering can react to sensor data

## Explicit Non-Goals (Do NOT implement yet)
- neural decision making
- attachment / connection system
- bridge physics
- carry-return behavior
- reward or evolution systems
- pheromone simulation
- death / recycling

## Required Hooks for Future Phases
Leave clean extension points for:
- neural input assembly
- food interaction and carry state
- peg / wall climb rules
- attachment negotiation
- pheromone channels in scalar inputs
- map progression data
- dead-ant / edible body sensing later

## Current Systems Expected
At minimum:
- Ant entity/class
- SimulationController update loop
- MapSystem with static-world indexing
- SensorSystem with nearby-object broad phase and wedge aggregation
- MovementSystem with sensor-driven demo behavior
- Rendering layer with sensor debug visualization

## Performance Expectations
- keep per-frame sensor work compact
- only query nearby objects for sensing
- avoid heavy graph work or attachment logic in this phase
- preserve the sprite-based ant render path
- maintain readable behavior at current swarm sizes

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- no global target knowledge for ant perception
- regular ants and queens will eventually differ in traversal rules, but not fully yet
- only walls currently occlude sensed objects

## Notes for Next Phase (Phase 3 Preview)
Next phase will introduce:
- neural network integration
- assembling wedge and scalar inputs into brain inputs
- replacing procedural steering with network outputs

Design Phase 2 so the current sensor outputs can feed directly into `NeuralNet` without a refactor.

## Instruction to Codex
- Focus only on Phase 2 sensor and map work
- Keep perception local and embodied
- Avoid implementing attachment or structural physics early
- Prefer clean module boundaries over clever shortcuts
- Leave brief comments only where future extension is non-obvious
