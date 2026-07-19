# GitHub Pages setup (required once)

The deploy failed before because **Pages was not enabled** on the repo.  
GitHub Actions cannot flip that switch by itself.

## Do this once (takes ~30 seconds)

1. Merge / pull the latest fix onto `main` (or wait for the Pages fix PR).
2. Open: https://github.com/Dralorex/General-Questions/settings/pages
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`
4. Click **Save**.
5. Run the workflow:
   - https://github.com/Dralorex/General-Questions/actions/workflows/deploy-aincrad-mana.yml
   - **Run workflow** → branch `main`

If `gh-pages` is not in the branch dropdown yet, run the workflow first (step 5), wait for it to finish, then come back and pick `gh-pages` in step 3.

## Your phone URL

https://dralorex.github.io/General-Questions/

Give GitHub 1–2 minutes after a green deploy before refreshing.

## Why it failed earlier

```
Get Pages site failed ... Pages enabled and configured to build using GitHub Actions
```

That means Pages wasn’t turned on yet. The workflow now publishes to the `gh-pages` branch instead, which is the reliable setup.
