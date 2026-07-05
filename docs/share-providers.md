# Share-to-social providers — design sketch

Companion to [read-later-services.md](read-later-services.md). Researched
2026-07-05. Origin: long-standing idea (credit: Adam's partner) — per-tab
"draft a post" targeting a social network. Twitter was the original target;
the idea generalizes to its successors.

## Core insight: compose intents, not APIs

Every viable target offers a **compose intent URL** — open their composer
pre-filled, user edits and posts. That means:

- **No auth at all.** No tokens, no OAuth, no `identity` permission, no
  credentials in storage. The provider is ~10 lines calling
  `browser.tabs.create({ url: intentUrl, active: false })`.
- **Better UX than API posting** for social: a pre-filled draft the user
  reviews *is* the feature. Silent API auto-posting is what you'd want for
  read-later services, not for public posts.
- **Confirms the Phase 3 decision to drop `identity`**: the only
  integrations that would need `launchWebAuthFlow` (Reddit's OAuth API,
  Meta's Threads/Facebook APIs) are strictly worse than their intent URLs
  for this use case.

## Targets

| Service | Intent URL | Notes |
|---|---|---|
| Bluesky | `https://bsky.app/intent/compose?text=<title+url>` | Official ([docs](https://docs.bsky.app/docs/advanced-guides/intent-links)); 300 grapheme limit — truncate title, never the URL |
| Threads | `https://www.threads.net/intent/post?url=<url>&text=<title>` | Official Meta ([docs](https://developers.facebook.com/docs/threads/threads-web-intents/)); separate `url` param gives a link attachment |
| Reddit | `https://www.reddit.com/submit?url=<url>&title=<title>` | User picks subreddit in the composer — exactly right |
| Facebook | `https://www.facebook.com/sharer/sharer.php?u=<url>` | Legacy but maintained; text prefill not supported |
| X/Twitter | `https://twitter.com/intent/tweet?url=<url>&text=<title>` | Works; skipped by default (owner preference), trivial to enable |
| Mastodon | `https://<instance>/share?text=<title+url>` | Needs an instance-URL field in options; only build on request |
| Email | `mailto:?subject=<title>&body=<url>` | Universal, zero-cost |
| Hacker News | `https://news.ycombinator.com/submitlink?u=<url>&t=<title>` | Niche, zero-cost |
| Instagram | — | **Not feasible**: no web compose intent; Graph API publishing is business-accounts-only |

## Architecture

One shared class, per-service config — these providers differ only in URL
template:

```js
// services/ShareIntentProvider.js — base: builds intent URL, opens
// background tab, resolves when tabs.create resolves
// services/shareTargets.js — { bluesky: {template, params, limit}, ... }
```

Registry-wise each enabled target still gets its own entry in
`providers.js` (that's what auto-surfaces buttons + options toggles), but
they're 3-line subclasses. All default to **disabled** in `keys.js` so the
button row doesn't triple in size for users who don't share.

### Bulk UX guard (the one real design problem)

N selected tabs = N composer windows. Rules:

- Advanced per-tab layout is the natural home (pick 2–3 tabs to share).
- Simple layout "share all" must confirm above a small threshold (~3 tabs)
  via a status-bar confirm, or cap and say so.
- Open intent tabs with `active: false` so the popup survives to report
  status, matching the existing Close-provider constraint.

### Manifest impact

None. Intent URLs are ordinary navigations — no `host_permissions`, no new
API permissions. (Nice store-review story: Pocket removal drops
`identity` + getpocket host permission; read-later adds two hosts; share
providers add nothing.)

## Sequencing

Slots in as **Phase 5e** (after read-later 5a–5d, same release or the next):
build `ShareIntentProvider` + Bluesky + Threads + Reddit first (the ones with
owner demand), leave Facebook/X/Mastodon/Email/HN as config entries added on
request. Icons: simple-icons has all of these marks; copy at build like
pocket.svg today.
