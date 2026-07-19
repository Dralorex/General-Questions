# Aincrad Mana (Phone PWA)

Mobile-first Progressive Web App for the Kirito mana system.

- Combat mana tracker with quick buttons (Deflect / Retreat / Rage Spike / free basics)
- Skills browser + training unlocks
- Dual Blades Level 10 gate + Reaction Trial toggle
- **Saves on your phone** with `localStorage` — survives full app close
- Offline-capable after first load (service worker)
- Install to Home Screen (iPhone & Android)

## Open on your phone

PWAs need a secure origin (`https://` or `localhost`).

### Option A — GitHub Pages (after merge)
1. Enable Pages on this repo (Settings → Pages → Deploy from `main` / `/kirito-mana-app` or root).
2. Open the app URL on your phone.
3. **iPhone (Safari):** Share → **Add to Home Screen**
4. **Android (Chrome):** menu → **Install app** / **Add to Home screen**

### Option B — Local network preview
From the repo root:

```bash
cd kirito-mana-app
python3 -m http.server 4173
```

Then on your phone (same Wi‑Fi): `http://YOUR_COMPUTER_IP:4173`

> Note: some iOS install features work best over HTTPS. For daily use, GitHub Pages is smoother.

## What gets saved

Stored under key `kirito-mana-pwa-v1` on **this device’s browser**:

- Name, level, mana / max mana
- Round, combat log
- Learned skills + training sessions
- Reaction Trial flag

Closing the app, restarting the phone, or switching apps keeps the save.

**Will erase the save:** clearing Safari/Chrome site data, or “Remove data” for the home-screen app.

Use **Profile → Export Backup** for a JSON copy you can import later.

## Starter kit (Level 1 · all learned)

| Skill | Mana |
|---|---:|
| Horizontal / Vertical / Slant | 0 (free) |
| Retreat | 2 (Bonus Action, 1/turn) |
| Deflect | 10 (unlimited Special Reactions / turn) |
| Rage Spike | 8 |

No projectile skills.

## Related docs

- [Master Skills Sheet](../kirito-mana-system/MASTER-SKILLS.md)
- [System rules](../kirito-mana-system/README.md)
