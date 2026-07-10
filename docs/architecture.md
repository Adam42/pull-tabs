# Pull Tabs — Architecture

Manifest V3 browser extension, vanilla ES modules. Most logic runs in
extension page contexts (popup, options, about); an MV3 background script
(Firefox `scripts`, Chrome `service_worker`) owns download-completion tracking
(added 0.20.0, Phase 7.2). Last audited 2026-07-05; Pocket/mime/bulk layers
removed in 0.18.0 (Phase 3); esbuild build + storage consolidation in 0.20.0.

## Component map

```
popup.html ──▶ popup-page.js (popup-init.js)
                 │
                 ▼
              popup.js ── decides layout(s) from stored prefs
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
 uiSimple.js            uiAdvanced.js
 (one button per         (per-tab checkbox + per-tab
  enabled action,         action radio, submit form)
  acts on ALL tabs)              │
     │                           │
     └───────────┬───────────────┘
                 ▼
              ui.js  (UI.doActionToTabForTabs, autoCloseIfEnabled)
                 │
                 ▼
     services/ServiceFactory.js ── action name → Provider class
                 │
                 ▼
     services/providers.js  (registry)
       ├─ Download.js   → browser.downloads.download (+ best-effort reconcile
       │                  message; completion tracked by background.js)
       ├─ Bookmark.js   → browser.bookmarks.create (into "Pulltabs" folder)
       ├─ Close.js      → browser.tabs.remove (refuses active tab)
       └─ Clipboard.js  → navigator.clipboard.writeText (execCommand fallback)

background-page.js (background.js)  ← MV3 background script
       └─ browser.downloads.onChanged → autoclose + cleanup + broadcast
                                        "download-status" to the popup
```

Supporting modules:

- `browser.js` (`browserUtils`) — browser-namespace shim, tab query, Pulltabs
  bookmark-folder discovery/creation, `runtime.getURL` helper. `init()` is an
  awaitable promise (called from `popup-init.js` before `popup.init()`); it
  runs the one-time `localStorage → browser.storage.local` migration, then
  bookmark-folder discovery only if the folder id is still unset.
- `storage.js` — thin wrapper over `browser.storage.local` (`store`/`retrieve`);
  used by all page code. The background worker uses raw `browser.storage.local.*`
  instead (it must not import the page module graph).
- `storageKeys.js` — dependency-free storage-key constants
  (`PULLTABS_FOLDER_ID`, `INITIAL_SETUP`, `DOWNLOAD_ITEM_PREFIX`, `AUTO_CLOSE`),
  shared by pages, providers, and the background worker.
- `background.js` — MV3 background script; single `downloads.onChanged`
  listener does autoclose + record cleanup + a `download-status` broadcast,
  deduped by a synchronous in-flight claim. Handles a `reconcile-download`
  message from `Download.js` for the fast-completion race. Imports only
  `storageKeys.js`.
- `downloadStatus.js` — single popup-side subscriber (registered once from
  `popup.displayLayout`) for `download-status` broadcasts; renders one text
  line via `uiSimple.updateUI` and additively colors the advanced label.
- `keys.js` — canonical preference keys & defaults (layout, autoClose,
  per-service enabled flags). Derives the action list from
  `ServiceFactory.getActions()` at import time.
- `message.js` (`messageManager`) — transient status messages in a `#status`
  element with duration-based auto-removal.
- `form.js` — DOM builders for the advanced per-tab form; collects selected
  tabs grouped by chosen action on submit.
- `options.js` + `options-init.js` — options page: layout toggles, autoclose,
  per-service enable/disable.
- `helpers.js` — `capitalize()`.
- `watchOptionsLink.js`, `about.js` — small page glue.

Dead / vestigial (not referenced by the build):

- `src/js/service.js`, `src/js/pulltabs-app.js`, `src/service.html` —
  2017 prototypes of a service-registry idea, superseded by `services/`.

## Data flow

1. Popup opens → `popup.init()` reads layout prefs from `browser.storage.local`
   → renders simple buttons and/or advanced per-tab form → queries
   `browser.tabs.query({currentWindow: true})`.
2. User triggers an action → `ServiceFactory.convertActionToProvider(action)`
   → `new Provider(tabs)` → `doActionToTab(tab)` per tab (clipboard uses
   `doActionToTabs()` once) → promise resolution drives success/fail status UI.
