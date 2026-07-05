# Backlog

Audit date: 2026-07-05 (full read-only audit of `refactor/async-services`
working tree). Bar applied: hobby open-source extension **shipped to real
users** via AMO / Chrome Web Store — correctness and user safety of the
shipped artifact matter; enterprise process does not.

Effort: S = under an hour, M = an evening, L = multiple sessions.

Companion doc: [docs/code-review-followups.md](docs/code-review-followups.md)
reconciles the earlier services-layer code review checklist — what's done,
what's captured here, and the remaining polish items not repeated below.

> **No CRITICAL security items found.** Specifically verified:
> `src/js/config.js` (real Pocket consumer key) is gitignored and absent from
> git history; no other secrets in the repo; no injection sinks (all DOM is
> built with `createElement`/`textContent`, no `innerHTML` with user data).

## Security

- [ ] **MEDIUM / S — Remove unused prod dependencies with known vulns.**
  `del` (pulls vulnerable `minimatch`, ReDoS, high), `es6-map`,
  `xmlhttprequest` are in `dependencies` but never imported anywhere in
  `src/` or `webpack.mix.js`. Refs: `package.json:9-16`, `npm audit --omit=dev`.
  DoD: three deps removed, `npm audit --omit=dev` reports 0 vulnerabilities,
  build still succeeds.
- [ ] **MEDIUM / L — Build toolchain has 48 known vulns (3 critical: pbkdf2,
  sha.js, shell-quote)** — all in the laravel-mix/webpack dev chain, never
  shipped to users, but it's the code that runs `npm install`/build on dev
  machines. Ref: `npm audit`, `package.json:18-27`. DoD: either
  `npm audit fix` brings dev vulns to ~0 without breaking `npm run dev`, or
  the build is migrated off laravel-mix (see Improvements) which eliminates
  the chain wholesale.
- [ ] **LOW / S — Pocket access token stored in page `localStorage`**
  (`src/js/pocket.js:210-212`). Moot once Pocket is removed; listed for
  completeness. DoD: token storage code deleted with the Pocket removal.
- [ ] **LOW / S — Malformed `web_accessible_resources`** exposes
  `pocket.html` and lists an https URL as a "resource"
  (`src/manifest-base.json:8-12`); `matches: []` makes it inert today, but
  it's copy-paste-away from exposing extension pages. DoD: block removed (or
  correctly scoped) and both dist manifests still validate & load.

## Bugs & Incomplete

- [ ] **HIGH / S — Uncommitted `Bookmark.js` defines `doActionToTab` twice,
  first copy has a mangled template string** `"Failed to bookmark tab:
  $(error.message}"` (`src/js/services/Bookmark.js:12-25`). Works only
  because the second definition shadows the first. DoD: single correct
  `async doActionToTab`, change committed (this is the WIP on
  `refactor/async-services`).
- [ ] **HIGH / S — Clicking a simple-view button's *icon* throws.**
  `doActionToAllTabs` reads `evt.target.id` (`src/js/uiSimple.js:19`), but
  clicking the `<img>` inside the button yields an empty id →
  `convertActionToProvider("")` throws `TypeError`
  (`src/js/services/ServiceFactory.js:40-42`) and nothing happens. DoD: use
  `evt.target.closest("button")` (or listen on buttons), icon clicks perform
  the action.
- [ ] **HIGH / S — Loading spinner image 404s on case-sensitive systems.**
  `src/popup.html:27` references `img/pacman.svg`; the file is
  `src/img/Pacman.svg`. Broken for every Linux user. DoD: filename and
  reference match; spinner renders on Linux.
- [ ] **HIGH / M — Entire bulk-action layer is broken (dead code today).**
  `forEachTabDo` returns on the first loop iteration
  (`src/js/services/ServiceProvider.js:40`), and all callers pass
  `this.method.call(this)` — invoking immediately with `undefined` instead
  of passing a callback (`src/js/services/Close.js:27`,
  `src/js/services/Pocket.js:66`, `src/js/services/Bookmark.js` bookmarkTabs).
  Currently unreachable because both UIs loop per-tab, so this is a landmine
  rather than a live fault. DoD: either fix `forEachTabDo` + callers with a
  test, or delete the unused bulk methods (Clipboard keeps its real
  `doActionToTabs`).
