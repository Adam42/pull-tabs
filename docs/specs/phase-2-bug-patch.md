# Phase 2 — Shipped-bug patch (release v0.17.2)

Spec for /auto-dev. Read CLAUDE.md first. Five independent user-visible
bugs; each gets a test where the API surface is mockable.

## Prerequisites

- Phase 1 complete (`npm test` and `npm run lint` green).

## Tasks

1. **Simple-view icon clicks do nothing** — `uiSimple.doActionToAllTabs`
   reads `evt.target.id` (src/js/uiSimple.js:19); clicking the `<img>`
   inside a button yields `""` → `convertActionToProvider("")` throws.
   Fix: resolve the button via `evt.target.closest("button")`; ignore
   clicks outside any button. Test: dispatch click on the img, assert
   action still runs.
2. **Loading spinner 404s on case-sensitive filesystems** —
   src/popup.html:27 references `img/pacman.svg`; the file is
   `src/img/Pacman.svg`. Fix by renaming the file to lowercase
   (consistent with every other icon). macOS is case-insensitive: use a
   two-step rename (`git mv src/img/Pacman.svg src/img/tmp.svg && git mv
   src/img/tmp.svg src/img/pacman.svg`) so git records it.
3. **"Started downloading" shows even on failure** —
   src/js/uiSimple.js:36-44 passes `uiSimple.updateUI(tab, ...)`
   (immediately invoked) to `.then()`. Fix: pass a function. The message
   must only appear when the download promise resolves; the failure path
   already shows "Failed downloading".
4. **Status-message removal crashes** — src/js/message.js:79
   `typeof id === null` is always false; message.js:82-84 throws when the
   element is already gone (timeout firing after manual removal — likely
   cause of the historical "duplicate cloned status messages" bug).
   Fix: null-check properly (`if (id == null)` intent) and guard
   `getElementById` returning null. Test: call removeStatusMessage twice
   with the same id — no throw.
5. **Pulltabs bookmark folder never created when the parent folder is
   empty** — src/js/browser.js:86-102: the for-loop never runs when
   `bookmarks.children.length === 0`, so no folder is created and
   `pullTabsFolderId` stays unset (bookmarks then silently land in the
   browser default folder — Bookmark.js sends `parentId: undefined`).
   Fix: restructure find-then-create so the empty case creates the folder;
   keep the `tree[0].children[1]` root lookup but make it defensive
   (optional chaining + fallback to `tree[0].children[0]`) since Chrome
   and Firefox order root children differently.

## Release steps

- Bump version to **0.17.2** in BOTH `package.json` and
  `src/manifest-base.json` (concatenation landmine — verify built
  manifests parse).
- Build with `npm run dev` (NOT production — store policy).
- Note in the final summary that manual smoke-testing in Firefox + Chrome
  and store submission are owner steps.

## Definition of done

All five fixes in place with tests where feasible, suite green, lint
clean, both dist manifests valid, version bumped in both files.
