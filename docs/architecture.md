# Pull Tabs — Architecture

Manifest V3 browser extension, vanilla ES modules, no background script —
everything runs in extension page contexts (popup, options, about).
Last audited 2026-07-05; Pocket/mime/bulk layers removed in 0.18.0 (Phase 3).

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
       ├─ Download.js   → browser.downloads.download + onChanged callback
       ├─ Bookmark.js   → browser.bookmarks.create (into "Pulltabs" folder)
       ├─ Close.js      → browser.tabs.remove (refuses active tab)
       └─ Clipboard.js  → document.execCommand("Copy") via hidden textarea
```

Supporting modules:

- `browser.js` (`browserUtils`) — browser-namespace shim, tab query, Pulltabs
  bookmark-folder discovery/creation, `runtime.getURL` helper. Runs `init()`
  at import time.
- `storage.js` — thin wrapper over `browser.storage.local` (`store`/`retrieve`).
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
   `downloadTabItem-<id>`, and a `downloads.onChanged` listener (registered
   from the popup) reports complete/interrupted and cleans up the key.
4. Autoclose: after any successful action, if the `autoCloseTabs` pref is set,
   the tab is closed via CloseProvider (active tab always refused, since
   closing it kills the popup).

## Storage

Two stores, historically grown:

| Store | Keys | Notes |
|-------|------|-------|
| `browser.storage.local` | layout, autoCloseTabs, `service_*` enabled flags, `downloadTabItem-*` | canonical preference store (a legacy `service_pocket` key may linger for old users; ignored, not migrated) |
| page `localStorage` | `pullTabsFolderId`, `initialSetup` | popup/options page scoped; consolidation pending |

## Build pipeline

`webpack.mix.js` (laravel-mix / webpack):

1. Bundle each page's JS into `build/*-page.js`; combine bootswatch (Bootstrap
   3, yeti theme) + `src/css/styles.css` into `build/style.css`; copy HTML/img.
2. Copy `build/` into `dist/browser/` and `dist/chrome/`.
3. **Manifests are produced by concatenating fragments**:
   `manifest-base.json` (unterminated JSON fragment) + `manifest-browser.json`
   or `manifest-chrome.json` → `dist/*/manifest.json`. Fragments are not
   valid JSON on their own.
4. Chrome bundles get `webextension-polyfill` prepended so promise-style
   `browser.*` calls work.

Release = `npm run dev` (intentionally un-minified per store policy), then zip
the relevant `dist/` directory.

## Key decisions & why

- **No background/service worker** — all listeners live in the popup; simple,
  but download-completion messages are lost if the popup closes (known
  limitation, noted in 2017-era todo.txt).
- **Promise-based `browser.*` everywhere** + polyfill for Chrome, instead of
  callback `chrome.*` — keeps one code path for both browsers.
- **Provider registry pattern** — the action list, options-page toggles, and
  UI buttons all derive from `providers.js`, so adding an action is one class
  + one registry entry.
- **Un-minified releases** — Mozilla source-review policy (commit 080af17).
- **Manifest concatenation** — predates JSON-merge tooling; fragile but
  functioning; replacement is a backlog chore.

## External dependencies

- Browser APIs: `tabs`, `downloads`, `bookmarks`, `storage` (the `identity`
  permission was removed with Pocket in 0.18.0).
- Runtime npm deps that actually ship: `webextension-polyfill`,
  `sanitize-filename-ts`, `bootswatch` (CSS). `simple-icons` is now unused
  (its only consumer was the Pocket SVG copy); `del`, `es6-map`,
  `xmlhttprequest` are unused too (backlog: remove).
