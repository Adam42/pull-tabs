# Handoff: Pull Tabs — UI redesign ("Pull" / warm paper)

## Overview
A full redesign of the **Pull Tabs** browser extension (Adam42/pull-tabs) — the window that gathers the current browser window's open tabs and lets the user act on each one (bookmark, save to a read-later service, download, copy to clipboard, close, ignore). This package covers four surfaces:

1. **Main window** — the merged pull screen (replaces the old Simple + Advanced split)
2. **Results state** — in-flight and finished states of a pull (replaces the banner-per-tab stack)
3. **Options page** — settings, reduced to fit the merged model
4. **About page** — product story + credits, reframed around the single-list model

Product decisions baked in:
- **Simple and Advanced are merged into one model.** "Set all →" chips above the list replace the old Simple action grid; a per-row segmented picker replaces the Advanced radio table. There are no layout modes to configure anymore.
- **The read-later provider is user-selectable, one active at a time.** Pocket (shut down 2025) is gone. The **Save** action targets whichever service is active: **Instapaper** (default), **Raindrop.io**, **Readwise Reader**, or a **custom webhook**. Only the active provider runs — see the one-active-provider note under Options. The extension surfaces just the single active Save action; the full provider list lives only on the Options page.
- **Mime-type handling is removed.** The old "get full mime types" HEAD-request routing is gone entirely. A future phase will route by extension/filename instead — not built here, and there is no mime data model left to carry forward.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the pull-tabs extension's existing environment** (WebExtension APIs, its current JS setup) using its established patterns. The JSX here is React written for prototyping convenience; the extension does not need to adopt React — recreate the DOM/CSS and behavior with whatever the codebase already uses.

`tweaks-panel.jsx` and the "Tweaks" UI, the canvas annotations (badges "3A"/"3B", captions), and the "Replay demo" button are **prototype chrome only** — do not implement them.

## Fidelity
**High-fidelity.** Colors, type, spacing, borders, shadows, and copy are final. Recreate pixel-perfectly. The one simulation: sample tabs and favicons are hardcoded — real code uses `tabs.query()` and `tab.favIconUrl` (see Assets).

## Screens / Views

### 1. Main window ("Pull")
Reference: `Mockup 2A - Pull.html` + `MockupRefine.jsx`

- **Window**: 860px wide column; background `--paper #F3EDDF`; border `1.5px solid #1A1714`; radius 14px; shadow `5px 5px 0 #1A1714` (hard offset, no blur). In the real extension this is the popup/tab page — the border/shadow frame is how the mock sits on the canvas; keep the paper background and structure.
- **Header (ink bar)**: height 56px, background `--ink #1A1714`, text `#F3EDDF`, padding 0 22px, flex row, gap 12px. Contents: logo 24×24 (inverted to paper), brand "Pull Tabs" 700/17px, tab count in Space Mono 12px with the number in `--signal #F4502A`, then right-aligned nav (PULL / OPTIONS / ABOUT, Space Mono 11px uppercase, letter-spacing 0.1em; active = white text on `--signal`, radius 6px; hover = `rgba(255,255,255,0.06)`).
- **Body**: padding 22px 26px 20px.
  - **Section header**: "Open tabs" (Space Grotesk 600/19px) + right-aligned kicker "5/6 SELECTED" (Space Mono 11px uppercase, `--ink-3`), 1.5px ink rule beneath.
  - **Set-all toolbar**: label "SET ALL →" + one chip per action. Chip: pill (999px), `1.5px solid --ink`, background `--card #FCFAF3`, shadow `2px 2px 0 --ink`, padding 7px 13px, icon 15px + label 13px/600. Active chip (all rows share that action): `--signal` background, white text/icon. Press: translate(2px,2px), shadow collapses to 0.
  - **Tab list**: one card (`--card`, 1.5px ink border, radius 12px, shadow `3px 3px 0 --ink`), rows divided by `1px solid --line-soft #D8CFB9` — no per-row borders/shadows. Row: padding 11px 15px, gap 13px: checkbox (22px, checked = `--signal` fill + white check), favicon tile (20px, 1.5px ink border, radius 6px, white bg), title (600/14px, ellipsis) over URL (Space Mono 11.5px, `--ink-3`), then a per-row segmented picker (icons only, 6 segments incl. Ignore; selected segment = `--signal` bg + white icon; 1.5px ink border, radius 7px).
  - **Unchecked row**: 45% opacity + `--paper-2` background, grayscale favicon, title in `--ink-3`, picker non-interactive at 60% opacity.
- **Footer (sticky)**: `1.5px solid --ink` top border, `--paper-2` background, padding 13px 26px, space-between. Left: meta line in Space Mono 12.5px `--ink-3` — "5 tabs → mixed actions" or "5 tabs → Bookmark" when uniform. Right: "AUTOCLOSE ON" meta + primary CTA "Pull 5 tabs" (`--signal` bg, white text, 1.5px ink border, radius 9px, shadow `3px 3px 0 --ink`; disabled at 45% opacity when 0 selected).

