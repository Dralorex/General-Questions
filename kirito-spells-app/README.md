# Kirito Spells (Phone PWA)

Duplicate of [kirito-mana-app](../kirito-mana-app/) with the mana kit, sword skills, and training removed. The Skills tab is kept and renamed to **Spells** (empty shell for now).

The original `kirito-mana-app/` is unchanged.

- Full D&D sheet: ability scores, saves/skills + proficiency, HP/temp, AC, speed, initiative, death saves
- Combat vitals + long rest
- **Spells** tab (empty shell for now)
- Equipment list, portrait upload, backstory / features / coins / XP
- **Saves on your phone** with `localStorage` — survives full app close
- Offline-capable after first load (service worker)
- Install to Home Screen (iPhone & Android)

## Local preview

```bash
cd kirito-spells-app
python3 -m http.server 4174
```

Then open `http://YOUR_COMPUTER_IP:4174` (same Wi‑Fi).

## What gets saved

Stored under key `kirito-sheet-pwa-v2` on **this device’s browser**:

- Name, level, XP, class / race / background
- Ability scores + D&D skill proficiencies
- HP / temp / AC / speed / death saves
- Equipment, portrait, notes, coins
- Combat log

Use **Profile → Export Backup** for a JSON copy you can import later.

## Tabs

| Tab | What it is |
|---|---|
| Combat | Vitals, death saves, long rest, log |
| Stats | Abilities + D&D skills / saves |
| Spells | Empty spellbook (ready to fill later) |
| Gear | Equipment list |
| Profile | Sheet fields + backup / reset |

## Related

- Original mana app: [kirito-mana-app](../kirito-mana-app/)
- D&D sheet reference: [kirito-mana-system/DND-SHEET.md](../kirito-mana-system/DND-SHEET.md)