3. Downloads are two-phase: `downloads.download()` resolves when the download
   *starts*; the tab object is stashed in `browser.storage.local` under
   `downloadTabItem-<id>`. The **background script** owns the terminal event:
   its `downloads.onChanged` listener (which survives the popup closing) runs
   autoclose, removes the key, and broadcasts a `download-status` message that
   `downloadStatus.js` renders if the popup is open. To cover the case where a
   download finishes before the listener wakes, `Download.js` also sends a
   best-effort `reconcile-download` message after `downloads.search` confirms a
   terminal state; a synchronous in-flight claim in the background guarantees
   exactly one autoclose + broadcast per download.
4. Autoclose for non-download actions: after any successful action, if the
   `autoCloseTabs` pref is set, the tab is closed via CloseProvider (active tab
   always refused, since closing it kills the popup). Download autoclose is
   handled by the background worker (item 3).

## Storage

Consolidated onto `browser.storage.local` in 0.20.0 (Phase 7.1).

| Store | Keys | Notes |
|-------|------|-------|
| `browser.storage.local` | layout, autoCloseTabs, `service_*` enabled flags, `downloadTabItem-*`, `pullTabsFolderId`, `initialSetup` | single canonical store; page code via `storage.js`, background via raw `browser.storage.local.*`. A legacy `service_pocket` key may linger for old users (ignored, not migrated). |
| page `localStorage` | — (migrated away) | `pullTabsFolderId` + `initialSetup` are migrated to `browser.storage.local` on first run by `browserUtils.init()`; nothing new is written here. |

## Build pipeline

`build.js` (plain Node + esbuild; replaced laravel-mix/webpack in 0.20.0):

1. Clean `build/` and both dists.
2. Bundle each page's JS (explicit named entry list, `format: iife`,
   `minify: false`) into `build/*-page.js`, including `background-page.js`.
3. Distribute each named bundle: copy to `dist/browser/` as-is; copy to
   `dist/chrome/` with `webextension-polyfill` prepended. Iterating the named
   list (not the `build/` directory) means a stale file can never reach a dist.
4. Concat bootswatch (Bootstrap 3, yeti) + `src/css/styles.css` → `style.css`;
   copy HTML + `img/` to both dists.
5. **Manifests are valid standalone JSON, shallow-merged**: `manifest-base.json`
   + `manifest-browser.json` or `manifest-chrome.json`, with `version` injected
   from `package.json` → `dist/*/manifest.json`.

`npm run watch` uses esbuild `context().watch()` (re-running the distribute step
in `onEnd`) plus an `fs.watch` on `src/` for HTML/CSS/img/manifest edits.

Release = bump `package.json` version, `npm run dev` (intentionally un-minified
per store policy), then zip the relevant `dist/` directory.

## Key decisions & why

- **Background script owns download tracking** (0.20.0) — `downloads.onChanged`
  moved out of the popup into an MV3 background script so completion + autoclose
  survive the popup closing (the old 2017-era limitation). The popup only
  renders status via a `download-status` broadcast when it happens to be open.
- **Promise-based `browser.*` everywhere** + polyfill for Chrome, instead of
  callback `chrome.*` — keeps one code path for both browsers.
- **Provider registry pattern** — the action list, options-page toggles, and
  UI buttons all derive from `providers.js`, so adding an action is one class
  + one registry entry.
- **Un-minified releases** — Mozilla source-review policy (commit 080af17);
  esbuild runs with `minify: false`.
- **esbuild over laravel-mix** (0.20.0) — eliminates the vulnerable
  webpack/laravel-mix dev chain wholesale, and lets the manifests be valid
  JSON merged at build with a single-sourced version.

## External dependencies

- Browser APIs: `tabs`, `downloads`, `bookmarks`, `storage` (the `identity`
  permission was removed with Pocket in 0.18.0).
- Runtime npm deps that actually ship: `webextension-polyfill`,
  `sanitize-filename-ts`, `bootswatch` (CSS). `simple-icons` is still listed but
  unused (its only consumer was the Pocket SVG copy). Build/dev deps are now
  just `esbuild` + Jest/eslint/prettier (laravel-mix/webpack removed in 0.20.0).