- [ ] **MEDIUM / S — Simple-view download shows status prematurely.**
  `.then(uiSimple.updateUI(tab, "Started downloading ", "info"))` invokes
  `updateUI` immediately and passes `undefined` to `.then`
  (`src/js/uiSimple.js:36-44`) — "Started downloading" renders even when the
  download promise rejects, alongside the later "Failed" message. DoD: pass a
  function; message appears only on resolution.
- [ ] **MEDIUM / S — `removeStatusMessage` crashes on already-removed
  messages.** `typeof id === null` is always false
  (`src/js/message.js:79`) and `document.getElementById(id)` can be null when
  a timeout fires after manual removal (`src/js/message.js:82-84`). Likely
  the cause of the long-standing "duplicate cloned status messages on
  re-clicking downloads" note in todo.txt. DoD: null-safe removal; repeated
  download clicks produce no console errors and no orphaned messages.
- [ ] **MEDIUM / M — Jest can't run at all.**
  `npx jest` fails with `SyntaxError: Cannot use import statement outside a
  module`; `.babelrc` is `{}` and `jest.config.cjs` still contains the
  `YOUR_MODULE_HERE` template placeholder (`jest.config.cjs:5`,
  `src/tests/services/ServiceFactory.test.js`). DoD: `npm test` runs green
  with the existing ServiceFactory suite; wired into CI if CI exists.
