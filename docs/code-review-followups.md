# Code Review Follow-ups (services layer)

Status reconciliation of the earlier services-layer code review checklist
against the working tree on `refactor/async-services` (checked 2026-07-05).
That review is what spawned the WIP on this branch — roughly a third of it
got implemented before work stopped.

Master list for bugs/priorities is [backlog.md](../backlog.md); this doc
tracks only the review-specific remainder so nothing from the checklist is
lost.

## ✅ Already done (mostly by the uncommitted WIP — commit it to bank these)

- ServiceFactory: `const`/`let` throughout, `Object.keys().map()` in
  `getActions()`, input validation + missing-provider error in
  `convertActionToProvider` (ServiceFactory.js:25-52).
- ServiceProvider: constructor validates tabs is an array
  (ServiceProvider.js:8), abstract methods are `async` and throw
  "must be implemented" instead of `console.log` (ServiceProvider.js:18-28),
  `@abstract` JSDoc tag present (ServiceProvider.js:4).
- Bookmark: method casing is consistently `bookmarkTab`; tab validation
  (url/title) added; `async`/`await` + try/catch around
  `browser.bookmarks.create()` — **modulo the duplicated `doActionToTab`
  with the mangled template string, which must be fixed before commit**
  (backlog: Bugs #1).

## 📋 Still valid, already captured in backlog.md

| Checklist item | Where captured |
|---|---|
| ✅ `forEachTabDo` returns after first iteration | Resolved 0.18.0 (Phase 3): bulk layer deleted |
| ✅ `.call(this)` invoked-instead-of-passed in Bookmark/Close/Pocket | Resolved 0.18.0 (Phase 3): fake bulk methods deleted (Pocket removed) |
| ✅ `Promise.all`/batching in `bookmarkTabs` | Resolved 0.18.0 (Phase 3): `bookmarkTabs` deleted |
| Validate bookmark folder id exists in storage | Bugs — "Pulltabs folder never created…" (bookmarks silently land in default folder) |
| `localStorage["pullTabsFolderId"]` direct access | Improvements — consolidate `localStorage` → `browser.storage.local` (supersedes the `getItem` suggestion) |
| Unit tests for providers + factory | Bugs — "Jest can't run"; Improvements — "grow the test suite" |

## 🔲 Still valid, NOT previously captured — the new todo list

Ordered by (impact ÷ effort). All S unless noted.

All nine resolved in **Phase 4** (services-layer polish, done 2026-07-09;
ships with Phase 5's 0.19.0). Suite green (44 tests), lint clean (0 errors),
`npm run dev` builds, no manifest/version change.

- [x] **Async/await consistency across remaining providers** — Close,
  Download, Clipboard still use sync methods / bare `.then` (Download.js).
  Finish what the WIP started in Bookmark/ServiceProvider.
  DoD: every provider's `doActionToTab`/`doActionToTabs` is `async` and
  returns a settled-able promise; UI callers unchanged or simplified.
  Done (2026-07-09): Close/Download/Clipboard entry methods are `async`;
  Download's `.then` chain + stray `this` handler rewritten to `await`.
- [x] **Standardize error handling & message format across providers** —
  today a mix of `throw new Error("Failed to bookmark…")`,
  `Promise.reject(new Error("fail"))` (Download.js:56, Clipboard.js:45), and
  silent catch-and-log. DoD: one pattern (throw from async methods, real
  messages), no `"fail"` strings.
  Done (2026-07-09): one format `"<Action> failed: <reason>"`, wrapped once
  per public entry; workers throw unprefixed reasons; no `"fail"` strings.
- [x] **`validateTab()` helper on ServiceProvider** — Bookmark now validates
  url/title inline; hoist to the base class so Close/Download/Clipboard get
  it too. DoD: shared helper, Bookmark's inline check replaced.
  Done (2026-07-09): `static ServiceProvider.validateTab(tab)`; all four
  providers call it, Bookmark's inline check removed.
- [x] **Aggregated results summary in `UI.doActionToTabForTabs`**
  (ui.js:33-48) — success/fail counts surfaced after a batch, e.g. "7
  bookmarked, 2 failed". Also revives the 2017 todo.txt "summary view" idea
  in minimal form. Effort M. DoD: batch actions end with a single summary
  status message.
  Done (2026-07-09): `Promise.allSettled` + one summary line via
  `messageManager`, using a `PAST_TENSE` map (no `"closeed"`).
- [x] **Input validation in `UI.doActionToTabForTabs`** — validate tabs
  array, action string, and that `view` implements
  `updateUIWithSuccess`/`updateUIWithFail` (the implicit view contract,
  currently unchecked). DoD: bad calls fail loudly with clear messages.
  Done (2026-07-09): all three inputs validated, throwing `TypeError`.
- [x] **`Object.freeze(Providers)`** (providers.js:7-13) + JSDoc typedef for
  the registry shape. DoD: registry immutable at runtime, typed.
  Done (2026-07-09): `Object.freeze` + `ProviderRegistry` typedef.
- [x] **Abstract-class enforcement** — `new.target === ServiceProvider` check
  in the constructor so the base class can't be instantiated directly.
  DoD: direct instantiation throws; providers unaffected.
  Done (2026-07-09): constructor throws `TypeError` on direct instantiation.
- [x] **Remove redundant `constructor(tabs) { super(tabs); }`** in the
  remaining providers (Bookmark, Clipboard, Close, Download). DoD:
  constructors deleted, behavior identical.
  Done (2026-07-09): verified none of the four providers had a redundant
  constructor — nothing to remove.
- [x] **JSDoc completeness pass** — `@param`/`@returns`/`@throws` on public
  service-layer methods; kill the leftover `[description]` placeholders.
  DoD: no empty JSDoc placeholders in `src/js/services/`.
  Done (2026-07-09): real `@param`/`@returns`/`@throws` across the services
  layer; `[description]` placeholders removed.

## ❌ Reviewed and declined (recorded so they don't resurface)

- **Batch/parallel processing options in `forEachTabDo`, retry logic,
  AbortSignal cancellation, progress callbacks** — over-engineering for a
  popup acting on one window's tabs (typically < 100, and browser APIs
  queue internally). Revisit only if real users report hangs.
- **ProviderRegistry pattern / provider metadata** — YAGNI; the frozen
  static registry is the right size. The 2017 `service.js` prototype tried
  dynamic registration and was abandoned.
- **TypeScript migration** — not worth the toolchain churn for this codebase;
  the JSDoc pass above is the 80/20. Reconsider if the build tool is
  replaced anyway (backlog Improvements) and appetite exists.

## Answers to the review's open questions

1. **Other providers with BookmarkProvider-style issues?** ✅ Resolved in
   0.18.0 (Phase 3). The immediately-invoked `.call(this)` bug (Close,
   Bookmark, and the removed Pocket provider) and Download's broken bulk path
   (`this.updateUI`) all lived in the never-working bulk layer, which was
   deleted wholesale along with `ServiceProvider.forEachTabDo`. Clipboard's
   genuine `doActionToTabs` is the only bulk method that remains.
2. **Does UI have proper interface contracts providers depend on?**
   Inverted: providers don't call UI; UIs pass themselves as `view` into
   `UI.doActionToTabForTabs`, which implicitly requires
   `updateUIWithSuccess`/`updateUIWithFail`. Unvalidated — see new todo above.
3. **Test coverage that might break?** None in practice — the only suite
   (ServiceFactory) can't even run until the Jest ESM config is fixed
   (backlog). Change freely; fix Jest first to bank regression protection.
4. **Existing patterns to respect?** Registry-driven providers (adding to
   providers.js auto-populates UIs and options), promise-based `browser.*`
   only, no framework, un-minified releases. Codified in CLAUDE.md.
5. **Is `browser.bookmarks` correct vs `chrome.bookmarks`/browserUtils?**
   Yes — project convention is the promise-based `browser.*` namespace with
   webextension-polyfill prepended for Chrome builds. `browserUtils` wraps
   helpers, not API namespaces. Keep `browser.bookmarks`.
