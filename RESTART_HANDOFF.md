# RESTART_HANDOFF.md

## Return Target
Jump straight back into `Phase 11 - Death + Recycling` tuning and observation.

The important fact on return: the corpse loop is already materially working in the current branch. Corpses can die, decay visually, fall in some situations, be harvested as recyclable food, contribute limited genome influence, and now leave the world after their decay window ends.

There is one current local uncommitted file:
- [tuning.js](/d:/dev/ANTZ/src/config/tuning.js)

That file contains the newest queen / reward tuning and still needs in-browser judgment before committing.

## First 3 Things To Do
1. Launch the sim.
2. Watch queen throughput under corpse-heavy runs.
3. Decide whether the current tuning feels right or still needs damping.

## Best Buttons On Return
- `Normal`: best for close visual reading once interesting behavior appears
- `No Display`: normal-speed simulation without redraw cost
- `Headless`: moderate fast-forward
- `Batch`: strongest browser fast-forward for season cycling
- `Food Scent Map`: optional, only if scent contours matter for observation

## What Changed Most Recently
Recent Phase 11 additions now in the branch:
- explicit corpse lifecycle data on ants
- distinct `dead` and `decaying` visuals
- inert corpse support / physics participation
- corpse harvesting as a one-load green return to the queen
- corpse payloads showing in debug as `payload corpse`
- corpse gene influence discounted and capped
- postmortem reward gain skipped
- finished corpses removed from the world after decay
- queen meal processing changed to a spawn nutrition buffer
- corpse deliveries now count as half a spawn unit
- queen meal spawns now include a small random-ant chance
- normal map food reward increased relative to corpse-food reward

## Current Live Tuning To Remember
From [tuning.js](/d:/dev/ANTZ/src/config/tuning.js):
- `SIMULATION_TUNING.antCount = 20`
- `ANT_TUNING.maxSpeed = 82`
- `FOOD_TUNING.spawnOnFeedMin = 0`
- `FOOD_TUNING.spawnOnFeedMax = 2`
- `FOOD_TUNING.corpseSpawnNutritionValue = 0.5`
- `FOOD_TUNING.normalFoodRewardMultiplier = 1.75`
- `FOOD_TUNING.randomSpawnChance = 0.08`
- `CORPSE_TUNING.deadDurationSeconds = 5`
- `CORPSE_TUNING.decayDurationSeconds = 10`
- `FITNESS_TUNING.mealWeight = 40`
- `FITNESS_TUNING.foodDeliveryWeight = 30`
- `FITNESS_TUNING.rewardContributionWeight = 100`

## Most Recent Observation
- the corpse conveyor-belt behavior is working and is visually strong
- corpse harvesting is readable and entertaining
- corpse cleanup is now real, so finished bodies churn out of the world
- queen overproduction is still the active tuning problem
- the latest local tuning is intended to slow corpse-driven spawning and make real food more valuable than corpse-food

## What To Watch For
Positive signs:
- corpse food still feels active and fun after half-value corpse nutrition
- fewer runaway baby-ant surges when corpse traffic is high
- normal map food clearly outcompetes corpse food as the better evolutionary target
- the queen queue remains readable under heavy corpse traffic
- the small random-spawn trickle adds freshness without turning lineage into noise

Warning signs:
- corpse-driven queen meal queues still balloon too quickly
- spawn bursts still feel excessive even with `0-2` per spawn unit and half-value corpse nutrition
- corpse harvesting still overwhelms normal map-food behavior
- the new random-spawn trickle feels either too noisy or too weak to matter

## Best Short Notes To Capture
When you return, the most useful observations will be:
- whether queen throughput now feels correct or still too generous
- whether normal food now feels meaningfully better than corpse food
- whether the queen queue remains readable under corpse-heavy runs
- whether the small random-spawn trickle is noticeable or needs retuning

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
Read PROJECT_STATUS.md, SESSION_NOTES.md, and RESTART_HANDOFF.md. We are in Phase 11 - Death + Recycling. Corpses can decay, fall, be harvested as one-load food, contribute limited genome influence, and now leave the world after decay. Queen meal spawning uses a nutrition buffer where corpse deliveries count as half a spawn unit, normal food is rewarded more strongly, and a small random-spawn chance exists for queen births. Help me test the current tuning in src/config/tuning.js and decide whether queen throughput still needs damping.
```
