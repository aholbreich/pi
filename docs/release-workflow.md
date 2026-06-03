# Release workflow

## How to release

```bash
# 1. See what's recommended
npm run release:dry

# 2. Bump & tag (hook validates main branch + clean tree)
npm version patch   # or minor / major

# 3. Push → CI publishes to npm
git push --follow-tags
```

## How it works

| Step | What | Where |
|------|------|-------|
| Determine bump | Reads git log since last `v*` tag, counts `feat:`/`fix:`/`BREAKING CHANGE:` | `scripts/determine-version.js` |
| Validate | Blocks if not on `main` or tree is dirty | `package.json` `scripts.preversion` hook (`scripts/pre-version.js`) |
| Bump + tag | `npm version` updates `package.json` version + creates `vX.Y.Z` git tag | Built-in |
| Publish | Push of `v*` tag triggers CI → `npm publish` | `.github/workflows/publish.yml` |

## Commit conventions

| Prefix | Bump |
|--------|------|
| `feat:` | minor |
| `fix:` | patch |
| `feat!:` or `BREAKING CHANGE:` | major |
| anything else | ignored |
