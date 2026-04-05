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
- distinguish intentional falls from collapse falls
- enforce unstable free-stack collapse while preserving simple walkable support behavior

This slice introduces grasp polling, first-pass gravity/falling behavior, and explicit unstable stack collapse rules, but not full platform physics yet.

## Definition of Done (Current Slice)
- the neural net outputs are `xVel`, `yVel`, `graspIntent`, and `interaction`
- ants can climb onto a grounded or wall-supported ant and perch on top
- a perched ant can trigger a random local grasp poll with nearby neighbors
- grasp success uses summed effective grasp desire against a threshold
- hard low-desire ants block a grasp attempt
- successful participants become attached and use the `grasping` visual
- a small random thrill boost is applied on success and decays over time
- attached ants release when their effective desire drops too low
- intentional falls go straight down to the nearest walkable surface
- collapse falls scatter and land on ground only
- free-moving stacks of three or more collapse, leaving the bottom ant in place
- grasped platforms can support up to two free ants above them before collapse begins
- additional food nodes are present on the marked wall tops for climb testing

## Explicit Non-Goals (Do NOT implement yet)
- full attachment graph physics
- eat / drop interaction logic
- structural spring-damper simulation
- fall damage or injury logic
- advanced overhead grasp rescue / arch support cases

## Required Hooks for Upcoming Slice
Leave clean extension points for:
- broader grasped-sheet platform support
- richer collapse and scatter presentation
- support-chain resolution beyond simple local stacks
- reward consequences for useful structure participation
- future visual distinction between grasping and walking ants in sensing/rendering

## Current Systems Expected
At minimum:
- Ant entity/class with support state, fall state, and attachment state
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem consuming direct directional intent with climb, support, intentional fall, and collapse handling
- AttachmentSystem handling local polling, threshold success, and decay
- Rendering layer with tracked-ant sensor and brain debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current attachments are simple temporary local groups, not full structural constraints
- support classification is still local and lightweight, not a full structural solver
- collapse lands on ground only for now to keep code and gameplay simple

## Notes for Next Slice
The next implementation slice should add:
- broader support behavior for grasped sheets and platforms
- stronger visual cues during collapse
- clearer contribution tracking for useful structural participation
- richer support-chain logic for uneven and arch-like structures
