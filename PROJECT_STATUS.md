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
- lose unsupported footing and fall onto the next lower valid surface

This slice introduces grasp polling plus first-pass gravity/falling behavior, but not collapse logic or full platform physics yet.

## Definition of Done (Current Slice)
- the neural net outputs are `xVel`, `yVel`, `graspIntent`, and `interaction`
- ants can climb onto a grounded or wall-supported ant and perch on top
- a perched ant can trigger a random local grasp poll with nearby neighbors
- grasp success uses summed effective grasp desire against a threshold
- hard low-desire ants block a grasp attempt
- successful participants become attached and use the `grasping` visual
- a small random thrill boost is applied on success and decays over time
- attached ants release when their effective desire drops too low
- unsupported ants enter a falling state under gravity
- falling ants can land on ground, wall tops, or a lower grounded ant surface
- additional food nodes are present on the marked wall tops for climb testing

## Explicit Non-Goals (Do NOT implement yet)
- collapse / scatter behavior for unstable tall stacks
- larger stable platform support rules for grasped groups
- full attachment graph physics
- eat / drop interaction logic
- structural spring-damper simulation
- fall damage or injury logic

## Required Hooks for Upcoming Slice
Leave clean extension points for:
- one- or two-ant free stacks on top of grasped groups
- collapse and fall transitions for unstable stacks
- stronger sheet/platform behavior
- richer negotiation factors beyond grasp desire sum
- reward consequences for useful structure participation

## Current Systems Expected
At minimum:
- Ant entity/class with support state, fall state, and attachment state
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem consuming direct directional intent with climb, support, and fall handling
- AttachmentSystem handling local polling, threshold success, and decay
- Rendering layer with tracked-ant sensor and brain debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current attachments are simple temporary local groups, not full structural constraints
- falling only lands on simple stable surfaces for now; grasped sheets are not yet treated as wide support platforms
- no collapse logic exists yet, so current structures are only a first attachment layer

## Notes for Next Slice
The next implementation slice should add:
- unstable stack collapse rules
- falling / lower-surface landing behavior for attached groups as they release
- support expansion from grasped groups into simple larger platforms
- stronger visual cues during falling and collapse
