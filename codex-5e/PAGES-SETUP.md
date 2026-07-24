# GitHub Pages — phone apps

Apps are hosted from this repo on **separate URLs**:

| App | Phone URL |
|---|---|
| **Hub (pick an app)** | https://dralorex.github.io/General-Questions/ |
| **Codex** (5e sheet) | https://dralorex.github.io/General-Questions/codex/ |
| **Aincrad Mana** | https://dralorex.github.io/General-Questions/mana/ |
| **DM Eye** (party tracker) | https://dralorex.github.io/General-Questions/dm-eye/ |
| **Character** (piece creator) | https://dralorex.github.io/General-Questions/Character/ |

## Install on your phone

1. Open the app URL above in your phone browser.
2. **iPhone (Safari):** Share → **Add to Home Screen**
3. **Android (Chrome):** menu → **Install app** / **Add to Home screen**

Do that once per app if you want **separate icons**. Saves stay on that phone.

## DM Link

1. Player: Codex or Mana → **Profile** → **DM Link** → turn **Share with DM** on
2. Player gives the 6-character code to the DM
3. DM: open **DM Eye** → enter the code → **Link**
4. Player HP and sheet updates appear live on the DM board

## Auto-deploy

Pushes to `main` that change `codex-5e/`, `kirito-mana-app/`, `dm-eye/`, `character/`, `shared/`, or `pages-hub/` redeploy via `.github/workflows/deploy-codex.yml`.
