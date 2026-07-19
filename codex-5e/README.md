# Codex — 5e Character Sheet (PWA)

Professional D&D 5th Edition character sheet for phone and desktop. Built as a new app alongside (not replacing) [kirito-mana-app](../kirito-mana-app/).

## What’s inside

- Full **5e SRD spell database** (319 spells) with casting time, range, components, duration, description, and higher-level notes
- Spells **categorized by level** and filterable by school / search / class list
- All **12 SRD classes** in a Profile dropdown
- Selecting a class **auto-applies**:
  - Hit dice
  - Saving throw proficiencies
  - Armor / weapon / tool proficiency text
  - Skill choice guidance
  - Class features (with descriptions) up to your level
  - Spell slots known at your level (when applicable)
  - That class’s full spell list in the Spellbook tab
- Combat vitals, death saves, gear, portrait, backup/export
- Offline saves on this device (`localStorage`)

## Name

**Codex** — a professional 5e sheet & reference, not a “spells app.”

## Local preview

```bash
cd codex-5e
python3 -m http.server 4174
```

Open `http://YOUR_COMPUTER_IP:4174` (same Wi‑Fi).

## Tabs

| Tab | What it is |
|---|---|
| Combat | Vitals, death saves, long rest, log |
| Stats | Abilities + auto class saves + feature list |
| Spells | SRD spellbook with filters & casting details |
| Gear | Equipment list |
| Profile | Class picker + sheet fields + backup |

## Data & license

Spell and class content comes from the **D&D 5e SRD 5.1** (via [dnd5eapi.co](https://www.dnd5eapi.co/)), © Wizards of the Coast, used under **CC-BY-4.0**.

This is the SRD catalog (not every spell from every commercial book). Non-SRD books can be layered later.

## Related

- Original mana / sword-skill app: [kirito-mana-app](../kirito-mana-app/)
- Homebrew CSVs: [kirito-mana-system](../kirito-mana-system/)
