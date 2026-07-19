# Master Skills Sheet

One-page GitHub view of the Kirito Aincrad mana kit.

**Max Mana:** 100 · **Flow:** Level unlocks → train sessions → Learned → usable · **Dual wield:** locked until Level 10

→ Full rules: [README.md](README.md) · CSVs: [skills.csv](skills.csv)

---

## Master table

| Skill | Mana | Lvl | Train | Hits | Tier | Category | Prerequisite | Effect (short) | Notes |
|---|---:|---:|---:|---:|---|---|---|---|---|
| Horizontal | 4 | 1 | 0 | 1 | Basic | One-Handed Sword | — | Melee +1d4 | Starter · auto-Learned |
| Vertical | 4 | 1 | 0 | 1 | Basic | One-Handed Sword | — | Melee +1d4 | Starter · auto-Learned |
| Slant | 4 | 1 | 1 | 1 | Basic | One-Handed Sword | — | Melee +1d4 | First train-to-learn |
| Uppercut | 5 | 2 | 1 | 1 | Basic | One-Handed Sword | Slant | Melee +1d6 | Stronger basic |
| Single Shot | 6 | 2 | 2 | 1 | Utility | Blade Throwing | — | Ranged 30/90 +1d6 | Thrown blade |
| Rage Spike | 8 | 3 | 2 | 1 | Mobility | One-Handed Sword | Uppercut | Dash 15 ft · melee +1d6 | Leap / upward |
| Sonic Leap | 10 | 4 | 2 | 1 | Mobility | One-Handed Sword | Rage Spike | Dash 20 ft · melee +1d8 | Charge staple |
| Vertical Arc | 10 | 4 | 2 | 2 | Combo | One-Handed Sword | Vertical | 2 melee (+1d4 each) | V-shape |
| Horizontal Arc | 10 | 5 | 2 | 2 | Combo | One-Handed Sword | Horizontal | 2 melee (+1d4 each) | L↔R pair |
| Snake Bite | 12 | 6 | 3 | 2 | Utility | One-Handed Sword | Horizontal Arc | 2 attacks · weapon disrupt | Break-style |
| Sharp Nail | 14 | 6 | 3 | 3 | Combo | One-Handed Sword | Vertical Arc | 3 melee (+1d4 each) | Progressive |
| Horizontal Square | 18 | 7 | 3 | 4 | Mid | One-Handed Sword | Horizontal Arc | 4 melee · +2 AC if all hit | 4-hit square |
| Vertical Square | 18 | 7 | 3 | 4 | Mid | One-Handed Sword | Vertical Arc | 4 melee (+1d6 each) | 4-hit square |
| Embracer | 14 | 8 | 3 | 1 | Utility | Martial Arts | — | Unarmed +2d8 · ignore nonmag armor | Martial Arts slot @ 8 |
| Vorpal Strike | 22 | 9 | 4 | 1 | Power | One-Handed Sword | Sonic Leap | Reach +5 ft · +2d8 · no reaction | Signature thrust |
| Dual Blades (Unique Skill) | 0 | 10 | 5 | — | Gate | Unique Skill Gate | Vorpal Strike + Reaction Trial | Unlocks dual-wield tree | **Dual lock lifts here** |
| Double Circular | 16 | 10 | 3 | 2 | Dual | Dual Blades | Dual Blades (Unique Skill) | Dash 15 ft · 2 dual attacks | First dual tech |
| Cross Block | 8 | 11 | 3 | — | Defense | Dual Blades | Double Circular | Reaction: disadv on 1 melee · riposte | Dual defense |
| Meteor Break | 28 | 12 | 5 | 7 | Power | Composite | Embracer + Vertical Square | 4d8 + STR · shove 10 ft | Sword + martial |
| Starburst Stream | 48 | 14 | 6 | 16 | Ultimate | Dual Blades | Double Circular + Cross Block | 6 attacks +3d8 · vulnerable after | Boss turn |
| The Eclipse | 80 | 18 | 8 | 27 | Ultimate | Dual Blades | Starburst Stream | 8 attacks +6d8 · 1/long rest | Peak finisher |

`Train` = training sessions needed after the level unlock. `0` = known at creation.

---

## Unlock by level

| Lvl | Skills that become trainable |
|---:|---|
| 1 | Horizontal, Vertical *(known)* · Slant |
| 2 | Uppercut · Single Shot |
| 3 | Rage Spike |
| 4 | Sonic Leap · Vertical Arc |
| 5 | Horizontal Arc |
| 6 | Snake Bite · Sharp Nail |
| 7 | Horizontal Square · Vertical Square |
| 8 | Embracer *(+ Martial Arts slot)* |
| 9 | Vorpal Strike |
| 10 | **Dual Blades gate** · Double Circular |
| 11 | Cross Block |
| 12 | Meteor Break |
| 14 | Starburst Stream |
| 18 | The Eclipse |

---

## Dual wield gate (Level 10)

All Dual Blades skills stay locked until **all** of these are true:

1. Character is **Level 10+**
2. **Vorpal Strike** is Learned
3. **Reaction Trial** completed
4. **5 training sessions** spent on `Dual Blades (Unique Skill)`

Then train: Double Circular (10) → Cross Block (11) → Starburst Stream (14) → The Eclipse (18)

---

## Status legend

| Status | Meaning | Combat use? |
|---|---|---|
| Locked | Level or prerequisite missing | No |
| Unlocked | Ready to train | No |
| Training | Sessions in progress | No |
| Learned | Training finished | Yes |
