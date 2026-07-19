# Codex — 5e Character Sheet (PWA)

Professional D&D 5th Edition character sheet for phone and desktop. Built as a new app alongside (not replacing) [kirito-mana-app](../kirito-mana-app/).

## How to run it

### On your phone (web app — use this now)

**Open Codex:** https://dralorex.github.io/General-Questions/codex/

**Hub (both apps):** https://dralorex.github.io/General-Questions/

Then optionally **Add to Home Screen** so it opens like an app.

- iPhone (Safari): Share → **Add to Home Screen**
- Android (Chrome): Install app / Add to Home screen

Your progress saves on that phone’s browser. Mana lives at a **separate** URL: [/mana/](https://dralorex.github.io/General-Questions/mana/).

### On your computer (local)

```bash
cd codex-5e
python3 -m http.server 4174
```

Open **http://localhost:4174**

## What’s inside

- Full **5e SRD spell database** (319 spells) with casting details
- Spells by level in **dropdowns**, with **checkboxes** to prepare / know spells (5e limits)
- Martial classes rename that tab (**Features / Rage / Ki / Tricks**) and show class features instead
- **Spell slots** tracked in Combat; quick-cast buttons spend slots like skill buttons
- Full **5e SRD equipment + magic item** catalog — search and add from Gear
- Long rest restores all slots; warlock **pact slots** also restore on short rest
- All **12 SRD classes** in a Profile dropdown with auto-applied features, saves, hit dice, and spell list
- **Notes** tab: nested folders, tags, search
- Combat vitals, death saves, gear, portrait, backup/export
- Offline saves on this device (`localStorage`)
- **DM Link** (Profile): share a 6-character code so [DM Eye](../dm-eye/) can track your sheet live

## Quick start in the app

1. **Profile** → pick a **Class** (e.g. Sorcerer) and set your **Level**
2. **Stats** → set ability scores (prepared casters use the casting ability for how many you can prepare)
3. **Spells** → open a level dropdown → check spells until your known/prepared limit fills (rest gray out)
4. **Combat** → tap selected spells to spend slots; use Short/Long Rest to recover per 5e
5. **Notes** → `+ Folder` → `+ Note` → add tags like `npc, quest`
6. **DM Link** → turn **Share with DM** on → give the code to your DM

## Tabs

| Tab | What it is |
|---|---|
| Combat | Vitals, spell slots, quick-cast, short/long rest, log |
| Stats | Abilities + auto class saves + feature list |
| Spells / Features | Caster spellbook **or** martial class features (tab name follows class) |
| Gear | SRD equipment search + custom items |
| Notes | Nested folders + tagged notes |
| Profile | Class picker + sheet fields + backup |

## Data & license

Spell, class, equipment, and magic-item content comes from the **D&D 5e SRD 5.1** (via [dnd5eapi.co](https://www.dnd5eapi.co/)), © Wizards of the Coast, used under **CC-BY-4.0**.

## Related

- Original mana / sword-skill app: [kirito-mana-app](../kirito-mana-app/)
- DM live tracker: [dm-eye](../dm-eye/)
- Homebrew CSVs: [kirito-mana-system](../kirito-mana-system/)
- Pages URLs: [PAGES-SETUP.md](PAGES-SETUP.md)
