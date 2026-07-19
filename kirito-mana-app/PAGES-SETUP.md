# GitHub Pages setup (one time)

The deploy workflow is already in the repo:

`.github/workflows/deploy-aincrad-mana.yml`

It publishes everything inside `kirito-mana-app/` to:

**https://dralorex.github.io/General-Questions/**

## Enable Pages

1. Merge latest `main` (PWA + workflow).
2. Repo **Settings → Pages**.
3. **Source** = **GitHub Actions** (not “Deploy from a branch”).
4. **Actions** tab → **Deploy Aincrad Mana PWA** → **Run workflow** → branch `main`.
5. Wait for the green check, then open the URL on your phone.

## After that

- Edits under `kirito-mana-app/` on `main` redeploy automatically.
- Manual redeploy anytime with **Run workflow**.
