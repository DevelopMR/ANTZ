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

The current slice adds simple climb-on-ant support behavior before grasp negotiation exists.

## Definition of Done (Current Slice)
- the neural net outputs are `xVel`, `yVel`, `graspIntent`, and `interaction`
- tracked-ant debug shows the new output names
- movement uses direct horizontal velocity intent from the brain
- ants can begin climbing onto a grounded ant using `yVel`
- climbing ants use the `grasping` visual until they reach the top surface
- perched ants return to `walking`
- ants remain limited to a simple one-ant-high unsupported perch in this slice
- no grasp poll, attachment negotiation, or collapse logic is implemented yet

## Explicit Non-Goals (Do NOT implement yet)
- attachment / connection system
- grasp polls or neighbor negotiation
- thrill bonus / decay
- collapse / fall resolution for tall unsupported stacks
- eat / drop interaction logic
- structural physics

## Required Hooks for Upcoming Slice
Leave clean extension points for:
- local grasp polling from a perched ant pair
- grasp threshold success using summed desire
- temporary support groups and larger stable platforms
- thrill bonus and decay once grasping exists
- collapse and fall transitions

## Current Systems Expected
At minimum:
- Ant entity/class with support state and brain outputs stored as `xVel`, `yVel`, `graspIntent`, `interaction`
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem consuming direct directional intent and simple climb support state
- Rendering layer with tracked-ant sensor and brain debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- ants are still effectively limited to a simple climb-perch model in this slice
- `yVel` is now active only for simple perch climbing, not full freeform vertical traversal

## Notes for Next Slice
The next implementation slice should add:
- climb-on-ant occupancy validation tied to local contact geometry
- local grasp polling and threshold success
- temporary support and collapse behavior