- [ ] **MEDIUM / M — Mime-type advanced layout is broken end-to-end**
  (feature is off by default, so users don't hit it):
  `Promise.all(uiAdvanced.addMimeTypeToTabs)` passes a function, not an
  iterable (`src/js/uiAdvanced.js:179`); `getFullMimeType` reads the
  nonexistent key `keys.preferences.fullMimeType`
  (`src/js/uiAdvanced.js:22`); the `.then(promise)` chaining in
  `displayAdvancedLayout` runs stages in parallel by accident
  (`src/js/uiAdvanced.js:170-205`); HEAD-request XHRs
  (`src/js/uiAdvanced.js:44-77`) lack host permissions under MV3 and will be
  CORS-blocked. DoD: decision made (finish or delete — see Questions); code
  matches the decision.
- [ ] **MEDIUM / S — Pulltabs bookmark folder never created when the target
  folder has no children**, and the `tree[0].children[1]` root assumption
  differs between Chrome/Firefox (`src/js/browser.js:79-103`). Fallout:
  `pullTabsFolderId` stays unset and bookmarks silently land in the default
  folder (`parentId: undefined`, `src/js/services/Bookmark.js:44`). DoD:
  folder found-or-created on both browsers including the empty case;
  bookmarks land in "Pulltabs".
- [ ] **LOW / S — `PocketProvider.doActionToTabs` is a console.log stub**
  (`src/js/services/Pocket.js:16-18`). Superseded by Pocket removal.
- [ ] **LOW / S — Download bulk path references nonexistent `this.updateUI`**
  (`src/js/services/Download.js:41`) and passes `this` as a `.then` rejection
  handler (`src/js/services/Download.js:72-79`). Dead path via the bulk-layer
  item above. DoD: covered by the bulk-layer fix/delete.
- [ ] **LOW / S — `form.getSelectedGroup` calls `getElementById()` with no
  argument** — dead, broken function (`src/js/form.js:114-116`). DoD: deleted.
- [ ] **LOW / S — Duplicate DOM ids in the advanced form**: every radio for a
  tab shares `id="tab-pref-<index>"` (`src/js/form.js:48`), and
  `input.checked` is assigned the string `"checked"`/`""`
  (`src/js/form.js:51`). Works by accident. DoD: unique ids (or no ids, use
  values), boolean `checked`.
- [ ] **LOW / S — 2017 prototype files are untracked clutter**:
  `src/js/service.js` (self-recursive `saveTab`, unreachable code),
  `src/js/pulltabs-app.js`, `src/service.html`, `todo.txt`. Superseded by
  `src/js/services/`. DoD: deleted; any still-relevant todo.txt ideas live in
  this backlog (done — see Improvements) or GitHub issues.
- [ ] **LOW / S — `p.zip` packaging artifact tracked by the build manifest**
  (`mix-manifest.json`, uncommitted hunk; `dist/browser/p.zip` on disk).
  Risk: next zip nests the previous zip. DoD: hunk discarded, zips excluded
  from `dist/` or built to a separate directory.

## Improvements

- [ ] **HIGH impact / M — Remove the Pocket integration.** The service shut
  down July 2025; login and save now fail against a dead API. Removal
  deletes `src/js/pocket.js`, `src/js/auth.js`,
  `src/js/services/Pocket.js`, `src/pocket.html`, the `identity` permission
  and `host_permissions` (`src/manifest-base.json`), the config.js
  consumer-key requirement, and the pocket-page bundle
  (`webpack.mix.js`). Store listing text ("put them in your Pocket") needs
  updating too. **Needs owner sign-off — see Questions.** DoD: extension
  builds and works with no Pocket references; manifest permissions shrink to
  `tabs, downloads, bookmarks, storage`; version bumped and released.
- [ ] **HIGH impact / M — Add Raindrop.io + Instapaper save providers**
  (Pocket's replacement). Full design in
  [docs/read-later-services.md](docs/read-later-services.md): user-pasted
  Raindrop test token + Instapaper Basic Auth — no OAuth, no secrets in the
  repo or shipped zip; Raindrop gets a true bulk `doActionToTabs`. Requires
  new `host_permissions` (api.raindrop.io, www.instapaper.com) — batch with
  the Pocket-removal release as a permission swap. DoD: both services
  save from both layouts with verified credentials; disabled by default
  until configured. **Mailist: blocked — no public API** (verified
  2026-07-05); watch item, ask contact@mailist.app.
- [ ] **MEDIUM impact / M — Share-to-social providers** (Bluesky, Threads,
  Reddit; more on request). Compose-intent URLs — no auth, no new manifest
  permissions; one shared `ShareIntentProvider` + tiny subclasses. Design
  and bulk-UX guard in [docs/share-providers.md](docs/share-providers.md).
  Confirms dropping `identity` is safe (no candidate needs it; Instagram
  not feasible at all). DoD: three targets share from both layouts with the
  >3-tab confirm guard; disabled by default.
- [ ] **HIGH impact / L — Replace laravel-mix with a modern bundler**
  (esbuild or plain webpack + a tiny manifest-merge script). Kills the
  48-vuln dev chain, removes the fragile manifest concatenation
  (`webpack.mix.js:38-46`), and speeds builds. DoD: `npm run dev|watch`
  equivalents produce byte-comparable dist output; manifests generated by
  JSON merge, fragments become valid JSON.
- [ ] **MEDIUM impact / S — Modernize clipboard copy** from deprecated
  `document.execCommand("Copy")` + hidden textarea
  (`src/js/services/Clipboard.js:32-50`) to
  `navigator.clipboard.writeText()`. DoD: copy works in both browsers from
  both layouts; hidden-element hack deleted.
- [ ] **MEDIUM impact / S — Add lint + format tooling that actually runs.**
  `.eslintrc.json` exists but eslint isn't installed; README mandates
  prettier but it isn't a dependency. DoD: `npm run lint` and `npm run
  format` exist and pass; eslint config modernized (the uncommitted
  `"on"`→`1` severity fix folded in).
- [ ] **MEDIUM impact / M — Grow the test suite** once Jest runs: providers
  (mock `browser.*`), `form.getSelectedTabs`, `messageManager`. The old
  todo.txt "Add TapeJS tests" intent, modernized. DoD: core action paths
  covered; tests run in CI on PRs.
- [ ] **MEDIUM impact / M — Consolidate `localStorage` →
  `browser.storage.local`** (`pullTabsFolderId` in `src/js/browser.js:121`,
  `initialSetup` in `src/js/popup.js:24-26`). Prerequisite for any future
  background/service-worker work (a todo.txt ambition) and removes the
  dual-store split. DoD: one storage API, migration path for existing users'
  folder id.
- [ ] **LOW impact / M — Background script for download tracking.** Today
  `downloads.onChanged` listeners live in the popup, so completion status is
  lost when the popup closes (also the todo.txt "summary log" idea). DoD
  (if pursued): MV3 event-driven background script owns download tracking;
  popup subscribes.
- [ ] **LOW impact / L — UI refresh off Bootstrap 3** (`bootswatch@3.3`,
  2015-era, `webpack.mix.js:20-23`). Cosmetic; do last.

## Chores

- [ ] **S — Land the `refactor/async-services` WIP**: fix the Bookmark.js
  duplicate (see Bugs), keep the ServiceProvider/Clipboard/eslint/package-lock
  changes, discard the mix-manifest `p.zip` hunk, delete the 2017 files,
  commit. DoD: clean `git status`, branch pushed.
- [ ] **S — Single-source the version number** (currently `package.json` +
  `src/manifest-base.json`). DoD: one place to bump, build injects it.
- [ ] **S — Delete dead code flagged above** (form.js:73-83 thumbnail block,
  message.js `restack` no-op case, storage.js unused `save()` instance
  method, uiSimple.js misleading docblock at lines 11-15).
- [ ] **M — Add GitHub Actions CI**: install, build, lint, test on PR. DoD:
  green check on PRs to master.
- [ ] **S — Update README deployment section** if/when the bundler or Pocket
  removal changes the release flow. (README status section added by this
  audit, 2026-07-05.)

## Parking lot (ideas, not commitments)

- **Server complement to the extension** — a small PullTabs API service
  (owner idea, predates this audit). What it would unlock:
  - **OAuth secret custody**: server holds `client_secret` and proxies the
    token exchange, making *proper* OAuth flows viable for services like
    Raindrop (today ruled out — see docs/read-later-services.md) instead of
    pasted tokens.
  - Save-to-own-server as a first-class provider (article archive), plus
    room for cross-device sync, weekly-digest emails (the Mailist idea),
    and the long-wanted persistent action-summary log.
  - What it costs: the project stops being infrastructure-free — uptime,
    a privacy policy, store-review questions about user data transiting an
    owner-run server, and hosting. That's a character change for a hobby
    extension; the pasted-token design was chosen precisely to avoid it.
  - Revisit trigger: if Phase 5's token-paste UX proves too clunky for real
    users, or if a second OAuth-only service becomes a must-have.

## Questions for the owner (blocking the marked items)

1. **Pocket removal** — remove entirely (recommended), or keep the provider
   behind a disabled flag for nostalgia? Removal changes the store listing
   description.
2. **Mime-type advanced feature** — finish it (needs host permissions +
   real fetch logic) or delete it (recommended; it's been broken and off by
   default for years)?
3. **2017 prototype files** — confirm deletion; anything in `todo.txt` you
   still want preserved beyond what's absorbed above?
4. **Build tool swap** — OK to replace laravel-mix? It changes contributor
   commands in the README.

## Remediation plan (proposed session sequence)

**Session 1 — Fix now (unblocks everything, ~1 evening).**
Land the WIP branch: fix Bookmark.js duplicate method, discard the p.zip
hunk, delete 2017 prototypes, commit & push. Then make Jest run (babel
ESM transform) so later fixes can carry tests. This is also the natural
moment for the planned move out of Dropbox — do it after the WIP commit so
nothing uncommitted is in flight during the move.

**Session 2 — Fix now (shipped-bug batch, ~1 evening).**
User-visible correctness: icon-click TypeError (uiSimple.js:19), pacman.svg
case bug, premature download status (uiSimple.js:36-44), messageManager
null-crash, bookmark-folder creation edge case. Small, independent, each
testable. Release as a patch version.

**Session 3 — Fix before next feature release (needs decision #1).**
Remove Pocket (and with it the identity permission, config.js requirement,
auth/pocket modules, LOW security items). Simultaneously fix-or-delete the
bulk-action layer and the mime-type feature (decision #2) — all three are
"amputate dead limbs" work that shrinks the codebase substantially.

**Session 4 — Fix before further development (needs decision #4).**
Toolchain: drop unused deps (immediate, do first), replace laravel-mix,
JSON-merge manifests, add eslint/prettier + CI. Result: `npm audit` clean,
one-command verified builds.

**Session 5+ — Nice to have.**
Storage consolidation, background download tracking, broader tests, UI
refresh — in that order; each independent.
