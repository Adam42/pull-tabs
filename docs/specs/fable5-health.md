# fable5 — Extension health: close-out & data-collection decision

Spec for /auto-dev. Read CLAUDE.md first (landmines: standalone-JSON
manifests merged by `build.js`, no config.js, version lives only in
`package.json`, no minified releases, don't wire in the 2017 prototypes).
Written 2026-07-12 against branch `redesign/quiet-paper`.

**Read this first:** the four backlog items this spec was commissioned for
were audited against the *current* tree, and three of the four are already
implemented and committed (mostly in `b80b56e` "Fix Jest ESM transform, add
eslint/prettier tooling and CI workflow (Phase 1 safety net)"). The backlog
entries describing them are stale. This spec is therefore mostly a
**verification + documentation close-out**, plus one genuinely open work
item: the Firefox `data_collection_permissions` required-vs-optional
decision, which now overlaps the in-flight redesign work on this branch.
Do not "re-implement" items 1, 2, or 4 — verify them and close the books.

## Goal — and why now

- Confirm the extension-health safety net actually holds today: Jest runs,
  shipped deps audit clean, CI gates pushes/PRs, and the AMO-mandated
  `data_collection_permissions` declaration is in the Firefox manifest.
- Fix the stale paper trail (`backlog.md` still lists three done items as
  open), so the next session doesn't re-plan finished work.
- Decide and spec the one open piece: whether `data_collection_permissions`
  stays `required` or moves to `optional` + runtime request — a decision
  that must land **before the next AMO release** and must be coordinated
  with this branch's uncommitted manifest changes.

Why now: the quiet-paper redesign is mid-flight and already touching both
manifests (`optional_host_permissions` + new
`src/js/services/hostPermissions.js` runtime-request service). That is
exactly the plumbing the "optional data collection" variant would reuse, so
the decision is cheapest to make now, in one coordinated manifest change,
instead of two store-review-visible manifest churns.

## Branch context — coordinate, don't collide

`redesign/quiet-paper` has uncommitted changes to **both source manifests**:

- `src/manifest-base.json` — `host_permissions` →
  `optional_host_permissions` (working-tree diff, lines 11–15).
- `src/manifest-browser.json` — adds
  `"strict_min_version": "128.0"` (working-tree diff, line 5).
- Untracked `src/js/services/hostPermissions.js` +
  `src/tests/services/hostPermissions.test.js` (runtime
  `browser.permissions.request` flow), plus dirty
  `src/js/options.js`, `src/css/styles.css`, and two options tests.

Any manifest edit from this spec must be made **on top of** those in-flight
changes, not by reverting or overwriting them. If /auto-dev runs this spec
on a different branch, reconcile with quiet-paper first. Never stage or
commit files that belong to the redesign as part of this spec's work.

## Tasks

### 1 — Jest: VERIFY ONLY (already fixed)

Backlog claim (`backlog.md:86–91`): `.babelrc` is `{}` and
`jest.config.cjs` contains a `YOUR_MODULE_HERE` placeholder. **Stale.**
Verified current state:

- `.babelrc:1–7` — `@babel/preset-env` targeting current node under
  `env.test` (the ESM transform Jest needs; the build itself stays on
  esbuild, untouched).
- `jest.config.cjs:1–4` — real config: `testEnvironment: "node"`,
  `testMatch: ["<rootDir>/src/tests/**/*.test.js"]`. No placeholder.
- `npx jest --listTests` resolves 25 suites under `src/tests/`;
  `npx jest src/tests/services/ServiceFactory.test.js` passes 3/3
  (verified 2026-07-12).
- CLAUDE.md:47–48 already documents `npm test` as green in CI.

Work remaining:

- Run the **full** suite once (`npm test`) on this branch and record the
  result. Two options tests are dirty with the redesign
  (`src/tests/options.setServices.test.js`,
  `src/tests/options.verifyService.test.js`) — if either fails, that is
  redesign WIP, not a config problem; report it, don't "fix" the config.
- Tick the backlog item (`backlog.md:86–91`) with a "Done (Phase 1,
  b80b56e)" note, matching the checked-item style used elsewhere in the
  file.

Files touched: `backlog.md` only.

Acceptance ("done when"): `npm test` executes the suite (no
`Cannot use import statement outside a module`); any failures are
attributable to redesign WIP and reported; backlog entry checked.

### 2 — Unused vulnerable prod deps: VERIFY ONLY (already removed)

Backlog claim (`backlog.md:21–26`): `del`, `es6-map`, `xmlhttprequest`
sit in `dependencies` with known vulns. **Stale.** Verified current state:

- `package.json:9–14` — `dependencies` are exactly `bootswatch`,
  `sanitize-filename-ts`, `simple-icons`, `webextension-polyfill`.
- Zero hits for `del` / `es6-map` / `xmlhttprequest` in
  `package-lock.json`, and no `require`/`import` of them anywhere in
  `src/` or `build.js` (grep verified 2026-07-12).
- `npm audit --omit=dev` → **0 vulnerabilities** (run 2026-07-12).
- Removed in `b80b56e` (git log -S confirms).

Work remaining: tick `backlog.md:21–26` as done with the audit result.

Files touched: `backlog.md` only.

Acceptance: `npm audit --omit=dev` reports 0 vulnerabilities (re-run to
confirm at implementation time); backlog entry checked.

### 3 — Firefox `data_collection_permissions`: DECIDE + COORDINATE (partially done)

Verified current state:

- The `required` variant is **already committed**:
  `src/manifest-browser.json:2–9` (HEAD and working tree) carries
  `browser_specific_settings.gecko.data_collection_permissions.required:
  ["browsingActivity"]`. This matches `backlog.md:158–173`, which says the
  required variant was re-applied after the 0.20.0 AMO upload and tracks
  the *optional-variant upgrade* as the open work.
- `build.js` shallow-merges `src/manifest-base.json` with the per-browser
  file, so the block flows into `dist/browser/manifest.json` untouched;
  Chrome's manifest (`src/manifest-chrome.json`) correctly has no such
  block (it's a Firefox/AMO-only key).

Why `browsingActivity` is the truthful core declaration: the read-later
providers (Raindrop/Instapaper/Readwise/webhook, `src/js/services/`)
transmit tab **URL + title** to user-configured third-party services.
Provider tokens live in `browser.storage.local` only
(`src/js/services/credentials.js`; UI copy "stored locally on this device
only" per docs/specs/phase-5-read-later-providers.md) and are sent only to
the service they authenticate against — nothing is ever transmitted to the
developer. Whether locally-stored-but-transmitted-for-auth tokens also
require an `authenticationInfo` declaration is a store-disclosure judgment
call — see Questions. Verify category names against the current AMO
`data_collection_permissions` docs at implementation time; do not trust
this spec's memory of the taxonomy.

Work remaining (gated on Question 1):

- **If `required` stands** (ship-simplest): no manifest change. Optionally
  add the guard test below, update `backlog.md:158–173` to record the
  decision, and note in `docs/read-later-services.md` that the optional
  upgrade was considered and deferred/rejected.
- **If upgrading to `optional`**: move `browsingActivity` from `required`
  to `optional` in `src/manifest-browser.json` (keep `required: ["none"]`
  if AMO requires the key to be non-empty — check current docs), bump
  `strict_min_version` to `"140.0"` (optional data-collection prompts need
  Firefox 140+; the working tree currently says `128.0`), and wire the
  runtime request into the same options-page flow the redesign's
  `src/js/services/hostPermissions.js` uses for
  `optional_host_permissions` — one combined prompt when a user connects a
  read-later service, not two. This is the variant that must be built *on
  top of* the dirty redesign work, in lockstep with its author.

Files touched: `src/manifest-browser.json` (optional variant only),
`src/js/services/hostPermissions.js` + `src/js/options.js` (optional
variant only — both already dirty on this branch), `backlog.md`,
`docs/read-later-services.md` (decision note), new
`src/tests/manifest.test.js` (guard test, both variants).

Acceptance: decision recorded; `npm run dev` then
`python3 -c "import json; json.load(open('dist/browser/manifest.json'))"`
passes and the dist manifest carries the agreed declaration;
`dist/chrome/manifest.json` unaffected; if optional variant: connecting a
service in Options triggers exactly one Firefox consent prompt covering
both host access and data collection.

### 4 — GitHub Actions CI: VERIFY ONLY (already exists)

Verified current state: `.github/workflows/ci.yml` (committed in
`b80b56e`) runs on `push` + `pull_request`: `npm ci`, `npm run lint`,
`npm test`, `npm run dev`, then JSON-validates both dist manifests —
exactly the four npm scripts in `package.json:26–32` plus the CLAUDE.md
manifest check. The phase-1 spec's `config.js` copy step is correctly
absent (config.js died in Phase 3).

Work remaining:

- Confirm the workflow is green on GitHub for a recent push (check the
  Actions tab or `gh run list --limit 5`).
- Tick the backlog chore (`backlog.md:306–307`).
- Optional, only if Adam wants it (see Questions): add an
  `npm audit --omit=dev --audit-level=high` step so item 2 can't
  silently regress. Do not add anything else — hobby-project bar.

Files touched: `backlog.md`; `.github/workflows/ci.yml` only if the audit
step is approved.

Acceptance: latest CI run green; backlog chore checked.

## Do not change

- **User-visible permissions** (`permissions`, `host_permissions`,
  `optional_host_permissions` in `src/manifest-base.json`) — CLAUDE.md
  "Ask before" (lines 95–99) requires explicit approval, and the redesign
  branch is already mid-change there. This spec adds **no** new
  permissions; the only manifest key it may touch is
  `data_collection_permissions`, and only after Question 1 is answered.
- **The build tool** (`build.js`, esbuild, the shallow-merge manifest
  scheme) — CLAUDE.md "Ask before". The Jest/babel config is test-only
  and already landed; do not extend babel into the build.
- **The abandoned 2017 prototypes** — `src/js/service.js`,
  `src/js/pulltabs-app.js`, `src/service.html` (CLAUDE.md:80–82). Do not
  import, test, lint-fix, or otherwise wire them in.
- **The mid-redesign working-tree changes** on `redesign/quiet-paper`
  (`src/css/styles.css`, `src/js/options.js`, both source manifests, the
  two options tests, untracked `hostPermissions.js` files,
  `docs/read-later-services.md`). Build on top of them where task 3
  requires; never revert, reformat, stage, or commit them incidentally.
- `jest.config.cjs` / `.babelrc` — already correct; leave alone unless the
  full-suite run exposes a genuine config gap (it should not).

## Migration / data risks

- **No user-data migration** in any task: no stored-preference keys change
  (`src/js/storageKeys.js` untouched), no storage schema changes.
- **Store review**: `data_collection_permissions` is AMO-validated
  metadata. The `required` variant is already shipped/committed, so
  keeping it costs nothing new. *Changing* it (required→optional) alters
  the install-time consent surface: existing users get the new prompt
  behavior on update, and AMO reviewers will see a manifest diff — batch
  it with the redesign's `optional_host_permissions` change so the next
  release has **one** coherent permissions story, not two.
- **`strict_min_version` bump risk** (optional variant only): raising
  128.0 → 140.0 drops users on Firefox ESR/older releases from receiving
  updates. Firefox 140 is itself the 2025 ESR base, so exposure is small,
  but it is a real cutoff — call it out in the release notes.
- **Chrome is unaffected** by task 3 (`data_collection_permissions` is
  Gecko-only; `src/manifest-chrome.json` has no
  `browser_specific_settings`). Chrome Web Store data disclosures are
  handled in the CWS dashboard, out of repo — no action here.
- CI (`on: push` for all branches) will run against redesign WIP pushes;
  a red build there is signal, not breakage.

## Tests to add / update

- **New: `src/tests/manifest.test.js`** — cheap regression guards that
  read the *source* manifests as JSON:
  - `"browser manifest declares data_collection_permissions"` — asserts
    `browser_specific_settings.gecko.data_collection_permissions`
    matches the decided shape (required or optional variant).
  - `"chrome manifest carries no browser_specific_settings"`.
  - `"no source manifest contains a version key"` (guards the
    CLAUDE.md:65–66 single-source-version landmine).
- **Only if the optional variant is chosen:** extend the redesign's
  untracked `src/tests/services/hostPermissions.test.js` (coordinate with
  its author — it is uncommitted WIP) with e.g.
  `"requests optional data collection together with host permission when
  connecting a service"`.
- No test changes for items 1, 2, 4 — they are verification-only.

## Rollback notes

- Items 1, 2, 4 change only `backlog.md` (documentation) — rollback is
  `git checkout -- backlog.md`; nothing runtime-visible.
- Task 3 required-variant: no change to roll back.
- Task 3 optional-variant: revert the `src/manifest-browser.json` hunk and
  the options/hostPermissions wiring commit; the `required` declaration
  returns and older Firefox versions are re-eligible. **Do not** roll back
  past having *some* `data_collection_permissions` block — AMO now rejects
  new Firefox versions without it, so "remove the key entirely" is not a
  valid rollback state for any future release.
- Optional CI audit step: delete the step from
  `.github/workflows/ci.yml`; no other coupling.

## Questions for Adam (blocking)

1. **`data_collection_permissions`: keep `required: ["browsingActivity"]`
   or upgrade to the optional/runtime variant?** Required = zero work now,
   one consent line at install for *all* users (even those who never
   connect a service). Optional = consent only when a service is
   connected, but needs Firefox 140+ (`strict_min_version` bump) and code
   in the exact options flow the redesign is currently rewriting. The
   backlog (`backlog.md:158–173`) deferred this to "the redesign" — that
   redesign is now, so it's decision time. This is a user-facing store
   disclosure; per CLAUDE.md "Ask before", not decidable by an agent.
2. **Declared categories**: is `browsingActivity` alone truthful, or
   should `authenticationInfo` be added because user-pasted service tokens
   are transmitted to the third-party services during verify/save? (Tokens
   never reach the developer; AMO's taxonomy should be re-read at
   implementation time before answering.)
3. **CI audit gate**: add `npm audit --omit=dev --audit-level=high` to
   `ci.yml`? Two-line change, keeps item 2 permanently true, but adds a
   flake source (registry advisories can appear overnight and block
   unrelated PRs). Yes/no.

## Suggested implementation order

1. Task 1 verification (`npm test`) and task 2 verification
   (`npm audit --omit=dev`) — read-only, no dependencies, do first.
2. Task 4 verification (`gh run list`) — read-only.
3. Backlog close-out edits for 1, 2, 4 in a single documentation commit.
   (If a parallel documentation session is also editing `backlog.md`,
   land after it or rebase over it.)
4. New `src/tests/manifest.test.js` guard tests (works under either
   task-3 outcome; write the data-collection assertion against the
   *current* required shape, adjust if Question 1 flips it).
5. Task 3, once Questions 1–2 are answered — coordinated with, and
   sequenced after, the quiet-paper manifest/hostPermissions work lands,
   so the next release carries one combined permissions change.

## Definition of done

`npm test` runs the full suite with any failures attributed and reported;
`npm audit --omit=dev` → 0 vulns; CI green on the latest push;
`backlog.md` no longer lists shipped work as open; the
`data_collection_permissions` decision is recorded in backlog +
docs/read-later-services.md and reflected (if changed) in
`src/manifest-browser.json` with both dist manifests JSON-valid via
`npm run dev`; no permissions, build-tool, or redesign-WIP files altered
without sign-off.
