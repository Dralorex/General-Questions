# D&D Character Sheet (in Aincrad Mana app)

Full 5e-style sheet fields live in the phone PWA (`kirito-mana-app/`), saved on-device.

## Tabs

| Tab | Purpose |
|---|---|
| Combat | HP / AC / speed / initiative / death saves + sword skills |
| Stats | Ability scores, saving throws, skills + proficiency toggles |
| Skills | Aincrad sword-skill kit (mana) |
| Train | Unlock / train sword skills |
| Gear | Custom equipment list |
| Profile | Name, level, XP, coins, portrait, backstory, features, vitals |

## Ability → skills

| Ability | Skills (each includes Saving Throw) |
|---|---|
| Strength | Saving Throw, Athletics |
| Dexterity | Saving Throw, Acrobatics, Sleight of Hand, Stealth |
| Constitution | Saving Throw |
| Intelligence | Saving Throw, Arcana, History, Investigation, Nature, Religion |
| Wisdom | Saving Throw, Animal Handling, Insight, Medicine, Perception, Survival |
| Charisma | Saving Throw, Deception, Intimidation, Performance, Persuasion |

**Math**
- Ability modifier = `floor((score − 10) / 2)`
- Skill / save total = ability mod + proficiency bonus (if checked)
- Proficiency bonus by level: Lv1–4 +2 · 5–8 +3 · 9–12 +4 · 13–16 +5 · 17–20 +6
- Passive Perception = `10 + Perception modifier`
- Initiative = DEX mod + editable initiative bonus

## Hit points

- **Current** may go **above max** when healing with +1 / +5
- **Temp HP** is separate; set manually
- **Displayed total** = current + temp
- Damage removes **temp first**, then current
- Buttons: `−5` `−1` **Heal All** `+1` `+5`
- **You've been healed!** clears death saves (does not wipe other data)

## Death saves

- 3 success pips · 3 failure pips (hollow → filled)
- 3 failures → Dark Souls-style **YOU DIED** overlay · Return closes without wiping data
- 3 successes → **YOU LIVE** overlay with a random short prompt

## Gear

Each item is its own card: **name**, dark divider, **description**, trash to remove.

## Profile extras

Portrait PNG/JPEG upload · class · race · background · alignment · hit dice · coins (CP/SP/EP/GP/PP) · appearance · personality · backstory · languages · class features · feats · equipment training & proficiencies · other notes · XP · name · level
