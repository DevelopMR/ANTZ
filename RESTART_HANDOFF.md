# RESTART_HANDOFF.md

## Return Target
Jump straight back into `Phase 10 - Traits + Mutation` observation.

The important fact on return: the current live tuning and rule pass is already in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js). We are not planning it anymore; we are testing it.
Once the observation pass is wrapped, the next planned implementation phase is `Phase 11 - Death + Recycling`, ahead of the pheromone system.
The agreed first implementation slice for that phase is to add explicit corpse lifecycle state and timing data to the ant model and central tuning.

## First 3 Things To Do
1. Launch the sim.
2. Switch to `Batch` or `Headless` if you want fast season turnover.
3. Watch whether ants show any meaningful learned structure-building or food-targeting behavior beyond simple motion, especially after `50+` seasons.

## Best Buttons On Return
- `Normal`: best for close visual reading once interesting behavior appears
- `No Display`: normal-speed simulation without redraw cost
- `Headless`: moderate fast-forward
- `Batch`: strongest browser fast-forward for season cycling
- `Food Scent Map`: optional, only if scent contours matter for the observation

## What Changed Most Recently
Recent live tuning changes in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js):
- `SIMULATION_TUNING.antCount` is now `50`
- fitness weights were reset to `mealWeight = 40`, `foodDeliveryWeight = 30`, `rewardContributionWeight = 100`
- tracked ant debug now includes a top-right `Fitness` readout in [WorldRenderer.js](/d:/dev/ANTZ/src/render/WorldRenderer.js)
- ants move left/right much faster than the earlier baseline:
  current `maxSpeed = 66.24`
  current `forwardDrive = 86.4`
- new fall-death rule added:
  `ANT_TUNING.maxFallsBeforeDeath = 10`
  per-ant fall count is tracked in [Ant.js](/d:/dev/ANTZ/src/entities/Ant.js)
  ants now die after reaching the configured fall limit
- current movement / climb-related values still include:
  `climbIntentThreshold = 0.14`
  `climbHorizontalRange = 26`
  `graspPollMaxNeighbors = 5`
  `graspSuccessThresholdPerAnt = 0.46`
  `graspHoldThreshold = 0.31`
  `graspPollCooldownMax = 1.15`
- current selection split still includes:
  `randomShare = 0.3`
  `fitnessCloneShare = 0.25`
  `connectionTreeShare = 0.45`

## Most Recent Observation
- ants are moving correctly and look mechanically healthy
- even well above `50` seasons, there was not much visible ant "thinking" or convincing learned behavior
- the next return should focus less on raw movement correctness and more on whether selection pressure, rewards, or inherited traits are producing visible decisions

## What To Watch For
Positive signs:
- earlier tower formation beneath middle and third food
- more ants reaching the second and third food in fewer seasons
- stronger population bursts after successful deliveries
- colonies that look more biased toward climbers and scaffold builders

Warning signs:
- ants still farming only the easiest food
- ants still look random or reflexive after many seasons despite correct locomotion
- population explosions without better upward progress
- too much chaotic grasping without stable climb chains
- success that feels too map-specific or overly forced

## Best Short Notes To Capture
When you return, the most useful observations will be:
- first season where behavior looks meaningfully non-random, if that ever happens
- first season where ants reliably touch the third food
- whether the middle food now gets harvested routinely
- whether the third-food attempts come from towers, wall use, or both
- whether easy-food farming still dominates reproduction
- whether the new tuning feels fun or too artificial
- whether the faster movement is helping exploration or just making chaos happen faster
- whether the 10-fall death rule changes colony stability in a useful way

## Quick Commands
```powershell
npm run spellcheck
npm run tools:check
```

## Primary Docs
- [PROJECT_STATUS.md](/d:/dev/ANTZ/PROJECT_STATUS.md)
- [SESSION_NOTES.md](/d:/dev/ANTZ/SESSION_NOTES.md)

## Resume Prompt
If you want a quick restart prompt for Codex after reboot, use:

```text
Read PROJECT_STATUS.md, SESSION_NOTES.md, and RESTART_HANDOFF.md. We are in Phase 10 observing the live tuning pass. Ant motion looks correct, but even after 50+ seasons there is not much visible learned behavior. Help me assess whether fitness, selection pressure, movement speed, or the new fall-death rule should be adjusted next.
```
