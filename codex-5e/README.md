# Codex — 5e Character Sheet (PWA)

Professional D&D 5th Edition character sheet for phone and desktop. Built as a new app alongside (not replacing) [kirito-mana-app](../kirito-mana-app/).

## How to run it

### On your computer (easiest)

1. Open a terminal in this repo.
2. Start a local server:

```bash
cd codex-5e
python3 -m http.server 4174
```

3. In your browser, open: **http://localhost:4174**

Leave the terminal open while you use the app. Press `Ctrl+C` to stop the server.

### On your phone (same Wi‑Fi)

1. Find your computer’s local IP (example: `192.168.1.20`).
2. On your phone’s browser open: `http://YOUR_IP:4174`
3. Optional: **Add to Home Screen** so it feels like an app.

Progress saves in that browser on that device. Use **Profile → Export Backup** for a JSON copy.

## What’s inside

- Full **5e SRD spell database** (319 spells) with casting details
- Spells categorized by level + filters (school / search / class list)
- All **12 SRD classes** in a Profile dropdown with auto-applied features, saves, hit dice, and spell list
- **Notes** tab: nested folders, tags, search
- Combat vitals, death saves, gear, portrait, backup/export
- Offline saves on this device (`localStorage`)

## Quick start in the app

1. **Profile** → pick a **Class** (e.g. Sorcerer) and set your **Level**
2. **Stats** → see auto save proficiencies + class features
3. **Spells** → browse that class’s spell list (or uncheck “Class list only”)
4. **Notes** → `+ Folder` (e.g. Tavern Talks) → open it → `+ Note` → add tags like `npc, quest`
5. Nested folders: open a folder, then `+ Folder` again for a subfolder

## Tabs

| Tab | What it is |
|---|---|
| Combat | Vitals, death saves, long rest, log |
| Stats | Abilities + auto class saves + feature list |
| Spells | SRD spellbook with filters & casting details |
| Gear | Equipment list |
| Notes | Nested folders + tagged notes |
| Profile | Class picker + sheet fields + backup |

## Data & license

Spell and class content comes from the **D&D 5e SRD 5.1** (via [dnd5eapi.co](https://www.dnd5eapi.co/)), © Wizards of the Coast, used under **CC-BY-4.0**.

## Related

- Original mana / sword-skill app: [kirito-mana-app](../kirito-mana-app/)
- Homebrew CSVs: [kirito-mana-system](../kirito-mana-system/)
