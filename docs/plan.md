# Plan — backlog burn-down & move to ~/Herd

Companion to [backlog.md](../backlog.md) (findings + severities) and
[code-review-followups.md](code-review-followups.md) (services-layer polish
list). Written 2026-07-05. Each phase is independently shippable; stop
anywhere and the extension is better than before.

---

## Part 1 — Move to ~/Herd (do first, it's easy)

Verified: `node_modules/.bin` symlinks are relative, no git submodules or
worktrees, remote is SSH GitHub — the repo is fully relocatable. Total time
~15 minutes, most of it `npm install`.

1. **Pre-move** (one-time checks)
   - Working tree clean: `git status` shows nothing after your commit(s).
   - Stop anything watching the directory: `npm run watch`, `web-ext run`,
     editors.
   - If Dropbox "online-only" files are enabled, make the folder available
     offline first so `mv` doesn't trigger download-during-move.
2. **Move** — `mv ~/Dropbox/Sites/pull-tabs ~/Herd/pull-tabs`
   (move, don't copy — preserves git objects, no duplicate to reconcile).
3. **Post-move**
   - `rm -rf node_modules && npm install` — symlinks are relative so this is
     belt-and-braces, but webpack/laravel-mix caches can bake absolute paths;
     a clean install guarantees no ghosts.
   - `npm run dev` and confirm `dist/browser/manifest.json` +
     `dist/chrome/manifest.json` still parse (command in CLAUDE.md).
   - `git fsck && git log -3` — sanity that history moved intact.
   - Delete `pull-tabs.sublime-workspace` or let Sublime rebuild it — it
     holds ~125 stale `Dropbox` absolute paths.
   - Re-load the temporary extension in Firefox/Chrome dev profiles — they
     point at the old `dist/` path.
   - Start Claude Code sessions from the new directory. Session history and
     memory are keyed to the old path and won't follow, but CLAUDE.md,
     backlog.md, and docs/ travel with the repo — that's the durable context.
   - Note: Herd auto-serves `~/Herd` folders as `*.test` PHP sites; a browser
     extension just ignores that. Harmless.
4. **Dropbox cleanup** — the folder disappears from Dropbox on move (history
   retained ~30 days). Nothing else to do.

---

## Part 2 — Backlog burn-down, in phases

Decision gates (from backlog.md "Questions") are marked ⛔ — those phases
need an answer before starting, everything else is pre-approved by the
backlog itself.

### Phase 1 — Safety net (1 evening) — "fix now"

Goal: every later phase gets regression protection and quick wins land.

- Fix Jest ESM wiring (`.babelrc` → `@babel/preset-env`, real
  `jest.config.cjs`); ServiceFactory suite green via `npm test`.
- Remove unused prod deps `del`, `es6-map`, `xmlhttprequest` →
  `npm audit --omit=dev` hits zero.
- Add eslint + prettier as devDependencies with `npm run lint` / `format`
  scripts (config already exists; the `"on"`→`1` fix is in your commit).
- GitHub Actions CI: install → lint → build → test on PR.

Exit criteria: `npm test` and `npm run lint` pass locally and in CI.

### Phase 2 — Shipped-bug patch release, v0.17.2 (1 evening) — "fix now"

Goal: fix everything a user can actually hit today. All five are small and
independent (backlog → Bugs):

- Icon-click TypeError in simple view (`uiSimple.js:19` — use
  `closest("button")`).
- `pacman.svg` case mismatch (`popup.html:27` vs `src/img/Pacman.svg`).
- Premature "Started downloading" status (`uiSimple.js:36-44`).
- `removeStatusMessage` null crash / `typeof id === null` (`message.js:79-84`).
- Bookmark folder never created when target folder is empty + root-index
  assumption (`browser.js:79-103`).

Each fix gets a test where mockable. Bump version in **both**
`package.json` and `src/manifest-base.json`, build with `npm run dev`,
manual smoke test in Firefox + Chrome, release.

Exit criteria: all five reproducible bugs verified fixed in both browsers.

### Phase 3 — Amputations, v0.18.0 (1–2 evenings) — ✅ decisions #1 & #2 resolved (remove Pocket; delete mime feature)

Goal: shrink the codebase by deleting everything that's dead.

- ⛔ **Remove Pocket** (recommended): delete `pocket.js`, `auth.js`,
  `services/Pocket.js`, `pocket.html`, pocket-page bundle, `identity`
  permission, `host_permissions`, the malformed `web_accessible_resources`
  block, and the config.js consumer-key requirement (keep config.js import
  chain or remove it entirely — removing kills a landmine). Update store
  listing text.
- ✅ **Mime-type feature — DECIDED: delete** (successor: URL-type smart
  defaults in backlog, built post-P5). Deleting removes
  `getContentType`/`addMimeTypeToTabs` (uiAdvanced.js:21-77), the broken
  `Promise.all` path, and the options-page mime panel.
- **Bulk-action layer**: delete the broken `forEachTabDo` + fake bulk
  methods; Clipboard keeps its real `doActionToTabs`. (Fix-instead-of-delete
  only if some future feature needs true bulk.)
- Dead-code sweep from backlog Chores: `form.getSelectedGroup`,
  form.js thumbnail block, message.js `restack` case, storage.js unused
  `save()`.

Migration note: existing users have `service_pocket` in storage — leave the
key ignored (harmless) rather than migrating; note it in code comment.

Exit criteria: extension builds/works with 4 actions; manifest permissions
are `tabs, downloads, bookmarks, storage`; store listings updated.

### Phase 4 — Services polish (1–2 evenings) — from code-review-followups.md

Goal: finish what the async-services branch started, now against a smaller
codebase (post-amputation) and with tests running.

- Async/await consistency in Close, Download, Clipboard.
- Standardize error handling (kill `new Error("fail")` patterns).
- `validateTab()` helper on the base class; `new.target` abstract guard;
  drop redundant constructors; `Object.freeze(Providers)`.
- `UI.doActionToTabForTabs`: input validation, view-contract check, and
  success/fail summary counts (the one M-sized item).
- JSDoc completeness pass over `src/js/services/`.
- Grow tests alongside each change: providers with mocked `browser.*`,
  `form.getSelectedTabs`, `messageManager`.

Exit criteria: followups doc fully checked off; provider test coverage in CI.

### Phase 5 — Pocket replacements: Raindrop + Instapaper (2–3 evenings)

Goal: give users somewhere to send tabs again. Full design, API research,
and sub-phases (5a–5d) in [read-later-services.md](read-later-services.md).

- Shared credentials module + options-page "Connected services" section
  (user-pasted Raindrop test token; Instapaper username/password — no
  OAuth, no secrets in repo or zip, ever).
- RaindropProvider: single save + true bulk endpoint (first real
  `doActionToTabs` besides Clipboard).
- InstapaperProvider: single save via the Simple API.
- ReadwiseProvider: single save via `api/v3/save/` (token paste, same
  pattern as Raindrop).
- WebhookProvider: `POST {url, title}` to a user-supplied HTTPS URL —
  universal escape hatch (Zapier/n8n/self-hosted).
- **Dropbox (optional 5f)**: `save_url` endpoint + OAuth2 PKCE — the one
  provider that re-adds `identity` and needs refresh-token logic. Decide at
  Phase 5 start whether to bundle here (one Chrome permission re-approval
  event) or ship later (second re-approval). Design in
  read-later-services.md.
- Mailist: no public API — blocked watch item, not built. Omnivore dead,
  Matter API-less; full candidate screen in the design doc.
- **5e — Share-to-social providers** (Bluesky, Threads, Reddit first): one
  `ShareIntentProvider` base opening pre-filled composer tabs — no auth, no
  new permissions, ~10 lines per target. Design + bulk-UX guard in
  [share-providers.md](share-providers.md). Confirms `identity` can be
  dropped in Phase 3: no candidate provider needs it.
- Manifest gains `host_permissions` for the two read-later APIs (share
  intents need nothing); ship as v0.19.0 with updated store listings
  ("save tabs to Raindrop or Instapaper, share them to Bluesky…").

Prerequisites: Phase 3 (Pocket gone) and Phase 4 (providers async with
standardized errors) so the new providers are born to the new pattern.

### Phase 6 — Toolchain swap (1 weekend) ⛔ decision #4 — "fix before further development"

Goal: modern, vulnerability-free, fast build. Do this *after* Phases 2–4 so
you're not debugging build changes and code changes at once.

- Replace laravel-mix with esbuild (or plain webpack 5): per-page bundles,
  CSS concat, polyfill prepend for Chrome.
- Replace manifest concatenation with a JSON-merge script — fragments become
  valid standalone JSON (removes the top landmine in CLAUDE.md).
- Single-source the version number (inject into manifest at build).
- `npm audit` clean including dev deps; update README contributor commands.
- Byte-diff dist output against the old build before switching over.

Exit criteria: old build system deleted; CI green; a release built with the
new chain is accepted by AMO/Chrome dashboard (upload a beta first).

### Phase 7 — Nice-to-haves (as appetite allows)

In rough order of value:

1. Storage consolidation: `localStorage` → `browser.storage.local` with a
   one-time migration for `pullTabsFolderId`/`initialSetup`.
2. Background (event-page) script owning download tracking so completion
   status survives popup close; unlocks the old "summary log" idea.
3. Clipboard modernization: `navigator.clipboard.writeText()`.
4. UI refresh off Bootstrap 3 / bootswatch@3.3 — cosmetic, do last.

---

## Sequencing at a glance

```
Commit staged work ─▶ MOVE to ~/Herd ─▶ P1 safety net ─▶ P2 bug patch (v0.17.2)
                                                              │
                              ✅ resolved      ─▶ P3 amputations (v0.18.0)
                                                              │
                                                   P4 services polish
                                                              │
                                                   P5 Raindrop + Instapaper (v0.19.0)
                                                              │
                              ⛔ decision #4  ─▶  P6 toolchain swap
                                                              │
                                                   P7 nice-to-haves
```

Rationale for the order: tests before fixes (P1→P2) so fixes are provable;
amputate before polish (P3→P4) so you don't polish code that's about to be
deleted; new services after polish (P5) so they're born async on the
standardized error pattern; toolchain last of the "real work" (P6) so build
churn never compounds with logic churn; move first because everything after
it generates history you want in the new location's sessions. If user value
matters more than internal quality, P5 can jump ahead of P4 — the only hard
prerequisite is P3 (Pocket gone, since P5 replaces its manifest entries and
options-page row).
