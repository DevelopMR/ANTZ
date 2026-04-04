# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 4 - Grasp Intent Kickoff

## Phase Goal
Phase 4 begins by preparing ants for climb-and-grasp behavior where ants:
- use direct `xVel` and `yVel` neural movement outputs
- keep `graspIntent` as the main attachment desire signal
- keep `interaction` available for later food behavior
- preserve the existing sensor and brain debug while preparing for local grasp negotiation

This kickoff slice only updates the neural outputs and directional control path. It does not implement grasp negotiation or climb support yet.

## Definition of Done (Current Kickoff Slice)
- the neural net outputs are now `xVel`, `yVel`, `graspIntent`, and `interaction`
- tracked-ant debug shows the new output names
- movement uses direct horizontal velocity intent from the brain
- vertical velocity intent is stored and visible for review, but not yet used for climbing
- no attachment, climb support, or collapse behavior is implemented yet

## Explicit Non-Goals (Do NOT implement yet)
- attachment / connection system
- climb-on-ant support logic
- grasp polls or neighbor negotiation
- collapse / fall resolution for stacked ants
- eat / drop interaction logic
- structural physics

## Required Hooks for Upcoming Slice
Leave clean extension points for:
- climb state transitions driven by `yVel`
- grasp negotiation from `graspIntent`
- temporary climb / support relationships
- thrill bonus and decay once grasping exists
- collapse and fall transitions

## Current Systems Expected
At minimum:
- Ant entity/class with brain outputs stored as `xVel`, `yVel`, `graspIntent`, `interaction`
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem consuming `xVel` for horizontal control while preserving `yVel` for later use
- Rendering layer with tracked-ant sensor and brain debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- ants are still ground-bound in this kickoff slice
- `yVel` is intentionally inert until climb behavior is introduced

## Notes for Next Slice
The next implementation slice should add:
- climb-on-ant detection
- simple top-surface occupancy rules
- local grasp polling and threshold success
- temporary support and collapse behavior
