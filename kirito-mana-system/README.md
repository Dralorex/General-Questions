# Kirito Mana System (Aincrad / Season 1)

Google Sheets–friendly homebrew for a D&D-style Kirito kit: **sword skills cost mana**, not spell slots. Start at **100 mana**.

Skills are **level-gated**, then must be **trained** before you can use them. Dual wield is hard-locked until **Level 10**.

**Master table (best GitHub view):** [MASTER-SKILLS.md](MASTER-SKILLS.md)

## Import into Google Sheets

1. Create a new Google Sheet.
2. **File → Import → Upload** each CSV in this folder (or copy-paste).
3. Recommended tab names:
   - `Skills` ← `skills.csv`
   - `LevelUnlocks` ← `level-unlocks.csv`
   - `Progress` ← `character-progress.csv`
   - `Training` ← `training-tracker.csv`
   - `TrainingLog` ← `training-log.csv`
   - `Tracker` ← `mana-tracker.csv`
   - `Log` ← `combat-log.csv`
   - `QuickRef` ← `quick-reference.csv`
   - `Rules` ← paste the rules below into a text tab

## Known Aincrad sword skills (Kirito focus)

Canon does **not** publish a full skillbook dump for anime-only Kirito. This list is the practical Aincrad kit: skills he is shown using, plus core One-Handed Sword skills that belong to that weapon tree.

### One-Handed Sword
| Skill | Hits | Role |
|---|---:|---|
| Horizontal | 1 | Basic |
| Vertical | 1 | Basic |
| Slant | 1 | Basic |
| Uppercut | 1 | Basic |
| Rage Spike | 1 | Gap-closer |
| Sonic Leap | 1 | Charge / leap |
| Vertical Arc | 2 | Short combo |
| Horizontal Arc | 2 | Short combo |
| Snake Bite | 2 | Weapon disrupt |
| Sharp Nail | 3 | Mid combo (Progressive) |
| Horizontal Square | 4 | Mid combo |
| Vertical Square | 4 | Mid combo |
| Vorpal Strike | 1 | Signature heavy thrust |

### Other Aincrad kit
| Skill | Hits | Role |
|---|---:|---|
| Meteor Break | 7 | Sword + martial composite |
| Embracer | 1 | Unarmed pierce |
| Single Shot | 1 | Blade throw |

### Utility (homebrew / anime movement)
| Skill | Mana | Action Type | Role |
|---|---:|---|---|
| Retreat | 2 | Bonus Action | Backstep / “switch”; 15 ft backward, no OA, 1/turn |
| Deflect | 10 | Special Reaction | Guard a melee hit; **unlimited/turn** while you have mana |

### Dual Blades (Unique Skill)
| Skill | Hits | Role |
|---|---:|---|
| Double Circular | 2 | Dual opener |
| Cross Block | — | Dual defense (uses normal Reaction) |
| Starburst Stream | 16 | High ultimate |
| The Eclipse | 27 | Peak ultimate |

Kirito estimates Dual Blades has **20+** techniques; only these are clearly documented for Aincrad.

### Skills CSV columns
`skills.csv` now includes: **Action Type**, **Range**, **Shape**, **AoE**, **Target**, **Duration**, **Use Limit**, plus level/training/prereq/effect.

---

## Level locks + training (core loop)

Every skill has two gates:

1. **Level gate** — reaching the required level marks the skill **Unlocked** (available to train). It is still unusable.
2. **Training gate** — spend training sessions until `Sessions Completed >= Training Sessions Needed`. Then it becomes **Learned** and can spend mana in combat.

### Status meanings

| Status | Meaning | Usable in combat? |
|---|---|---|
| Locked | Level too low and/or prerequisite missing | No |
| Unlocked | Level + prereq met; not trained yet | No |
| Training | At least 1 session invested, not finished | No |
| Learned | Training complete | Yes |

Starter kit at Level 1:
- **Horizontal** and **Vertical** → auto-Learned
- **Slant** → Unlocked, needs 1 training session

### How to earn training sessions

Pick one package and stick to it.

**Package T1 — Downtime (simple)**  
- 1 hour of focused drill = **1 session** toward one Unlocked/Training skill.
- Max **2 sessions per long rest** (stops overnight spam).
- Sparring with a mentor / party member who already knows a related skill: +1 bonus session (once per skill).

**Package T2 — Check-based (more SAO)**  
During downtime, roll `d20 + proficiency + DEX or STR`:
- DC 10 Basic / Utility
- DC 12 Mobility / Combo
- DC 14 Mid / Dual / Defense
- DC 16 Power / Composite
- DC 18 Ultimate / Unique Skill Gate  
Success = 1 session. Beat DC by 5+ = 2 sessions. Failure = 0 (wasted hour, no penalty). Natural 1 = pull a muscle: no training until next long rest.

