# CLAUDE.md — Pull Tabs

Project constitution for AI-assisted sessions. Read this before changing code.

## What this is

A Manifest V3 browser extension (Firefox + Chrome) that lists the current
window's tabs and performs actions on them: download, bookmark, close,
copy-to-clipboard, and (defunct) save-to-Pocket. Hobby open-source project,
GPL-licensed, distributed via addons.mozilla.org / Chrome Web Store.
Calibrate changes to that bar: shipped-extension correctness and user safety
matter; enterprise process does not.

## Stack & layout

- Vanilla JavaScript ES modules, no framework. Bootstrap 3 (bootswatch/yeti) CSS.
- Build: laravel-mix (webpack) via `webpack.mix.js`. Source in `src/`,
  intermediate output in `build/`, final unpacked extensions in
  `dist/browser/` (Firefox) and `dist/chrome/` (Chrome, gets the
  webextension-polyfill prepended).
- Entry pages: `src/popup.html`, `src/options.html`, `src/about.html`,
  `src/pocket.html` (Pocket OAuth callback — defunct).
- Service layer: `src/js/services/` — `ServiceProvider` base class,
  one provider per action, `ServiceFactory` maps action names ↔ providers.
  Adding a provider to `src/js/services/providers.js` automatically surfaces
  it in both UIs and the options page.
- See `docs/architecture.md` for the full component map.

## Commands

- `npm run watch` — dev build with rebuild on change
- `npm run dev` — one-shot development build (**also used for release builds**)
- `npm run production` — exists but is NOT used for releases (stores prefer
  un-minified code; see README Deployment section)
- `npx jest` — currently broken (ESM transform not wired up; see backlog.md)
- There is no lint script. `.eslintrc.json` exists but eslint is not in
  devDependencies. README asks for prettier formatting; prettier is not a
  dependency either — format with a global/editor prettier.

## Landmines — do not trip these

- **`src/manifest-*.json` are NOT standalone JSON.** `manifest-base.json` is
  an unterminated fragment; the build *concatenates* base + browser or base +
  chrome fragments into a valid `manifest.json`. Editing any of them requires
  keeping the concatenation valid. Verify with:
  `python3 -c "import json; json.load(open('dist/browser/manifest.json'))"`
- **`src/js/config.js` is gitignored and must never be committed** (it held a
  real Pocket consumer key). `config-sample.js` is the committed template.
  The build fails without `config.js` because modules import it.
- **Version lives in two places**: `package.json` and `src/manifest-base.json`.
  Bump both.
- **Do not minify release builds** — Mozilla source-review policy; releases
  use `npm run dev` (see README).
- **Bulk-action code paths are broken and unused.** `ServiceProvider.forEachTabDo`
  returns on the first loop iteration, and its callers pass `fn.call(this)`
  (immediate invocation) instead of a function reference. The real UIs loop
  per-tab via `UI.doActionToTabForTabs` / provider `doActionToTab` instead
  (Clipboard is the exception: it genuinely uses `doActionToTabs`). Don't
  build new features on the bulk methods without fixing them first.
- **Pocket is dead** (service shut down July 2025). Don't extend
  `pocket.js` / `auth.js` / `services/Pocket.js`; removal is planned.
- **Storage is split**: some state is in `localStorage` of extension pages
  (`pullTabsFolderId`, `initialSetup`, Pocket tokens) and some in
  `browser.storage.local` (preferences, download-tracking objects). They are
  not interchangeable; consolidation to `browser.storage` is a backlog item.
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
