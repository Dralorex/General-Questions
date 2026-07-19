# Shared modules

`dm-link.js` is the live DM Eye link protocol (short codes + MQTT snapshots).

Source of truth lives here. The deploy workflow copies it into:

- `codex/data/dm-link.js`
- `mana/data/dm-link.js`
- `dm-eye/data/dm-link.js`

Keep the in-repo copies under each app’s `data/` folder in sync when editing locally.
