# Kirito Mana System (Aincrad / Season 1)

Google Sheets–friendly homebrew for a D&D-style Kirito kit: **sword skills cost mana**, not spell slots. Start at **100 mana**.

## Import into Google Sheets

1. Create a new Google Sheet.
2. **File → Import → Upload** each CSV in this folder (or copy-paste).
3. Recommended tab names:
   - `Skills` ← `skills.csv`
   - `Tracker` ← `mana-tracker.csv`
   - `Log` ← `combat-log.csv`
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

### Dual Blades (Unique Skill)
| Skill | Hits | Role |
|---|---:|---|
| Double Circular | 2 | Dual opener |
| Cross Block | — | Dual defense |
| Starburst Stream | 16 | High ultimate |
| The Eclipse | 27 | Peak ultimate |

Kirito estimates Dual Blades has **20+** techniques; only these are clearly documented for Aincrad.

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

Assume:
- `Tracker!B3` = Max Mana (100)
- `Tracker!B4` = Current Mana
- `Log` columns: `A` Round, `B` Skill, `C` Cost, `D` Regen, `E` Before, `F` After

### Lookup cost from Skills tab
In `Log!C2` (skill name typed in `B2`):

```
=IF(B2="","",IFERROR(VLOOKUP(B2,Skills!A:E,5,FALSE),0))
```

### Mana before / after
`Log!E2` (before):

```
=IF(A2="","",IF(ROW()=2,Tracker!$B$4,F1))
```

`Log!F2` (after):

```
=IF(A2="","",MAX(0,MIN(Tracker!$B$3,E2-C2+D2)))
```

### Auto regen (Package A) in `Log!D2`
Put last skill tier in Skills column D, then:

```
=IF(B2="","",
  IF(VLOOKUP(B2,Skills!A:D,4,FALSE)="Ultimate",0,
    5
    + IF(VLOOKUP(B2,Skills!A:D,4,FALSE)="Basic",2,0)
  )
)
```

For “no skill” turns, leave Skill blank and set Regen manually to `10`.

### Current mana mirror
`Tracker!B4`:

```
=IFERROR(LOOKUP(2,1/(Log!F:F<>""),Log!F:F),B3)
```

### Can I afford this skill?
In `Skills!H2` (drag down):

```
=IF(E2<=Tracker!$B$4,"READY","NOT ENOUGH MANA")
```

---

## Quick play loop

1. Start fight at 100.
2. Announce skill → pay mana → resolve hits / post-motion drawback.
3. End of turn / start of next turn: apply regen package.
4. If mana < cheapest useful skill, fight with normal attacks only (0 mana) until regen catches up.
5. Starburst / Eclipse only when the table moment is worth the empty bar.

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

Default pack in `skills.csv` targets **anime boss drama** on a **100** pool with Package A regen.
