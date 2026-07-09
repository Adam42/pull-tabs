# CLAUDE.md — Pull Tabs

Project constitution for AI-assisted sessions. Read this before changing code.

## What this is

A Manifest V3 browser extension (Firefox + Chrome) that lists the current
window's tabs and performs actions on them: download, bookmark, close, and
copy-to-clipboard. (A save-to-Pocket action existed but was removed in 0.18.0
when the Pocket service shut down.) Hobby open-source project,
GPL-licensed, distributed via addons.mozilla.org / Chrome Web Store.
Calibrate changes to that bar: shipped-extension correctness and user safety
matter; enterprise process does not.

## Stack & layout

- Vanilla JavaScript ES modules, no framework. Bootstrap 3 (bootswatch/yeti) CSS.
- Build: laravel-mix (webpack) via `webpack.mix.js`. Source in `src/`,
  intermediate output in `build/`, final unpacked extensions in
  `dist/browser/` (Firefox) and `dist/chrome/` (Chrome, gets the
  webextension-polyfill prepended).
- Entry pages: `src/popup.html`, `src/options.html`, `src/about.html`.
- Service layer: `src/js/services/` — `ServiceProvider` base class,
  one provider per action, `ServiceFactory` maps action names ↔ providers.
  Adding a provider to `src/js/services/providers.js` automatically surfaces
  it in both UIs and the options page.
- See `docs/architecture.md` for the full component map.

## Roadmap & session context

- `docs/plan.md` — the 7-phase roadmap (move, safety net, bug patch,
  amputations, polish, new providers, toolchain, nice-to-haves).
- `docs/specs/phase-*.md` — self-contained specs for Phases 1–5, written
  for /auto-dev. `backlog.md` is the master findings list.
- `docs/sessions/` — session logs with kickoff prompts; read the latest
  one when resuming work.
- Design docs: `docs/read-later-services.md` (Pocket replacements),
  `docs/share-providers.md` (social compose intents),
  `docs/code-review-followups.md` (services-layer polish checklist).

## Commands

- `npm run watch` — dev build with rebuild on change
- `npm run dev` — one-shot development build (**also used for release builds**)
- `npm run production` — exists but is NOT used for releases (stores prefer
  un-minified code; see README Deployment section)
- `npm test` — runs the Jest suite (green in CI; ESM transform wired up in
  Phase 1).
- `npm run lint` — eslint over `src/js` and `src/tests`; `npm run format` —
  prettier `--write`. Both eslint and prettier are devDependencies as of
  Phase 1.

## Landmines — do not trip these

- **`src/manifest-*.json` are NOT standalone JSON.** `manifest-base.json` is
  an unterminated fragment; the build *concatenates* base + browser or base +
  chrome fragments into a valid `manifest.json`. Editing any of them requires
  keeping the concatenation valid. Verify with:
  `python3 -c "import json; json.load(open('dist/browser/manifest.json'))"`
- **The `config.js` mechanism was removed in 0.18.0.** It previously held a
  Pocket consumer key and was gitignored; no module imports it anymore and
  there is no `config-sample.js`. Don't reintroduce it.
- **Version lives in two places**: `package.json` and `src/manifest-base.json`.
  Bump both.
- **Do not minify release builds** — Mozilla source-review policy; releases
  use `npm run dev` (see README).
- **Real UIs loop per-tab** via `UI.doActionToTabForTabs` / provider
  `doActionToTab`; only `Clipboard` implements a genuine bulk
  `doActionToTabs`. The broken `forEachTabDo` bulk layer was deleted in
  0.18.0 — don't reintroduce fake bulk methods.
- **Storage is split**: some state is in `localStorage` of extension pages
  (`pullTabsFolderId`, `initialSetup`) and some in `browser.storage.local`
  (preferences, download-tracking objects). They are not interchangeable;
  consolidation to `browser.storage` is a backlog item.
- `src/js/service.js`, `src/js/pulltabs-app.js`, `src/service.html` are
  abandoned 2017 prototypes, not referenced by the build. Don't wire them in.

## Conventions

- Prettier formatting (per README), 2-space indent, double quotes in newer
  files. Older files mix `var`/`let`; new code should use `const`/`let`.
- Providers follow the pattern: constructor takes a tabs array (validated by
  the base class), implement `doActionToTab(tab)` returning a Promise, and
  `doActionToTabs()` for genuine bulk operations.
- Keep the extension browser-agnostic: use the promise-based `browser.*` API
  (the polyfill covers Chrome); never call `chrome.*` directly.

## Ask before

- Removing or renaming user-visible actions or changing stored preference
  keys (breaks existing users' saved settings).
- Adding manifest permissions (store review friction) or any new external
  service integration.
- Changing the build tool or the manifest concatenation scheme.
