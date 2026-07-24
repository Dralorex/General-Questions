# Character — layered piece creator

Phone / desktop web app for building characters from interchangeable pieces, then creating and sharing new pieces.

**Live URL:** https://dralorex.github.io/General-Questions/Character/

## Features

- **Bodies** always include undergarments
- **Heads** share a common neck joint so they seat cleanly on any body
- **Hair** variants with `under-hat` regions that **hide when a hat is equipped**
- Slots for clothing, weapons, items, hats, glasses, props, bases, and backgrounds
- **Create** mode: upload art or paste SVG, pick a slot, nudge position/scale/rotation, preview on a live character, then save
- **Publish** to a community pack → **Export pack** JSON for others to **Import**, or ship updates in `data/community.json`
- Save looks, randomize, export PNG

## Modes

| Mode | What it does |
|---|---|
| **Build** | Equip official + community + your pieces |
| **Create** | Make a new piece, preview placement, publish |
| **Library** | Saved looks, your creations, community pack import/export |

## Community sharing (no server database)

GitHub Pages is static, so the “database” is pack-based:

1. Create a piece → check **Publish to community library**
2. **Library → Export pack** → share the JSON file
3. Others **Import pack** (or **Fetch shared pack** to load `data/community.json` from the site)

To make a piece visible to everyone by default, add it to [`data/community.json`](data/community.json) and merge to `main` (deploy picks it up).

## Piece format

```json
{
  "id": "unique-id",
  "slot": "hat",
  "name": "Travel Hood",
  "author": "you",
  "svg": "<g>...</g>",
  "underHat": false,
  "transform": { "x": 0, "y": 0, "scale": 1, "rotate": 0 },
  "published": true,
  "source": "community"
}
```

Hair (and any uploaded art with **Mark as under-hat**) should wrap crown volume in `<g class="under-hat">...</g>` so hats can hide clipping hair.

Stage size is **400×560**. Neck joint is centered near `(200, 148)`.

## Local files

| Path | Role |
|---|---|
| `index.html` | App shell |
| `styles.css` | UI |
| `app.js` | Composer, creator, library |
| `data/slots.js` | Slot order + metadata |
| `data/catalog.js` | Official SVG pieces |
| `data/community.json` | Shared published pack |
