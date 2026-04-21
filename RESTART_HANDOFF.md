# RESTART_HANDOFF.md

## Return Target
Jump straight back into `Phase 11 - Death + Recycling` implementation and tuning.

The important fact on return: the corpse loop is already materially working in the current branch. Corpses can die, decay visually, fall in some situations, be harvested as one-load food, and contribute limited genome influence.
There is also one current local uncommitted change in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js): queen spawn yield was reduced from `3-8` per food unit to `2-4` and still needs in-browser testing.

## First 3 Things To Do
1. Launch the sim.
2. Confirm the local spawn-yield reduction in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js) feels better under corpse-heavy food inflow.
3. Decide the next Phase 11 slice after that test: likely corpse cleanup/removal or larger collapse spectacle.

## Best Buttons On Return
- `Normal`: best for close visual reading once interesting behavior appears
- `No Display`: normal-speed simulation without redraw cost
- `Headless`: moderate fast-forward
- `Batch`: strongest browser fast-forward for season cycling
- `Food Scent Map`: optional, only if scent contours matter for the observation

## What Changed Most Recently
Recent Phase 11 additions now in the branch:
- explicit corpse lifecycle data on ants
- `dead` and `decaying` visuals are distinct
- corpses remain in physics/support handling as inert exoskeletons
- corpse harvesting works and creates visible one-load green returns to the queen
- corpse payloads show up in debug as `payload corpse`
- corpse gene influence is discounted/capped and postmortem reward gain is skipped

Most recent local-only tuning change in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js):
- `FOOD_TUNING.spawnOnFeedMin` is now `2`
- `FOOD_TUNING.spawnOnFeedMax` is now `4`

Still-relevant live values:
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
- the corpse conveyor-belt behavior is working and looks great
- a mass grave of decaying ants can form to the left of the queen
- corpse harvesting is fun and readable, with ants visibly carrying dead-ant food loads
- queen meals can accumulate too quickly now that corpse-food throughput exists, so the spawn-yield reduction needs testing next

## What To Watch For
Positive signs:
- corpse food still feels active and fun after the reduced queen spawn yield
- fewer runaway baby-ant surges when corpse traffic is high
- corpse harvesting remains readable without the queen queue exploding
- corpse influence appears in payload/debug without dominating living contributors

Warning signs:
- corpse-driven queen meal queues still balloon too quickly
- spawn bursts still feel excessive even at `2-4` per food unit
- corpse harvesting overwhelms normal map-food behavior
- corpse payload influence starts to look too dominant or too invisible

## Best Short Notes To Capture
When you return, the most useful observations will be:
- whether the new queen spawn-yield reduction feels correct or still too generous
- whether corpse food still creates a satisfying conveyor-belt loop
- whether the queen queue remains readable under corpse-heavy runs
- what the next Phase 11 slice should be after that tuning pass

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
Read PROJECT_STATUS.md, SESSION_NOTES.md, and RESTART_HANDOFF.md. We are in Phase 11 - Death + Recycling. Corpses can decay, fall, be harvested as one-load food, and contribute limited genome influence. There is one local uncommitted tuning change in src/config/tuning.js reducing queen spawn yield from 3-8 to 2-4 per food unit. Help me test that change and decide the next corpse slice.
```
