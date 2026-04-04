# PROJECT_STATUS.md

## Project
Ant Colony Bridge Simulation

## Current Phase
Phase 3 - Neural Net Wiring

## Phase Goal
Wire the finalized Phase 2 sensor outputs directly into each ant's neural net so ants:
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
Next phase should build from this wiring layer by deciding how:
- grasp intent enters attachment negotiation
- interaction intent maps to food contact behavior
- neural weights are inherited, mutated, and rewarded

## Instruction to Codex
- Focus only on Phase 3 neural wiring
- Keep the neural module separate from gameplay logic
- Preserve the existing sensor debug semantics
- Avoid sneaking in attachment or food-system behavior early
- Prefer explicit runtime data flow over hidden coupling
