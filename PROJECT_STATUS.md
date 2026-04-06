# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 5 - Physics Constraints Complete

## Phase Goal
Phase 5 turns temporary grasp groups into lightweight structural systems with fun, readable spring-damper behavior. The goal is not biological realism, but game-realistic motion that is stable, dramatic, and easy to watch:
- grounded and wall-supported ants can anchor structures
- grasping ants can hold up to 4 legs from a thorax-centered grasp node
- grasping ants stop self-walking, but can still ride supported motion
- attached groups sway, stretch, bounce, and fail under load
- collapse and impact events visibly jolt nearby structures
- support surfaces stay visually rational instead of letting ants sink into the ground or walls

## What Was Built
- added a dedicated `PhysicsSystem` and explicit `movement -> attachment -> physics` update order
- replaced rigid temporary grasp behavior with soft spring-damper leg constraints
- added up to 4 active grasp legs per ant with per-leg debug state
- grounded and wall-supported ants now prioritize an environmental first grasp leg
- corner cases prefer wall anchors before ground anchors
- grasping ants no longer self-walk while attached, but can ride supported ants
- attached groups now show sway, stretch, rebound, and dramatic break behavior
- falling ants transfer jolt and bounce into structures on impact
- post-physics support-floor clamping prevents attached ants from slipping underground
- wall-support padding prevents visibly embedded ants inside wall faces
- ant-top support was flattened into a rounded-rectangle-style approximation with a safer center and edge roll-off
- tracked-ant debug now shows active grasp-leg labels and recent break / impact state
- Phase 5 smoke tests were added to the repo as `npm run test:phase5`

## Verification
Automated checks currently passing:
- `node --check` on Phase 5-modified systems
- headless `SimulationController` single-tick instantiation
- `npm run test:phase5`
- `npm run spellcheck`

Current smoke-test results:
- Corner Priority: passed
- Simple Bridge: passed
- Wall Sheet: passed
- Impact Jolt: passed
- Long Idle: passed

Observed in-browser behavior confirmed during this phase:
- standing ants can ride on walking ants
- grasped structures visibly jolt when impacted
- free stacks still collapse outside the grasp-physics path
- grounded grasped ants no longer tunnel beneath the terrain

## Explicit Non-Goals (Still Not Implemented)
- food pickup / carry-return interaction logic
- structural reward accounting
- connection-tree contribution resolution
- pheromone map simulation
- queen reproduction / progression systems
- death / recycling systems

## Current Systems Expected
At minimum:
- Ant entity/class with support, fall, attachment, and grasp-leg state
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- MovementSystem for locomotion, climbing, falling, and free-stack collapse
- AttachmentSystem for poll-based grasp negotiation and anchor assignment
- PhysicsSystem for spring-damper leg solving, bounce, and break behavior
- Rendering layer with tracked-ant support / leg / break / impact debug

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- physics remain lightweight and local rather than full rigid-body simulation
- support logic is intentionally stylized toward fun motion and readable structures
- ant support surfaces are approximated rather than anatomically precise

## Environment Status
- core workflow toolchain is healthy: `git`, `node`, `npm`, `gh`, `rg`, `fd`, `jq`, `bat`
- repo spellcheck is configured and passing
- GitHub CLI auth is configured for regular GitHub-based workflow
- shared workflow scripts exist for tool checking, GitHub status, spellcheck, and Phase 5 smoke tests

## Next Phase
Phase 6 - Food System

Primary focus for the next phase:
- introduce food pickup and local food interaction behavior
- make successful structural access to food matter mechanically
- support return-to-queen flow once food is acquired
- preserve the current readable structure-building loop while adding purpose to reaching targets

## Immediate Next Actions
1. Keep tuning Phase 5 feel if new visual edge cases show up
2. Preserve the Phase 5 smoke suite as a regression check
3. Re-read `AGENTS.md` and `ARCHITECTURE.md` before starting Phase 6 work
4. Begin Phase 6 planning around food pickup, carry state, and return behavior

## Related Handoff Note
- see [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md) for the broader tooling + session handoff context
