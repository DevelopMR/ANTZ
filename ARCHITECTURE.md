# ARCHITECTURE.md

# Ant Sim Architecture

## Core concept
This project is a physics-based multi-agent ant colony simulation.
Ants use local sensing, inherited traits, and a neural controller to explore, attach to one another, form structures, reach food, and return food to the queen.
The main interest is emergent cooperative behavior that is visually readable.

## Primary design goals
- emergent role differentiation
- cooperative bridge/tower building
- visually clear swarm behavior
- modular systems
- future-ready evolutionary loop
- scalable enough for large populations

## Core simulation loop
Recommended per-frame order:

1. Sensor sampling
2. Neural inference
3. Movement integration
4. Attachment resolution
5. Physics constraint solve
6. Pheromone update
7. Food interaction checks
8. Event-driven connection tree resolution when food is touched by a new ant
9. Reward assignment
10. Reproduction queue update
11. Death / detach / cleanup
12. Render updates

## Main entities

### Ant
Represents a single agent in the colony.

Suggested responsibilities:
- body state
- movement state
- hunger / energy
- alive / dead / decaying state
- attachment state
- neural inputs / outputs
- inherited traits / genome
- reward / fitness history

Suggested properties:
- id
- position
- velocity
- rotation
- angularVelocity or turnMomentum if needed
- hunger
- energy
- state
- attached
- carryingFood
- connectionIds
- traits
- brain
- lineageId
- rewardState
- timers

### Queen
Static home destination for food delivery and source of new ants.

Suggested responsibilities:
- spawn origin
- delivery receiver
- gestation queue
- migration trigger
- level progression trigger

### FoodNode
A food source in the world.

Suggested responsibilities:
- world position
- remaining food quantity
- scent contribution
- contact handling
- depletion state

### Peg / Terrain Anchor
Static world geometry used for grounding and bridge support.

Suggested responsibilities:
- collision
- grounding anchor
- map challenge layout

## Main systems

### SimulationController
Owns global update order and world state.

### NeuralNet module
Separate reusable module/class.
Should support:
- configurable input count
- configurable hidden layers
- configurable output count
- clone
- mutate
- forward pass

### Trait / Genome module
Represents inheritable tendencies, separate from moment-to-moment outputs.

Candidate traits:
- pheromoneAttraction
- foodAttraction
- contactPreference
- graspTendency
- stabilityEfficiency
- metabolismRate
- forwardBias
- turnResponsiveness

Traits should be inheritable and mutable.

### SensorSystem
Produces ant-local sensory input.

Planned v1 sensor shape:
- 6 directional wedges around facing direction
- each wedge samples:
  - obstacle/terrain proximity
  - food scent strength
  - pheromone strength

Additional scalar state inputs may include:
- hunger
- speed
- attached flag
- normalized connection count

Do not rely on global map knowledge.

### MovementSystem
Applies turn and forward-drive outputs.
Ants should have a natural tendency to move forward.

### AttachmentSystem
Handles connection negotiation.

Attachment occurs when:
- ants are within attachment range
- both are below max link count
- combined grasp desire exceeds threshold

Max links per ant: 4

Connection desire is influenced by:
- current neural grasp output
- inherited grasp tendency
- possibly local state

### ConnectionGraphSystem
Stores and queries ant-to-ant links.

Use an adjacency-list style representation.

Main purposes:
- structural physics
- event reward propagation
- connection tree traversal
- grounded support detection

### PhysicsSystem
Handles:
- gravity
- ant body motion
- spring-damper constraints for connections
- damping of high-frequency jitter
- load / collapse under excessive mass

Legs are visual. Core physics should live in body + connections.

### FoodSystem
Handles:
- food collision
- food depletion
- triggered food-acquired events
- transition into scripted carry-back mode

Ants that reach food eat first, then carry food.

### CarryReturnSystem
When an ant acquires food, return to queen is scripted rather than neural-controlled.
The return should still obey normal world physics and speed constraints.
After delivery, the ant regains AI control.

### RewardSystem
Reward must map to meaningful contribution.

No passive reward for merely sitting in a structure.

Reward types:
- structural reward for participating in a successful support chain
- event reward when food is reached
- reproduction consequences when food is delivered

### ConnectionTreeResolver
Triggered only when food is touched by a new ant, not every frame.

Purpose:
- traverse support graph from food-contact ant
- determine valid supporting paths
- determine which ants are part of the successful support network

The visual metaphor can be “lightning strike” propagation rather than a blunt flood fill, as long as it remains deterministic and explainable.

### ReproductionSystem
Triggered after food delivery to queen.

Rules:
- organic gestation delay
- limit spawns per second
- no fixed hard population cap by default
- larger spawn volumes increase mutation percentage
- successful participants influence who reproduces

Reproduction should create:
- direct clones
- mutated variants

### PheromoneSystem
Grid-based scalar field.

Rules:
- only moving ants deposit pheromones
- fast early decay
- capped intensity
- supports both attraction and avoidance depending on traits

### DeathSystem
Lifecycle:
alive -> dead -> decaying -> food

Rules:
- dead ants lose structural contribution
- dead ants eventually detach
- dead ants can fall or be eaten later
- queen never consumes dead ants

### MapSystem
Owns world generation / loading.

Early progression should include:
- easy first peg
- nearby training food
- gradually harder structure challenges
- later large destination cache
- future 5-map chain of increasing difficulty

## Grounding and support logic
Grounding is not simply “connected to queen.”
The support chain should resolve from food contact through ant connections toward valid static support:
- terrain
- static pegs
- other static anchored map elements

Typical bridge targets:
- ground -> peg/food
- peg/food -> peg/food
- peg/food -> queen destination feast

There may be a gap between queen and most bridges.

## Visual readability rules
The simulation should be easy to interpret in motion.

Recommended visual states:
- attached highlight
- carrying indicator
- best-lineage tint
- subtle trait indicators
- pheromone trails
- connection tree flash at successful food contact

Ant base visual:
- three black body circles in a row
- six thin legs
- lightweight animation
- readable at swarm scale

## Performance rules
- Prefer event-driven expensive work
- Keep per-frame sensor work compact
- Avoid heavy graph traversals unless triggered
- Keep render objects lightweight
- Design with later population scaling in mind

## Suggested folder direction
This is only a suggestion; adapt as needed.

- src/
  - entities/
    - Ant.js
    - Queen.js
    - FoodNode.js
  - systems/
    - SimulationController.js
    - SensorSystem.js
    - MovementSystem.js
    - AttachmentSystem.js
    - ConnectionGraphSystem.js
    - PhysicsSystem.js
    - FoodSystem.js
    - CarryReturnSystem.js
    - RewardSystem.js
    - ReproductionSystem.js
    - PheromoneSystem.js
    - DeathSystem.js
    - MapSystem.js
  - ai/
    - NeuralNet.js
    - Genome.js
  - render/
    - AntView.js
    - EffectsRenderer.js
  - config/
    - tuning.js

## Initial implementation philosophy
Phase 1 should prove movement and rendering.
Each later phase should add one major capability without destabilizing the whole project.
Always leave hooks for future systems, but avoid prematurely implementing them.