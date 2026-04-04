# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 4 - Grasp Intent Production

## Phase Goal
Phase 4 is turning grasp intent into real local structure behavior where ants:
- use direct `xVel` and `yVel` neural movement outputs
- climb onto other ants using simple support state
- trigger local grasp polls from perched-on-ant situations
- form temporary attached groups when combined grasp desire passes threshold
- gain a small temporary thrill bonus that helps them stay connected before it decays

This slice introduces grasp polling and temporary attachment, but not collapse logic or full platform physics yet.

## Definition of Done (Current Slice)
- the neural net outputs are `xVel`, `yVel`, `graspIntent`, and `interaction`
- ants can climb onto a grounded ant and perch on top
- a perched ant can trigger a random local grasp poll with nearby neighbors
- grasp success uses summed effective grasp desire against a threshold
- hard low-desire ants block a grasp attempt
- successful participants become attached and use the `grasping` visual
- a small random thrill boost is applied on success and decays over time
- attached ants release when their effective desire drops too low

## Explicit Non-Goals (Do NOT implement yet)
- collapse / scatter behavior for unstable tall stacks
- larger stable platform support rules
- full attachment graph physics
- eat / drop interaction logic
- structural spring-damper simulation

## Required Hooks for Upcoming Slice
Leave clean extension points for:
- one- or two-ant free stacks on top of grasped groups
- collapse and fall transitions
- stronger sheet/platform behavior
- richer negotiation factors beyond grasp desire sum
- reward consequences for useful structure participation

## Current Systems Expected
At minimum:
- Ant entity/class with support state and attachment state
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem consuming direct directional intent and simple climb support state
- AttachmentSystem handling local polling, threshold success, and decay
- Rendering layer with tracked-ant sensor and brain debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current attachments are simple temporary local groups, not full structural constraints
- no collapse logic exists yet, so current structures are only a first attachment layer

## Notes for Next Slice
The next implementation slice should add:
- unstable stack collapse rules
- falling / lower-surface landing behavior
- support expansion from grasped groups into simple larger platforms
