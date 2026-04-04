# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 3 - Neural Net Wiring Complete

## Phase Goal
Phase 3 established a working neural-control loop where ants:
- assemble a local 14-value brain input vector
- run feedforward inference every simulation step
- use neural outputs for turn and forward movement
- store grasp and interaction outputs as future-facing intents
- expose tracked-ant brain IO alongside the existing sensor debug

No attachment, food interaction, reward, reproduction, or pheromone-map behavior yet.

## Definition of Done (Phase 3)
- wedge proximity and danger-color inputs feed the brain in world-clock order `1, 3, 5, 7, 9, 11`
- only `foodScent` and `pheromone` are included as scalar brain inputs
- the neural net performs a real configurable feedforward pass
- movement uses neural `turn` and `forward` outputs instead of procedural steering
- `graspIntent` and `interaction` are stored on each ant without changing gameplay yet
- tracked-ant debug shows both sensor data and brain IO
- wall collision is stable enough for the current side-view lane prototype

## Explicit Non-Goals (Do NOT implement yet)
- attachment / connection system
- eat / drop interaction logic
- carry-return behavior
- reward or evolution systems
- pheromone field simulation
- death / recycling
- climbing or structural physics

## Required Hooks for Future Phases
Leave clean extension points for:
- attachment negotiation from `graspIntent`
- food interaction from `interaction`
- mutation and cloning of neural weights
- reward and fitness tracking
- carry-return takeover after food acquisition
- pheromone scalar becoming a real map sample

## Current Systems Expected
At minimum:
- Ant entity/class with `brainState`
- NeuralNet feedforward module
- BrainSystem input assembly and inference step
- SimulationController update order: sensors -> brain -> movement
- MovementSystem consuming stored neural outputs only
- Rendering layer with tracked-ant sensor and brain debug

## Performance Expectations
- keep per-ant inference lightweight
- preserve local-only sensing and nearby-ant broad-phase behavior
- avoid introducing attachment or graph work in this phase
- preserve the sprite-based render path and readable debug output

## Known Constraints
- Browser-first (no backend)
- JavaScript (no TypeScript required)
- PixiJS-based rendering
- no global target knowledge for ant perception
- existing ant-facing visuals remain velocity-derived only
- interaction and grasp outputs are inert runtime intents for now

## Notes for Next Phase Preview
Phase 4 should introduce grasp intent as a real system input by deciding how:
- grasp intent contributes to attachment negotiation
- ants choose when to seek, hold, or release local contact
- attachment limits and compatibility checks are represented before full physics arrives

## Instruction to Codex
- Focus only on grasp intent and attachment entry behavior in the next phase
- Keep the neural module separate from gameplay logic
- Preserve the existing sensor and brain debug semantics
- Avoid sneaking in food-system or structural-physics behavior early
- Prefer explicit runtime data flow over hidden coupling
