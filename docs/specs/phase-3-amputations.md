# Phase 3 — Amputations (release v0.18.0)

Spec for /auto-dev. Read CLAUDE.md and docs/plan.md Phase 3 first.
Decisions already made by owner (backlog.md Questions #1, #2): remove
Pocket entirely; delete the mime-type feature. Also delete the broken
bulk-action layer and flagged dead code. This phase only deletes/simplifies
— no new features.

## Prerequisites

- Phases 1–2 complete (tests + CI green protect the deletions).

## Task 1 — Remove Pocket (service shut down July 2025)

Delete files: `src/js/pocket.js`, `src/js/auth.js`,
`src/js/services/Pocket.js`, `src/pocket.html`.

Unwire everywhere:
- `src/js/services/providers.js`: drop PocketProvider import/entry.
- `src/js/keys.js`: drop `disableDefaultServices("pocket")` call (keep the
  function only if something else uses it).
- `src/js/options.js` + `src/options.html`: remove the Pocket login row
  (`pocket-status` element, `PocketAPILayer` import, `checkLink` binding,
  `checkLocalLoginStatus` call).
- `src/js/uiAdvanced.js`: remove unused `PocketAPILayer` import.
- `src/js/browser.js`: remove the Pocket-only `login()` method and the
  `config.js` import.
- `webpack.mix.js`: remove the pocket-page bundle, `pocket.html` copy, and
  the simple-icons pocket.svg copy; remove `config.js` from the about-page
  and popup-page bundle arrays.
- **Kill the config.js mechanism entirely**: no module may import
  `./config.js` afterward. Delete `src/js/config-sample.js`, the
  `config.js` line in `src/js/.gitignore`, the README setup paragraph
  about config.js, the CI `cp config-sample` step from Phase 1, and the
  CLAUDE.md landmine entry (replace with a note that the mechanism was
  removed in 0.18.0).
- `src/manifest-base.json`: remove `identity` from permissions, the
  `host_permissions` getpocket entry, and the entire malformed
  `web_accessible_resources` block. Manifest fragments are concatenated —
  keep the concatenation valid and verify both dist manifests parse.
- Update the manifest `description` ("...put them in your Pocket" → tabs
  actions without Pocket).
- Storage: existing users may have `service_pocket` in
  browser.storage.local — leave it ignored (do NOT migrate); add a brief
  comment where services are read.

## Task 2 — Delete the mime-type feature (decorative + broken)

- `src/js/uiAdvanced.js`: remove `getFullMimeType`, `addMimeTypeToTabs`,
  `getContentType`, `setMimeTypesMap`, `mimeTypesMap`, and the
  fullMimeType branch in `displayAdvancedLayout` (flatten its accidental
  parallel `.then(promise)` chaining into a correct sequential flow while
  there); remove the commented-out mime blocks in `assembleForm`.
- `src/js/keys.js`: remove `retrieveFullMimeType`.
- `src/js/options.js` + `src/options.html`: remove the per-mime-type
  settings panel (`mimeTypes`, `mimeSettings`, `createOptionsForm`,
  `createRadioInputs`, save/restore/set MimeSettings, `fullMimeType`
  pref + `preference-input-full-mime-types` checkbox and its binding).
- `src/js/form.js`: drop the now-meaningless `type` parameter threading in
  `createCheckbox`/`createLabel` and the dead image-thumbnail block
  (form.js:76-83).
- Successor feature (URL-type smart defaults) is a separate backlog item —
  do NOT build it here.

## Task 3 — Delete the broken bulk-action layer

- `src/js/services/ServiceProvider.js`: delete `forEachTabDo` (returns on
  first iteration — never worked).
- Delete never-working bulk methods: `Bookmark.bookmarkTabs` +
  `Bookmark.doActionToTabs`, `Close.closeTabs` + `Close.doActionToTabs`,
  `Download.downloadTabs` + `Download.doActionToTabs`.
- KEEP `Clipboard.doActionToTabs` (genuinely used) and the abstract
  `doActionToTabs` on the base class.
- Update docs/code-review-followups.md checkboxes this resolves.

## Task 4 — Dead-code sweep

- `form.getSelectedGroup` (src/js/form.js:114-116) — argument-less
  getElementById, dead.
- `message.js` `restack` no-op case.
- `storage.js` unused instance method `save()`.
- Fix the copy-pasted uiSimple docblock claiming it's the advanced view
  (src/js/uiSimple.js:11-15).

## Release steps

Version **0.18.0** in both files; `npm run dev`; verify both dist
manifests parse AND load-check note for owner (Firefox `about:debugging`,
Chrome unpacked). Update README feature list. Update backlog.md: tick the
items this phase completes.

## Definition of done

Zero references to pocket/config/mime/forEachTabDo anywhere in src/
(grep-verified); permissions shrunk to tabs, downloads, bookmarks,
storage; suite + lint + CI green; both manifests valid; version bumped.