**Package T3 — Field training**  
If you land 3 successful normal (non-skill) weapon attacks in one fight while an Unlocked skill is queued, gain 1 session toward it after the fight. Still capped at 2 sessions / long rest.

### Prerequisites

Some skills need another skill already **Learned** (see `skills.csv` Prerequisite column).  
Example: Meteor Break needs **Embracer** and **Vertical Square** Learned first.

If you level past a skill but lack the prereq, it stays **Locked** until the prereq is Learned.

---

## Dual wield level lock (Level 10)

Dual-wield sword skills are **fully locked before Level 10**.

Until all three are true, you cannot:
- fight with two swords for Dual Blades skills
- train Double Circular / Cross Block / Starburst / Eclipse
- mark Dual Blades as Learned

### Unlock checklist
1. Reach **Level 10**
2. Have **Vorpal Strike** Learned
3. Complete the **Reaction Trial** (below)
4. Spend **5 training sessions** on `Dual Blades (Unique Skill)`
5. Then Double Circular becomes Unlocked and can be trained (3 sessions)

### Reaction Trial (table option)
Once at Level 10, the GM runs one of these:

- **Duel test:** win or survive 5 rounds against a tough sparring partner / floor elite while using only one sword  
- **Initiative trial:** win 3 contested Initiative checks in a row (`d20 + DEX + proficiency`) against a CR-appropriate foe  
- **Story beat:** clear a named mid-tier boss / floor event the table treats as your “system recognition” moment

On success, set `Progress! Dual Blades` path open and begin the 5-session Unique Skill training.

### Dual progression after the gate

| Level | Dual content |
|---:|---|
| 10 | Dual Blades Unique Skill + Double Circular |
| 11 | Cross Block |
| 14 | Starburst Stream (train 6 sessions) |
| 18 | The Eclipse (train 8 sessions) |

---

## Level unlock roadmap

| Level | Becomes trainable |
|---:|---|
| 1 | Horizontal, Vertical (known); Slant |
| 2 | Uppercut, Single Shot |
| 3 | Rage Spike |
| 4 | Sonic Leap, Vertical Arc |
| 5 | Horizontal Arc |
| 6 | Snake Bite, Sharp Nail |
| 7 | Horizontal Square, Vertical Square |
| 8 | Embracer (+ Martial Arts slot) |
| 9 | Vorpal Strike |
| 10 | **Dual Blades gate** + Double Circular |
| 11 | Cross Block |
| 12 | Meteor Break |
| 14 | Starburst Stream |
| 18 | The Eclipse |

Full row detail is in `level-unlocks.csv`.

---

## Mana cost design (100 pool)

### Formula used

```
mana ≈ (hits × 3) + tier_tax + special_tax
```

Tier taxes:
- Basic: +1
- Mobility: +5 to +7
- Combo: +4
- Mid: +6
- Power: +10 to +19 (single hard hit or long composite)
- Dual: +10
- Defense: flat 8
- Ultimate: custom (meant to be rare)

### Balance goals at 100 mana
- Basics are spam-safe (~20–25 uses if you never regen).
- Mid skills (~18) are fight staples, not once-per-day.
- Vorpal / Meteor Break are big spends (2–4 per fight without heavy regen).
- Starburst Stream (~48) is a boss turn, not every trash pack.
- The Eclipse (~80) is a near-empty-bar finisher.

If fights feel too short on mana, lower all costs by **2** or raise Max Mana to **120**.  
If ultimates feel free, raise Starburst to **55** and Eclipse to **90**.

---

## Regeneration (pick one package)

### Package A — “System Cooling” (recommended for combat)
Best SAO feel: skills leave you stiff, then the system recovers.

| When | Regen |
|---|---|
| Start of your turn | **+5 mana** (always) |
| If you used only a Basic skill last turn | **+2 bonus** (total +7) |
| If you used no skill last turn | **+5 bonus** (total +10) |
| If you used an Ultimate last turn | **0 this turn** (hard cooling) |
| Short rest (1 hour) | Recover **50 mana** |
| Long rest | Recover **all mana** |

Optional: max mana cannot go above 100 unless you take a “Mana Crystal / Floor Clear” boon.

### Package B — “Breathing Room” (simpler table)
- **In combat:** regain **1d6 + CON mod** mana at the start of each turn (min 3).
- **Out of combat:** regain **10 mana per minute** of rest (light activity ok).
- **Short rest:** full to 100 if you spent no ult this fight; otherwise to 75.
- **Long rest:** full.

### Package C — “Dungeon Crawl”
- No per-turn regen in combat.
- After each encounter: regain **15 mana**.
- Short rest: **+40**.
- Long rest: full.
- Potions / crystals: +20 / +50.

---

## Google Sheets formulas

Assume tabs named as in the import list above.

`Skills` columns (from `skills.csv`):
`A` Skill · `B` Category · `C` Hits · `D` Tier · `E` Mana · `F` Level Required · `G` Training Sessions · `H` Prerequisite

