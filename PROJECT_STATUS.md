# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 1 – Core Movement Prototype

## Phase Goal
Establish a stable simulation with visible ants that:
- spawn from a central origin (queen position placeholder)
- move forward with slight randomness or simple steering
- rotate and translate smoothly
- render clearly in a PixiJS scene

No AI, no attachment, no pheromones, no evolution yet.

## Definition of Done (Phase 1)
- 100–200 ants spawn and are visible
- ants move continuously with forward bias
- turning works and is visually smooth
- no major jitter, freezing, or physics instability
- simulation runs in browser without errors
- code structure supports adding sensors and AI next

## Explicit Non-Goals (Do NOT implement yet)
- neural decision making
- attachment / connection system
- pheromones
- food or queen behavior
- reward or evolution systems
- reproduction logic

## Required Hooks for Future Phases
Even though features are not implemented yet, leave clean extension points for:
- sensor input system
- neural network integration
- attachment system (connections list or placeholder)
- trait/genome storage on ants
- system-based update loop (not monolithic logic)

## Current Systems Expected
At minimum:
- Ant entity/class
- SimulationController or main loop
- Basic Movement handling
- Rendering layer (PixiJS)

## Performance Expectations
- Should comfortably handle ~200 ants
- Avoid unnecessary per-frame allocations
- Keep update loop simple and readable

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- Modular architecture required (future systems will expand heavily)

## Open Questions (Do Not Block Phase 1)
These should NOT delay implementation:
- exact neural network structure
- pheromone grid resolution
- reproduction tuning
- mutation rates

## Notes for Next Phase (Phase 2 Preview)
Next phase will introduce:
- directional wedge sensors
- obstacle detection
- sensor visualization (debug)

Design Phase 1 so sensors can be added without refactoring movement logic.

## Instruction to Codex
- Focus only on Phase 1
- Keep implementation clean and extensible
- Do not jump ahead to future systems
- Prefer clarity over cleverness
- Leave brief comments where future systems will connect