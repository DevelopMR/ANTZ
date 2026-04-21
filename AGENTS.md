# AGENTS.md

# Ant Sim Repository Instructions

Read this file before doing any work.

## Project goal
This repository is for a browser-based 2D ant colony simulation game with evolutionary learning.
The simulation is designed to be visually readable, mechanically modular, and suitable for later large-population AI experiments and recorded videos.
The core fantasy is that ants learn to cooperate by building physical bridge/tower structures to reach food and return it to the queen.

## High-level principles
- Favor clean modular systems over fast hacks.
- Keep simulation logic decoupled from rendering logic.
- Keep neural-network code in its own module/class.
- Build in phases. Do not jump ahead unless a small hook is needed.
- Optimize for understandable behavior and future extensibility.
- Local sensing and emergent behavior are more important than perfect realism.
- Physics should be believable and stable, not maximally realistic.

## Current intended stack
- JavaScript
- PixiJS for rendering
- Browser-first prototype
- Local dummy/mock data where needed
- No backend required for early phases

## Source-of-truth design documents
Use these as the design hierarchy:
1. Implementation Sequence Spec = build order
2. Deep Spec = mechanics, constraints, intended behavior
3. Code Level Spec = module and class responsibilities
4. ARCHITECTURE.md = repository architecture and simulation rules

If any of these conflict with ad hoc coding instincts, prefer the specs and architecture docs.

## Build order
Implement one phase at a time.

Current intended sequence:
1. Core movement prototype
2. Sensor system
3. Neural network integration
4. Attachment system
5. Physics constraints
6. Food system
7. Connection tree + rewards
8. Queen + reproduction
9. Traits + mutation
10. Death + recycling
11. Pheromone system
12. Map progression
13. Visual polish

Do not implement future phases early except for tiny hooks or interfaces that clearly reduce future rework.

## Phase workflow
For each requested phase:
1. Read AGENTS.md and ARCHITECTURE.md
2. Summarize the phase goal
3. List files to create/modify
4. State assumptions
5. Propose a minimal implementation plan
6. Then implement only the scoped phase
7. End with a short status note:
   - what was built
   - what assumptions were made
   - what hooks were added for later phases
   - what remains next

## Engineering conventions
- Prefer small modules with single clear responsibilities.
- Prefer explicit names over clever abstractions.
- Keep constants configurable.
- Avoid hidden coupling between systems.
- Keep update order explicit.
- Keep tuning values centralized where possible.
- Leave comments where future evolution systems or physics constraints may be non-obvious.

## Simulation constraints
- Ants are simple and numerous. Performance matters.
- Ant visuals can be stylized and lightweight.
- Legs are primarily visual; body and connections carry core gameplay physics.
- Attachment is negotiated via grasp intent and inherited traits.
- No passive reward for merely existing in a structure.
- Reward should correlate with real contribution.
- Food return to queen is scripted once an ant successfully acquires food.
- Only moving ants deposit pheromones.
- Dead ants eventually detach and become food.
- Queen never consumes dead ants.

## Neural-network rules
- Keep the neural net in its own module from the beginning.
- Initial architecture should be configurable, not hard-coded into gameplay systems.
- Prefer feedforward first.
- Keep inputs local and embodied.
- Do not overfeed the model with global map knowledge.

## Physics rules
- Favor stable spring-damper style constraints.
- Dampen high-frequency jitter.
- Preserve gentle sway and visible structure flex.
- Stability effort can cost energy.
- Bridges should be able to fail under load in a way evolution can learn from.

## Performance expectations
- Early phases should remain readable and lightweight.
- Avoid expensive full-graph work every frame if it can be event-triggered instead.
- Connection-tree resolution should be event-based, not continuous.
- Design with scaling in mind from roughly 200 ants upward.

## Definition of done
A phase is done when:
- it matches the requested scope
- it runs locally without obvious breakage
- major known errors are addressed
- code structure supports the next phase
- no major future-phase logic was prematurely jammed in

## Do-not rules
- Do not implement multiple future phases without being asked.
- Do not bury core constants in random files.
- Do not tightly couple rendering, simulation, and evolution logic.
- Do not replace design intent with easier but contradictory mechanics.
- Do not remove planned extensibility unless clearly justified.

## If uncertain
Ask whether the uncertainty is:
- a hard contradiction in the specs, or
- a reasonable implementation choice

If it is only a reasonable implementation choice, proceed and state the assumption clearly.
