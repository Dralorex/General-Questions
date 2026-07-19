# Training System

How sword skills are unlocked and learned in this homebrew.

## Core loop

1. **Reach the unlock level** → skill becomes available to train  
2. **Meet prerequisites** (other skills already Learned)  
3. **Complete training sessions** (drills / checks / field goals)  
4. Skill becomes **Learned** → can spend mana in combat  

Starters (Horizontal, Vertical, Slant, Retreat, Deflect, Rage Spike) skip training.

## Time rules

| Rule | Default |
|---|---|
| 1 training session | **1 hour** focused downtime (some skills use 1.5–2 hr sessions) |
| Max sessions | **2 per long rest** |
| Optional check | `d20 + proficiency + STR or DEX` vs skill **Train DC** |
| Beat DC by 5+ | Counts as **2 sessions** that hour |
| Natural 1 | No more training until next long rest |
| Field goal | Complete once in play → **+1 bonus session** (once per skill) |

**Rough calendar time** = `sessions × hours each`, spread across rests (usually ~2 sessions/day of downtime).

Example: Dual Blades gate = 4 × 1.5 hr = **~6 hours** (+ Reaction Trial).

## Dual Blades unlock — **Level 3**

All dual skills stay locked until:

1. Character is **Level 3+**
2. **Uppercut** is Learned  
3. **Reaction Trial** completed (3 contested Initiatives, or survive 5 rounds one-sword vs a tough spar / story beat)  
4. **4 training sessions** on `Dual Blades (Unique Skill)` (~6 hours)

Then Double Circular (and later dual tree) can be trained.

## Unlock roadmap

| Lvl | Becomes trainable |
|---:|---|
| 1 | Starters (auto-Learned) |
| 2 | Uppercut · Night Needle |
| 3 | **Dual Blades gate** · Double Circular · Fade Slash |
| 4 | Sonic Leap · Vertical Arc · Cross Block |
| 5 | Horizontal Arc · Bolt Spiral |
| 6 | Snake Bite · Sharp Nail |
| 7 | Horizontal Square · Vertical Square |
| 8 | Embracer · Grave Bind |
| 9 | Vorpal Strike |
| 10 | Twin Meteor |
| 11 | Scarlet Orbit |
| 12 | Meteor Break |
| 13 | Hollow Fang |
| 14 | Starburst Stream |
| 15 | Ashen Requiem |
| 16 | Black Orbit |
| 17 | Eclipse Prelude |
| 18 | The Eclipse |

## Per-skill training card

| Skill | Lvl | Sessions | Hours/ea | Total hr | DC | Drill (short) |
|---|---:|---:|---:|---:|---:|---|
| Uppercut | 2 | 1 | 1 | 1 | 10 | 100 rising cuts from low guard |
| Night Needle | 2 | 1 | 1 | 1 | 10 | Quiet lunges; stop an inch from the mark |
| Dual Blades (gate) | 3 | 4 | 1.5 | 6 | 14 | Off-hand mirror drills + Reaction Trial |
| Double Circular | 3 | 3 | 1 | 3 | 13 | Dash L/R arcs between two poles |
| Fade Slash | 3 | 2 | 1 | 2 | 12 | Cut then snap-step past the mark |
| Sonic Leap | 4 | 2 | 1 | 2 | 12 | Leap-cuts; stick the landing |
| Vertical Arc | 4 | 2 | 1 | 2 | 12 | Carve clean V paths |
| Cross Block | 4 | 3 | 1 | 3 | 13 | Catch partner swings; riposte |
| Horizontal Arc | 5 | 2 | 1 | 2 | 12 | Left-right waist doubles |
| Bolt Spiral | 5 | 2 | 1 | 2 | 13 | Spin-advance through rings |
| Snake Bite | 6 | 3 | 1 | 3 | 14 | Safe disarm ladder on a stick |
| Sharp Nail | 6 | 3 | 1 | 3 | 14 | Three-beat zigzag on a rope |
| Horizontal Square | 7 | 3 | 1 | 3 | 14 | Trace a true floating square |
| Vertical Square | 7 | 3 | 1 | 3 | 14 | Vertical square on tall dummy |
| Embracer | 8 | 3 | 1 | 3 | 14 | Finger-spear into sandbags |
| Grave Bind | 8 | 2 | 1 | 2 | 13 | Clinch / elbow pins |
| Vorpal Strike | 9 | 4 | 1.5 | 6 | 16 | 10 ft ring thrusts |
| Twin Meteor | 10 | 4 | 1 | 4 | 15 | Alternating X-patterns |
| Scarlet Orbit | 11 | 4 | 1 | 4 | 15 | Circle posts, clip each hand |
| Meteor Break | 12 | 5 | 1.5 | 7.5 | 16 | Full 7-beat sword/martial kata |
| Hollow Fang | 13 | 4 | 1.5 | 6 | 16 | Twin thrusts, one hole |
| Starburst Stream | 14 | 6 | 2 | 12 | 18 | 16-beat kata under 12 seconds |
| Ashen Requiem | 15 | 5 | 1.5 | 7.5 | 17 | Five descending crescents |
| Black Orbit | 16 | 3 | 1 | 3 | 16 | Orbit guard 60 seconds |
| Eclipse Prelude | 17 | 6 | 2 | 12 | 18 | Half-Eclipse (8 beats) at night |
| The Eclipse | 18 | 8 | 2 | 16 | 20 | Full 27-beat Eclipse; restart on mistake |

Full drill text + field goals also appear in the app **Train** tab and in `kirito-mana-app/data/skills.js`.

## New gap-filler skills (summary)

| Skill | Role |
|---|---|
| Night Needle | Early thrust primer (Lv2) |
| Fade Slash | Afterimage step-cut (Lv3) |
| Bolt Spiral | Corkscrew approach combo (Lv5) |
| Grave Bind | Martial grab setup (Lv8) |
| Twin Meteor | Mid dual 4-hit (Lv10) |
| Scarlet Orbit | Dual AoE ring (Lv11) |
| Hollow Fang | Dual armor pierce (Lv13) |
| Ashen Requiem | Pre-Eclipse power (Lv15) |
| Black Orbit | Dual defensive stance (Lv16) |
| Eclipse Prelude | Final gate before Eclipse (Lv17) |
