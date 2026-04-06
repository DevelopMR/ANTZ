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

## Environment Status
- current session focused on toolchain cleanup rather than simulation changes
- no game code was modified during the tooling session
- `git` was upgraded and now reports `2.53.0.windows.2`
- machine-wide GitHub CLI was installed at `C:\Program Files\GitHub CLI\gh.exe`
- `gh` now resolves on PATH
- `winget` and `rg` were repaired by prepending their working install directories to the user PATH
- `rg` now resolves as a standard CLI instead of relying on the editor-bundled copy
- preferred package-manager standard going forward is `winget` for core machine tools

## Next Phase
Phase 5 - Physics Constraints

Primary focus for the next phase:
- replace the simple local support model with more explicit structural constraint behavior
- make grasped groups behave more like cohesive platforms and sheets
- improve stability handling, load transfer, and failure behavior
- preserve readable, believable motion without jumping ahead to later food/reward systems

## Immediate Next Actions
1. Open a fresh terminal and verify:
   `git --version`, `gh --version`, `rg --version`
2. Also verify:
   `winget --version`
3. Re-read `AGENTS.md` and `ARCHITECTURE.md` before starting Phase 5 work
4. Resume with a Phase 5 plan only after tool verification is clean

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the full restart-safe tooling and session handoff
