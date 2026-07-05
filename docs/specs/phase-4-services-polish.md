# Phase 4 — Services-layer polish

Spec for /auto-dev. Read CLAUDE.md and docs/code-review-followups.md
("Still valid, NOT previously captured" section = this phase's checklist).
No user-visible behavior changes intended; no release required (these ship
with Phase 5's v0.19.0).

## Prerequisites

- Phase 3 complete (Pocket + bulk layer gone — do not polish deleted code).

## Tasks

1. **Async/await consistency**: convert `Close`, `Download`, and
   `Clipboard` provider methods to `async` (Bookmark + the base class
   already are, from the landed WIP). `doActionToTab` implementations
   return awaited results; no bare `.then` chains inside providers
   (Download.js:39, 72 — also remove the stray `this` passed as a `.then`
   rejection handler).
2. **Standardize error handling**: async methods throw `Error` with a
   human-meaningful message; eliminate `Promise.reject(new Error("fail"))`
   (Download.js:56, Clipboard.js:45). One consistent format:
   `"<Action> failed: <reason>"`. Never swallow errors silently.
3. **`validateTab(tab)` helper on ServiceProvider** (url + title checks);
   replace Bookmark's inline validation; call it in Close/Download/
   Clipboard entry points too.
4. **Abstract-class guard**: constructor throws if
   `new.target === ServiceProvider`.
5. **Delete redundant constructors** that only call `super(tabs)` in all
   providers.
6. **`Object.freeze(Providers)`** in providers.js + JSDoc typedef for the
   registry shape.
7. **`UI.doActionToTabForTabs` hardening** (src/js/ui.js:33-48): validate
   tabs array, non-empty action string, and that `view` implements
   `updateUIWithSuccess`/`updateUIWithFail`; convert to async/await; add a
   success/fail summary — after all per-tab promises settle
   (`Promise.allSettled`), emit one status message like
   "7 bookmarked, 2 failed" via messageManager.
8. **JSDoc completeness pass** over `src/js/services/`: real
   `@param`/`@returns`/`@throws`; remove `[description]` placeholders.
9. **Tests alongside every change**: each provider's happy path + error
   path with mocked `browser.*` globals; validateTab; the summary-count
   aggregation; ServiceProvider abstract guard.

## Constraints

- UI strings for individual per-tab success/fail messages stay as-is
  (only the new summary line is added).
- Don't rename public methods or action names (stored preference keys
  depend on action names).
- Prettier formatting, double quotes, 2-space indent.

## Definition of done

docs/code-review-followups.md "NOT previously captured" items all
resolved (check them off + note date); suite green with meaningfully more
coverage; lint clean; `npm run dev` builds; no manifest or version changes.
