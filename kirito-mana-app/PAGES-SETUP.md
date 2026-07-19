# GitHub Pages setup

## Why you see “no GitHub Pages site”

This repository is **private**.

On a free GitHub account, **GitHub Pages only works for public repos**.  
Private Pages needs GitHub Pro / Team / Enterprise.

That’s why Settings shows no Pages site even though the `gh-pages` branch exists and the deploy workflow is green.

## Fix option A — make the repo public (easiest free hosting)

1. Open https://github.com/Dralorex/General-Questions/settings  
2. Scroll to **Danger Zone → Change repository visibility → Change to public**  
3. Then open https://github.com/Dralorex/General-Questions/settings/pages  
4. **Source:** Deploy from a branch  
5. **Branch:** `gh-pages` / `/ (root)` → **Save**  
6. Wait 1–2 minutes, open: https://dralorex.github.io/General-Questions/

Your mana save still lives **on your phone**, not in the repo. Making the repo public only publishes the app files + homebrew sheets.

## Fix option B — keep the repo private

Use another free host for the static app (Netlify / Cloudflare Pages / Vercel), or upgrade GitHub for private Pages.

If you want, ask and we can wire one of those next.

## After Pages is live

- Phone URL: https://dralorex.github.io/General-Questions/
- iPhone: Safari → Share → **Add to Home Screen**
- Android: Chrome → **Install app**
