# RESTART_HANDOFF.md

## Return Target
Jump straight back into `Phase 10 - Traits + Mutation` observation.

The important fact on return: the aggressive upward-progress tuning pass is already live in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js). We are not planning it anymore; we are testing it.

## First 3 Things To Do
1. Launch the sim.
2. Switch to `Batch` or `Headless` if you want fast season turnover.
3. Watch whether ants start building upward toward the third food earlier and more often than before.

## Best Buttons On Return
- `Normal`: best for close visual reading once interesting behavior appears
- `No Display`: normal-speed simulation without redraw cost
- `Headless`: moderate fast-forward
- `Batch`: strongest browser fast-forward for season cycling
- `Food Scent Map`: optional, only if scent contours matter for the observation

## What Changed Most Recently
Recent live tuning changes in [tuning.js](/d:/dev/ANTZ/src/config/tuning.js):
- `connectionTreeClimberMultiplier` `1.5 -> 2.1`
- `connectionTreeBaseReward` `1 -> 1.25`
- `rewardContributionWeight` `45 -> 80`
- `foodDeliveryWeight` `60 -> 110`
- `spawnOnFeedMin/Max` `2..6 -> 3..8`
- `baseLifespanSeconds` `90 -> 100`
- `mealRestoreSeconds` `90 -> 105`
- `climbIntentThreshold` `0.18 -> 0.14`
- `climbHorizontalRange` `22 -> 26`
- `graspPollMaxNeighbors` `4 -> 5`
- `graspSuccessThresholdPerAnt` `0.5 -> 0.46`
- `graspHoldThreshold` `0.35 -> 0.31`
- `graspPollCooldownMax` `1.4 -> 1.15`
- `randomShare` `0.4 -> 0.3`
- `fitnessCloneShare` `0.2 -> 0.25`
- `connectionTreeShare` `0.4 -> 0.45`

## What To Watch For
Positive signs:
- earlier tower formation beneath middle and third food
- more ants reaching the second and third food in fewer seasons
- stronger population bursts after successful deliveries
- colonies that look more biased toward climbers and scaffold builders

Warning signs:
- ants still farming only the easiest food
- population explosions without better upward progress
- too much chaotic grasping without stable climb chains
- success that feels too map-specific or overly forced

## Best Short Notes To Capture
When you return, the most useful observations will be:
- first season where ants reliably touch the third food
- whether the middle food now gets harvested routinely
- whether the third-food attempts come from towers, wall use, or both
- whether easy-food farming still dominates reproduction
- whether the new tuning feels fun or too artificial

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
Read PROJECT_STATUS.md, SESSION_NOTES.md, and RESTART_HANDOFF.md. We are in Phase 10 observing the aggressive upward-progress tuning pass. Help me assess whether ants are reaching the third food more effectively and which dials to keep or soften.
```
