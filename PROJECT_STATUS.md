# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 2 - Sensor System

## Phase Goal
Establish a stable local-sensing prototype where ants:
- move in a side-view world from the lower-left colony area
- perceive nearby geometry using 360-degree local sensor rays grouped into wedges
- sample nearest obstacle distance per wedge
- sample averaged object color per wedge
- sense nearby food scent without any global map knowledge
- show sensor debug output for inspection

No neural decision making, attachment, structural physics, pheromone logic, or reproduction yet.

## Definition of Done (Phase 2)
- walls and pegs exist as side-view map geometry
- food nodes exist as sensed learning targets
- ants do not rely on global coordinates for targets
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
- pheromone channels in sensors
- map progression data

## Current Systems Expected
At minimum:
- Ant entity/class
- SimulationController update loop
- MapSystem
- SensorSystem
- MovementSystem with sensor-driven demo behavior
- Rendering layer with sensor debug visualization

## Performance Expectations
- keep per-frame sensor work compact
- avoid heavy graph work or attachment logic in this phase
- preserve the sprite-based ant render path
- maintain readable behavior at current swarm sizes

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- no global target knowledge for ant perception
- regular ants and queens will eventually differ in traversal rules, but not fully yet

## Notes for Next Phase (Phase 3 Preview)
Next phase will introduce:
- neural network integration
- assembling sensor wedges into brain inputs
- replacing procedural steering with network outputs

Design Phase 2 so the current sensor outputs can feed directly into `NeuralNet` without a refactor.

## Instruction to Codex
- Focus only on Phase 2 sensor and map work
- Keep perception local and embodied
- Avoid implementing attachment or structural physics early
- Prefer clean module boundaries over clever shortcuts
- Leave brief comments only where future extension is non-obvious
