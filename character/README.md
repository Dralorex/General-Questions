# Character — layered piece creator

Phone / desktop web app for building characters from interchangeable pieces, then creating and sharing new pieces.

**Live URL:** https://dralorex.github.io/General-Questions/Character/

## Features

- **Bodies** always include undergarments; heads **recolor to match** the selected body’s skin
- **Heads** share a slender, smoothly flared neck owned by the body (no hard stump join)
- **Hair** variants with `under-hat` regions that **hide when a hat is equipped**
- Softer, more organic clothing / gear silhouettes (less blocky geometry)
- Slots for clothing, weapons, items, hats, glasses, props, bases, and backgrounds
- **Create** mode: upload art or paste SVG, pick a slot, nudge position/scale/rotation, preview on a live character, then save
- **Publish** to a community pack → **Export pack** JSON for others to **Import**, or ship updates in `data/community.json`
- **Safety**: keyword + image heuristics block inappropriate **public** posts (device-only save still allowed); publish agreement; moderator bans by IP / publisher ID / author
- Save looks, randomize, export PNG

## Modes

| Mode | What it does |
|---|---|
| **Build** | Equip official + community + your pieces |
| **Create** | Make a new piece, preview placement, publish |
| **Library** | Saved looks, your creations, community pack import/export |
| **Mod** | Unlock with passcode — who posted what, ban IP/publisher |
| **Admin** | Unlock with same passcode — move pieces, change layer order, export overrides |

## Admin piece layout

After **Library → Admin / Mod unlock** (passcode in `data/moderation.js`):

1. Open the **Admin** tab — start in **folder boxes** (Body, Head, Hair, Face, Hands, Clothing, Items, Props, Scenes)
2. Open a folder to see **item boxes** with preview thumbnails
3. Select an item to open the **editor** (place, layer, draw)
4. Drag / sliders / draw tools; use **Undo** / **Redo**
5. **Save override**, go back with ← Items / ← Folders, then **Export overrides** → commit as `data/piece-overrides.json` and deploy

Overrides apply for everyone once shipped; locally they apply immediately after save.

## Publish rules & moderation

1. First public publish shows an **agreement**: inappropriate public posts can permanently ban publishing.
2. Before publish, content is scanned (blocked words in name/author/SVG + a skin-coverage heuristic on uploaded images).
3. If flagged → user is told the item **can only be saved on their device** and is **not allowed** on the public database.
4. Each public piece stores **author**, **publisher ID**, and **IP** (via ipify when reachable).
5. Moderators unlock with the passcode in `data/moderation.js` (`MOD_PASSCODE`, default `dralorex-mod`), then can:
   - Review **who posted what**
   - **Ban IP / publisher ID / author**
   - Remove pieces
   - **Export bans.json** → commit to `data/bans.json` and deploy so every visitor loads the bans

**Note:** GitHub Pages is static. Bans are enforced in the app when `bans.json` / local ban list is loaded. Change the mod passcode before relying on it; client-side unlock is not cryptographic security.

## Community sharing (no server database)

1. Create a piece → check **Publish to public / community library** (after agreeing to rules)
2. **Library → Export pack** → share the JSON file
3. Others **Import pack** (or **Fetch shared pack** to load `data/community.json`)

## Piece format

```json
{
  "id": "unique-id",
  "slot": "hat",
  "name": "Travel Hood",
  "author": "you",
  "publisherId": "pub-…",
  "publisherIp": "203.0.113.10",
  "svg": "<g>...</g>",
  "underHat": false,
  "transform": { "x": 0, "y": 0, "scale": 1, "rotate": 0 },
  "published": true,
  "source": "community"
}
```

Hair (and any uploaded art with **Mark as under-hat**) should wrap crown volume in `<g class="under-hat">...</g>` so hats can hide clipping hair.

Stage size is **400×560**. Neck joint is centered near `(200, 148)`.

## Cache busting

Every Character change must bump `CHARACTER_CACHE_BUST` in `data/version.js` and the matching `?v=` query params in `index.html`. The page clears Cache Storage once per new bust token so phones pick up fresh art/scripts after deploy.

| Path | Role |
|---|---|
| `index.html` | App shell |
| `styles.css` | UI |
| `app.js` | Composer, creator, library, moderation UI |
| `data/slots.js` | Slot order + metadata |
| `data/catalog.js` | Official SVG pieces |
| `data/community.json` | Shared published pack |
| `data/moderation.js` | Agreement copy, blocklist, scanners, mod passcode |
| `data/piece-overrides.json` | Admin placement / layer overrides |
| `data/bans.json` | Shipped IP / publisher / author bans |
