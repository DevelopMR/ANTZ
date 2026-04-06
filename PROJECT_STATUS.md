# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 4 - Grasp Intent Complete

## Phase Goal
Phase 4 turned `graspIntent` into real local structure behavior where ants:
- use direct `xVel` and `yVel` neural movement outputs
- climb onto other ants and perch on simple support surfaces
- trigger local grasp polls from perched-on-ant situations
- form temporary attached groups when combined grasp desire passes threshold
- gain a small temporary thrill bonus that helps them stay connected before it decays
- must fully lose that thrill bonus before earning a fresh boost again
- distinguish intentional falls from collapse falls
- enforce unstable free-stack collapse while preserving simple walkable support behavior

This phase introduced attachment negotiation, first-pass gravity/falling behavior, unstable stack collapse rules, and readable debug instrumentation, but not full structural physics yet.

## What Was Built
- neural outputs updated to `xVel`, `yVel`, `graspIntent`, and `interaction`
- ants can climb onto grounded, wall-supported, or otherwise walkable ant backs
- perched ants can trigger random local grasp polls with nearby neighbors
- grasp success uses summed effective grasp desire against a threshold
- hard low-desire ants block a grasp attempt
- successful participants become attached and use the `grasping` visual
- thrill boost is applied on successful grasp and decays over time
- thrill boost cannot be refreshed until it fully decays
- intentional falls go straight down to the nearest walkable surface
- collapse falls scatter diagonally and land on ground only
- free-moving stacks of three or more collapse, leaving the bottom ant in place
- grasped platforms can support up to two free ants above them before collapse begins
- additional food nodes were added on wall tops for climb testing
- tracked debug display now reports support state, brain IO, wedge census, and cumulative fallen-ant totals

## Explicit Non-Goals (Still Not Implemented)
- full spring-damper structural constraints
- eat / drop interaction logic
- structural reward accounting
- advanced overhead grasp rescue / arch support cases
- visual sensing differences between grasping and walking ants

## Current Systems Expected
At minimum:
- Ant entity/class with support state, fall state, and attachment state
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem consuming direct directional intent with climb, support, intentional fall, and collapse handling
- AttachmentSystem handling local polling, threshold success, thrill persistence, and decay
- Rendering layer with tracked-ant sensor and brain debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- current attachments are simple temporary local groups, not full structural constraints
- support classification is still local and lightweight, not a full structural solver
- collapse lands on ground only for now to keep code and gameplay simple

## Next Phase
Phase 5 - Physics Constraints

Primary focus for the next phase:
- replace the simple local support model with more explicit structural constraint behavior
- make grasped groups behave more like cohesive platforms and sheets
- improve stability handling, load transfer, and failure behavior
- preserve readable, believable motion without jumping ahead to later food/reward systems