### 2. Results state
Reference: `Mockup 2A - Pages.html` frame 3A + `Mockup2APages.jsx` (`MockupResults`)

Same window; the list becomes the receipt. **No stacked banners.**

- Header count swaps to "pulling **5** tabs…" then "**4**/5 pulled".
- **Summary strip** (replaces set-all toolbar): 1.5px ink border, radius 9px, shadow `3px 3px 0 --ink`, padding 11px 16px, 600/14.5px.
  - Working: `--info-tint #D9E9EC`, spinner (13px, 2.5px ink ring) + "Pulling 5 tabs — 2 of 5 done"
  - Any failures: `--fail-tint #F6DED8`, "✕ 4 of 5 pulled — 1 failed." + meta "retry below, or reconnect Instapaper in Options"
  - All good: `--success-tint #DCEFE2`, "✓ All 5 tabs pulled — tabs closed." + meta "autoclose on"
- **Rows** (checkbox replaced by the row's action icon, 17px):
  - queued: 55% opacity, mono "queued" in `--ink-3`
  - pulling: `--info-tint` bg, spinner + mono "pulling…" in `--info #2C6E7A`
  - success: `--success-tint` bg, mono `✓ bookmarked` / `saved` / `copied` / `downloaded` / `closed` in `--success #2E8B57` (Space Mono 11px, 700, uppercase). If autoclose closed the tab, append " · tab closed" and dim title/favicon (row class `gone`).
  - failed: `--fail-tint` bg, `✕ failed` in `--fail #C2371F` + reason line below (Space Mono 10.5px, e.g. "not authorized (401)") + small **Retry** button (btn-sm: 7px 11px, 13px, shadow 2px 2px 0).
  - skipped (unchecked): dimmed, mono "skipped"
- **Footer**: left meta "4 done · 1 failed"; right — when failures exist: primary "Retry 1 failed"; otherwise "Close window" (disabled while working). Rows process sequentially (~550ms apiece in the demo) — real timing is per-request.

### 3. Options page
Reference: `Mockup 2A - Pages.html` frame 3B + `Mockup2APages.jsx` (`MockupOptionsPage`)

Same window/header (OPTIONS nav active; header count area reads "changes save automatically"). Body scrolls (padding 6px 26px 24px). Sections, each under a section-header rule with mono kicker:

1. **Read-later service** (kicker: save destination) — the provider picker. Intro meta: "The **Save** action sends a tab to one read-later service. Pick the one you use — only the active service runs." Then a single card containing 4 radio rows (`--card` bg, `1px --line-soft` dividers, padding 13px 16px, whole row clickable):
   - Left: radio dot (16px, 1.5px ink ring; selected = `--signal` fill with a 2.5px `--card` inset ring). Then provider glyph (22px, monochrome ink). Then name (600) + meta description.
   - Active row: `--signal-tint` background. If connected/valid, an "active" chip sits next to the name.
   - Providers: **Instapaper** (default active, starts connected), **Raindrop.io**, **Readwise Reader**, **Custom webhook**.
   - Right side of the active row: for OAuth providers (all except webhook) → primary "Connect" when signed out, ghost "Sign out" when connected. Inactive rows show mono "select".
   - **Below the card**, conditional on the active provider:
     - webhook → "Endpoint URL" label + `.input` url field (placeholder `https://hooks.example.com/pull-tabs`) + meta: each saved tab sends a JSON `POST` with `url`, `title`, `favIconUrl`.
     - any OAuth provider not yet connected → a `--fail-tint` summary strip: "✕ Not connected — Save will fail until you connect &lt;provider&gt;."
   - **One active provider only.** Selecting a row makes it the sole active destination — this is deliberate, not a limitation: the single "Save" action needs one unambiguous target, and multi-enable would reintroduce the Simple/Advanced ambiguity the merge removed. Multiple accounts *may* be authorized, but exactly one is active. Do not build save-to-all fan-out.
2. **Pulling** (kicker: behavior) — settings rows (15px 0 padding, `--line-soft` dividers, title 600/15px + meta description, control right-aligned):
   - "Autoclose" — toggle switch (46×26; on = `--signal` track, white thumb)
   - "Default action" — select (1.5px ink border, radius 9px, shadow 2px 2px 0)
3. **Actions** (kicker: picker) — chip row identical to set-all chips; on = shown in pickers, off = hidden. Copy: "Choose which actions appear in the set-all chips and each row's picker."

Footer: meta "Pull Tabs v2.0 · settings sync with your browser profile" / "AUTOCLOSE ON".

### 4. About page
Reference: `Mockup 2A - Pages.html` frame 3C + `Mockup2APages.jsx` (`MockupAbout`)

Same window/header (ABOUT nav active, header count area reads "v2.0"). Body: logo 44px + wordmark + tagline "Empty your window in one pull."; lead paragraph; a **"How it works"** section (section-header, kicker "the whole idea") = three `.well` cards in a 3-col grid, each a numbered `--signal` circle chip + title ("Pull" / "Set" / "Go") + description; a follow-up meta paragraph stating there are no Simple/Advanced modes; an action chip row (save to instapaper / bookmark / download / copy url / close); then **Credits** (section-header, kicker "attribution") — build byline + a `.well` two-column icon-attribution grid. Footer: "Pull Tabs v2.0 · MIT licensed · open source" / "MADE FOR TAB HOARDERS".

## Interactions & Behavior
- Checkbox or row-text click toggles a row; toggling clears any result state.
- Set-all chip sets every row's action; chip lights only while ALL rows share that action.
- Per-row picker click sets that row's action; Ignore keeps the row checked but excluded from the pull count.
- CTA label = number of checked, non-ignored rows; disabled at zero.
- Pull: rows process sequentially (queued → pulling → result). Retry re-runs only failed rows.
- All transitions ~90–140ms with easing `cubic-bezier(0.2, 0, 0.1, 1)`. Tactile press: translate by the shadow offset, shadow collapses to 0. Spinner: 0.7s linear rotation.
- Focus: `2.5px solid --signal` outline, offset 2px.

## State Management
- Per row: `{ id, title, url, favIconUrl, checked, action, state: null|queued|pending|successful|failed, failReason? }`
- Window: `pulled` phase (idle | working | done), derived counts (checked, done, failed), `allSame` (uniform action or null).
- Options (persisted to extension storage): `autoclose: bool`, `defaultAction`, `enabledActions: set`, `provider` (active read-later service id), per-provider auth state (`{ instapaper, raindrop, readwise }`), `webhookUrl`.
- Tabs come from `tabs.query({ currentWindow: true })`; favicons from `tab.favIconUrl` with a fallback tile. No HEAD requests — mime detection is removed.

## Design Tokens
Fonts: **Space Grotesk** (UI; 400/500/600/700) + **Space Mono** (meta, labels, URLs, results; 400/700) — Google Fonts.

Colors:
- `--ink #1A1714` · `--ink-2 #4F483D` · `--ink-3 #908775`
- `--paper #F3EDDF` · `--paper-2 #EAE2CF` · `--card #FCFAF3` · `--line-soft #D8CFB9`
- `--signal #F4502A` (the ONLY accent — selection, primary, focus, active nav) · press `#CB3A18` · tint `#FBE4DA`
- Results only: `--success #2E8B57`/`#DCEFE2` · `--fail #C2371F`/`#F6DED8` · `--info #2C6E7A`/`#D9E9EC`
- On-ink text: `#F3EDDF`, dim `#A89F8C`
- Radii: 6 / 9 / 14px (+999px pills). Borders: 1.5px ink (dividers 1px `--line-soft`). Shadows: hard offset, no blur — `2px 2px 0`, `3px 3px 0`, `5px 5px 0` ink.

**One-signal rule**: vermilion is reserved for "action/active/pull". Never introduce a second accent; green/red/teal appear only as result states.

## Assets
- `img/logo.svg` — Pull Tabs mark (inverted white-on-ink in headers)
- `img/{bookmark,clipboard,close,download,ignore,instapaper}.svg` — action icons (~17px, monochrome ink; white via invert when on `--signal`). Instapaper glyph vendored from Simple Icons.
- `img/{raindrop,readwise,webhook}.svg` — read-later provider glyphs for the Options picker (22px, monochrome ink). Authored for this design (not in Simple Icons); replace with official brand marks if you have license to.
- `img/fav/*.svg` — **prototype-only** favicon stand-ins. Real implementation: `tab.favIconUrl` in a 20px white tile with 1.5px ink border; fallback = colored square or letter tile.

## Files
- `Mockup 2A - Pull.html` — main window (open in a browser; interactive)
- `Mockup 2A - Pages.html` — results + options + about canvas (3A auto-plays; all interactive)
- `mockup-refine.jsx` / `mockup-2a-pages.jsx` — behavior source for main window / results + options
- `components.jsx` — shared primitives (Icon, Favicon, Check, Switch, Button, SectionHeader, action catalogue)
- `popup.jsx` — sample tab data (`PT_SAMPLE_TABS`) + legacy popup (superseded; kept for context)
- `theme.css` — the design system (tokens + component classes) — treat as source of truth for values
- `mockups.css` — window-specific layout (`rf-*`, results `.rf-summary`, options `op-*`); ignore `rk-*` and `opt-*` (canvas chrome / an unshipped exploration)
- `tweaks-panel.jsx` — prototype chrome; ignore
