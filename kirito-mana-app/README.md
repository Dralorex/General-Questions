# Aincrad Mana (Phone PWA)

Mobile-first Progressive Web App for the Kirito mana system.

- Combat mana tracker with quick buttons (Deflect / Retreat / Rage Spike / free basics)
- Skills browser + training unlocks
- Dual Blades Level 10 gate + Reaction Trial toggle
- **Saves on your phone** with `localStorage` — survives full app close
- Offline-capable after first load (service worker)
- Install to Home Screen (iPhone & Android)

## Phone link (GitHub Pages)

**App URL (after first deploy):**  
https://dralorex.github.io/General-Questions/

### One-time setup (repo owner)
This agent can’t flip the Pages switch for you (API permission). Do this once:

1. Merge the PWA PR into `main`.
2. GitHub → **Settings → Pages**
3. Under **Build and deployment → Source**, choose **GitHub Actions**
4. Open **Actions** → workflow **Deploy Aincrad Mana PWA** → **Run workflow**
5. When it’s green, open: https://dralorex.github.io/General-Questions/

Later pushes that touch `kirito-mana-app/` auto-redeploy.

### Install on your phone
1. Open the Pages URL above on your phone.
2. **iPhone (Safari):** Share → **Add to Home Screen**
3. **Android (Chrome):** menu → **Install app** / **Add to Home screen**

### Local preview (optional)
```bash
cd kirito-mana-app
python3 -m http.server 4173
```
Then on your phone (same Wi‑Fi): `http://YOUR_COMPUTER_IP:4173`  
Daily use should be the HTTPS Pages link.

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