`Training` columns (from `training-tracker.csv`):
`A` Skill · `B` Level Required · `C` Needed · `D` Completed · `E` Prereq Met · `F` Level Met · `G` Status · `H` Learned?

`Progress!B2` = Current Level  
`Tracker!B4` = Max Mana · `Tracker!B5` = Current Mana  
`Log` columns: `A` Round · `B` Skill · `C` Cost · `D` Regen · `E` Before · `F` After

### Auto Level Met?
In `Training!F2` (drag down):

```
=IF(Progress!$B$2>=B2,"YES","NO")
```

### Auto Status
In `Training!G2` (drag down):

```
=IF(H2="YES","Learned",
  IF(OR(E2="NO",F2="NO"),"Locked",
    IF(D2<=0,"Unlocked",
      IF(D2<C2,"Training","Learned"))))
```

### Auto Learned?
In `Training!H2` (drag down):

```
=IF(OR(A2="Horizontal",A2="Vertical"),"YES",IF(AND(E2="YES",F2="YES",D2>=C2),"YES","NO"))
```

(Keep Horizontal/Vertical forced YES, or delete that OR once you are fine managing starters manually.)

### Combat: only Learned skills spend mana
In `Log!C2`:

```
=IF(B2="","",
  IF(IFERROR(VLOOKUP(B2,Training!A:H,8,FALSE),"NO")<>"YES",
    "NOT LEARNED",
    IFERROR(VLOOKUP(B2,Skills!A:E,5,FALSE),0)))
```

### Mana before / after
`Log!E2`:

```
=IF(A2="","",IF(ROW()=2,Tracker!$B$5,F1))
```

`Log!F2`:

```
=IF(OR(A2="",C2="NOT LEARNED"),"",MAX(0,MIN(Tracker!$B$4,E2-C2+D2)))
```

### Auto regen (Package A) in `Log!D2`

```
=IF(OR(B2="",C2="NOT LEARNED"),"",
  IF(VLOOKUP(B2,Skills!A:D,4,FALSE)="Ultimate",0,
    5
    + IF(VLOOKUP(B2,Skills!A:D,4,FALSE)="Basic",2,0)
  )
)
```

For “no skill” turns, leave Skill blank and set Regen manually to `10`.

### Current mana mirror
`Tracker!B5`:

```
=IFERROR(LOOKUP(2,1/(Log!F:F<>""),Log!F:F),B4)
```

### Ready check on Skills sheet
In `Skills!K2` (drag down):

```
=IF(IFERROR(VLOOKUP(A2,Training!A:H,8,FALSE),"NO")<>"YES","LOCKED/UNTRAINED",
  IF(E2<=Tracker!$B$5,"READY","NOT ENOUGH MANA"))
```

### Dual Blades gate flag
In `Progress!B5` (`Dual Blades Unlocked?`):

```
=IF(AND(Progress!B2>=10,Progress!B6="YES",IFERROR(VLOOKUP("Dual Blades (Unique Skill)",Training!A:H,8,FALSE),"NO")="YES"),"YES","NO")
```

Set `Progress!B6` (`Reaction Trial Completed?`) to `YES` manually when the trial is beaten.

---

## Quick play loop

### Between sessions / on level-up
1. Increase Current Level.
2. Check `LevelUnlocks` for newly Unlocked skills.
3. Confirm prerequisites are Learned.
4. Train (downtime / checks / field training) until sessions fill.
5. Mark Learned — only then it can spend mana.

### In combat
1. Start fight at current mana (max 100 unless you house-rule growth).
2. Announce a **Learned** skill → pay mana → resolve hits / post-motion.
3. Apply regen package each turn.
4. If mana is too low, use normal attacks (0 mana) and keep training progress for later.
5. Dual skills stay illegal until the Level 10 gate is fully cleared.

## Suggested post-motion (D&D translation)

| Spend | Post-motion drawback |
|---|---|
| 1–10 mana | None |
| 11–20 | Cannot take reactions until your next turn |
| 21–40 | Speed halved until your next turn |
| 41+ | Speed 0 and attacks against you have advantage until end of next turn |

That keeps Ultimates scary for *you* as well as the boss.

---

## Tuning knobs

| Knob | Safer / longer fights | Spikier / anime fights |
|---|---|---|
| Max Mana | 120–150 | 80–100 |
| Per-turn regen | +7 / +10 | +3 / +5 |
| Starburst cost | 40 | 55–60 |
| Eclipse uses | 1/short rest | 1/long rest only |
| Basic cost | 3 | 5 |
| Dual Blades unlock level | 8–9 | 10–12 |
| Training sessions / skill | −1 across board | +1 or harder DCs |
| Sessions per long rest | 3 | 1–2 |

Default pack targets **anime boss drama** on a **100** pool, Package A regen, and a **Level 10 dual-wield lock** with train-to-learn after each level unlock.
