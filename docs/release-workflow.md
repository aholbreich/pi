# Release workflow

## How to release

```bash
# 1. See what's recommended
npm run release:dry

# 2. Generate release notes from commits since the last tag
npm run release-notes

# 3. Bump & tag (hook validates main branch + clean tree)
npm version patch   # or minor / major

# 4. Push → CI publishes to npm
git push --follow-tags
```

## How it works

| Step | What | Where |
|------|------|-------|
| Determine bump | Reads git log since last `v*` tag, counts `feat:`/`fix:`/`BREAKING CHANGE:` | `scripts/determine-version.js` |
| Generate notes | Markdown release notes grouped by conventional-commit type | `scripts/release-notes.js` (`npm run release-notes`) |
| Validate | Blocks if not on `main` or tree is dirty | `package.json` `scripts.preversion` hook (`scripts/pre-version.js`) |
| Bump + tag | `npm version` updates `package.json` version + creates `vX.Y.Z` git tag | Built-in |
| Publish | Push of `v*.*.*` tag triggers CI → `npm publish` with provenance | `.github/workflows/publish.yml` |

Before publishing, CI checks that the tag matches `package.json`, installs locked dependencies with `npm ci`, runs TypeScript checks plus the full unit/BDD suite, and inspects the package with `npm pack --dry-run`.

## Commit conventions

| Prefix | Bump |
|--------|------|
| `feat:` | minor |
| `fix:` | patch |
| `feat!:` or `BREAKING CHANGE:` | major |
| anything else | ignored |
