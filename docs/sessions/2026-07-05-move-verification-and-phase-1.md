# Session log — 2026-07-05 — Move verification + Phase 1 (safety net)

First session at the new location (`~/Herd/pull-tabs`, worked in an
/auto-dev worktree). Executed docs/plan.md Part 1 (move verification) and
the full Phase 1 spec (docs/specs/phase-1-safety-net.md). No extension
behavior changes, no version bump.

## Part 0 — Move verification (all green)

1. Clean tree confirmed; `git fsck` clean (3 dangling blobs, normal);
   history intact.
2. Snapshotted the pre-move `dist/` (from `~/Herd/pull-tabs`, gitignored
   artifacts don't follow worktrees), then `rm -rf node_modules && npm ci`
   → `npm run dev` succeeded; both dist manifests parse as valid JSON.
3. Rebuild vs. baseline diff: identical except `.DS_Store` noise and a
   stale `dist/app.js` present only in the old baseline (leftover from an
   older build config — current webpack.mix.js never emits it; it can be
   deleted from the working `dist/` whenever).
4. `mix-manifest.json` was rewritten by the rebuild with identical content
   in a different key order (verified set-equal via JSON compare) —
   discarded with `git checkout --` as understood noise.
5. Sublime workspace file: already absent at the new location — nothing to
   delete.
6. **Manual follow-up for Adam**: re-load the temporary extension in the
   Firefox/Chrome dev profiles — they still point at the old Dropbox
   `dist/` path.

## Phase 1 — what changed

1. **Jest runs** (`npm test` green, 3/3 ServiceFactory tests, unmodified).
   `.babelrc` gained a *test-env-scoped* `@babel/preset-env` (Jest sets
   `BABEL_ENV=test`; webpack builds don't) — proven bundle-neutral by
   diffing the first post-edit build against a pre-edit `dist/` snapshot
   (zero diffs). `jest.config.cjs` template placeholder replaced with a
   real config (node env, `src/tests/**/*.test.js`).
2. **Unused vulnerable prod deps removed**: `del`, `es6-map`,
   `xmlhttprequest` (grep re-verified zero imports first).
   `npm audit --omit=dev` now reports **0 vulnerabilities**.
3. **Lint/format tooling** added: `eslint@^8` (v8 pinned — legacy
   `.eslintrc.json` format; flat-config migration is Phase 6),
   `prettier`, `eslint-config-prettier`; `lint`/`format` scripts;
   `.prettierrc.json`; `.eslintignore`/`.prettierignore` (config.js,
   dist/, build/). `.eslintrc.json` modernized (es2021, webextensions,
   jest envs) and every rule flagged by the `eslint-config-prettier` CLI
   checker deleted (~33 formatting rules — Prettier owns formatting now).
   Two stylistic rules tuned rather than mass-churn the legacy code:
   `valid-jsdoc` → `requireReturn: false`, `sort-imports` →
   `ignoreDeclarationSort: true` (reordering import declarations could
   change side-effect order — off-limits in a zero-behavior-change phase).
4. **`npm run lint` passes**: 0 errors, 13 warnings (all `no-unused-vars`,
   which the original config deliberately set to warn). Fixes were
   mechanical only (let→const, `x ? true : false`→`x`, case-block braces,
   `new service()`→`new Service()` renames, JSDoc corrections, deleted
   useless constructors). Known bugs got inline `eslint-disable` comments
   with `Phase 2`/`Phase 2-4` pointers (message.js valid-typeof, bulk-layer
   no-useless-call/class-methods-use-this, guard-for-in). Phase-3-doomed
   files (`pocket.js`, `auth.js`, `uiAdvanced.js`, `services/Pocket.js`)
   got file-level disables instead of churn.
5. **CI**: `.github/workflows/ci.yml` — Node 20, `npm ci` → lint → test →
   `cp src/js/config-sample.js src/js/config.js` (build-only; step dies
   with the Pocket removal) → `npm run dev` → manifest JSON validation.
   Proves itself on first push.

## Exit criteria (spec DoD) — verified this session

`npm test` ✓ · `npm run lint` ✓ · `npm audit --omit=dev` = 0 ✓ ·
`npm run dev` ✓ · both dist manifests parse ✓ · no version bump ✓

## Next

Phase 2 (bug-patch release): the five user-reachable bugs in backlog.md —
icon-click TypeError, Pacman.svg case mismatch, premature download status,
removeStatusMessage crash, bookmark-folder creation.
