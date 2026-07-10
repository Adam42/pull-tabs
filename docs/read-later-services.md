# Read-later services — Pocket replacement design

Plan for replacing the defunct Pocket integration with modern save-to-service
providers. Researched 2026-07-05 against each service's public docs.

## Feasibility summary

| Service | API | Auth | Extension fit | Verdict |
|---|---|---|---|---|
| Raindrop.io | REST, `api.raindrop.io/rest/v1` | OAuth2 (needs client_secret) **or user-generated test token** | CORS supported; 120 req/min; true bulk endpoint | ✅ Build (token mode) |
| Instapaper | Simple API, `instapaper.com/api/add` | HTTP Basic (username + optional password); no consumer key | HTTPS-only; trivial save call; 201 = saved | ✅ Build |
| Mailist | **None public** | — | FAQ lists only manual entry / their own extensions / bookmarklets / import | ❌ Blocked — watch item |

Sources: [developer.raindrop.io](https://developer.raindrop.io/) (auth:
[token flow](https://developer.raindrop.io/v1/authentication/token)),
[instapaper.com/api](https://www.instapaper.com/api) ([Simple
API](https://www.instapaper.com/api/simple)),
[mailist.app/faq](https://www.mailist.app/faq).

## The auth decision (and why it kills a whole subsystem)

Raindrop's full OAuth2 code flow requires `client_secret` in the token
exchange — for a GPL extension distributed as an unpacked zip, that secret
ships to every user, which is the same structural problem Pocket's
consumer key had (the reason `config.js` is a gitignored landmine today).

Instead, both providers use **user-supplied credentials pasted into the
options page**:

- **Raindrop**: user creates a personal "test token" in Raindrop's App
  Management Console (Settings → Integrations → For Developers). Test tokens
  don't expire. Options page stores it; requests send
  `Authorization: Bearer <token>`.
- **Instapaper**: user enters their Instapaper username (+ password if they
  have one). Requests use HTTP Basic Auth per Instapaper's own guidance.

Consequences:

- `auth.js`, the `identity` permission, `launchWebAuthFlow`, `pocket.html`,
  and the entire `config.js`/`config-sample.js` secret mechanism are deleted
  in the Pocket amputation and **never come back**. No secrets in the repo,
  none in the shipped zip.
- Trade-off accepted: pasting a token is clunkier than an OAuth dance, but
  it's honest about what a distributed open-source extension can protect,
  and it matches the project's hobby bar. If Raindrop ever ships a
  PKCE/secretless flow, revisit.

## Architecture fit

The provider registry does most of the work — each service is one class +
one registry line, and buttons/options-page toggles appear automatically:

```
src/js/services/Raindrop.js    extends ServiceProvider
src/js/services/Instapaper.js  extends ServiceProvider
src/js/services/providers.js   + RaindropProvider, InstapaperProvider
src/img/raindrop.svg           (simple-icons has both marks; copied at build
src/img/instapaper.svg          like pocket.svg is today — webpack.mix.js)
```

New shared piece — `src/js/services/credentials.js` (working name): get/set
service credentials in `browser.storage.local` (NOT page `localStorage`;
aligns with the storage-consolidation backlog item), plus a
`verify(service)` helper the options page calls to test credentials
(Raindrop: `GET /rest/v1/user`; Instapaper: `POST /api/authenticate`,
200 = valid).

### RaindropProvider

- `doActionToTab(tab)` → `POST https://api.raindrop.io/rest/v1/raindrop`
  with `{ link: tab.url, title: tab.title, pleaseParse: {} }`.
- `doActionToTabs()` → `POST /rest/v1/raindrops` (plural) — up to 100 per
  call. **First genuine bulk implementation besides Clipboard**; the simple
  layout's Raindrop button should use it (1 request instead of N; rate limit
  is 120/min).
- 401 → "Check your Raindrop token in Options" message; 429 → back off and
  surface "rate limited, try again shortly".

### InstapaperProvider

- `doActionToTab(tab)` → `POST https://www.instapaper.com/api/add` with
  `url` (+ optional `title`), HTTP Basic Auth. 201 = saved, 403 = bad
  credentials, 400/500 = failure. Response body is just the status code.
- No bulk endpoint — per-tab loop like Bookmark/Close (sequential, small
  delay between calls; Instapaper publishes no rate limit, so be polite).
- No `selection`/description param abuse; keep it to url+title.

### Options page

New "Connected services" section replacing the Pocket login row:

- Raindrop: token input + "Verify" button + link to Raindrop's token page.
- Instapaper: username + password inputs + "Verify".
- Services stay `disabled` in `keys.js` defaults until credentials verify
  (same pattern as `disableDefaultServices("pocket")` today), so users who
  don't care never see the buttons.

### Manifest

Add `host_permissions`: `https://api.raindrop.io/*`,
`https://www.instapaper.com/*` (replacing the getpocket.com entry).
Raindrop supports CORS so a host permission may be technically optional, but
declaring both keeps fetch behavior identical across browsers and makes the
data flow reviewable. Store-review note: permissions change triggers manual
review on AMO; batch it with the Pocket-removal release so users see one
permission *swap*, not two changes.

### Security notes

- Credentials live in `browser.storage.local` — plaintext, same trust level
  every extension with `storage` has for its own data. Documented in the
  options UI ("stored locally on this device only").
- All calls HTTPS. No third-party analytics, no server of ours in the middle.
- Never log tokens/passwords; error messages include status codes only.

## Second-round screen (2026-07-05, from owner-supplied listicles)

Screened the candidates from mailist.app's and Zapier's "Pocket
alternatives" roundups against the same bar: public API + paste-able auth
(no distributable client_secret).

| Candidate | API / auth | Verdict |
|---|---|---|
| **Readwise Reader** | `POST readwise.io/api/v3/save/`, `Authorization: Token` (user copies from readwise.io/access_token), 50 req/min | ✅ **Build — promote to first-class alongside Raindrop/Instapaper.** Major Pocket-refugee destination; identical pattern to Raindrop's token paste |
| **Pinboard** | `posts/add` with user auth token; API stable 15+ years | ⚪ Cheap optional; add on request |
| **linkding** (self-hosted) | REST + user token | ⚪ Self-hosted tier, cleanest of the three; on request |
| **Karakeep** (ex-Hoarder, self-hosted) | REST + API key | ⚪ Self-hosted tier; on request |
| **Wallabag** (self-hosted) | OAuth2, but the *user* owns the server and creates the client — pasting serverURL + client id/secret + user/pass is acceptable for self-hosters | ⚪ Self-hosted tier; clunkiest setup; on request |
| **Generic webhook** | User pastes any HTTPS URL; we `POST {url, title}` | ✅ **Build — tiny and high-leverage.** Covers Zapier/n8n/IFTTT/Make (the Zapier article's actual answer), and any future self-hosted PullTabs server (backlog parking lot) |
| Chrome Reading List | Native `chrome.readingList` extension API — zero account | ⚪ Interesting but Chrome-only (no Firefox parity) + new `readingList` permission; parking lot |
| Omnivore | **Dead** — shut down Nov 2024 (ElevenLabs acquihire), data deleted; some listicles still recommend it | ❌ |
| Matter | No public API (unofficial reverse-engineered only) | ❌ |
| Evernote / OneNote / Notion | OAuth platforms w/ secrets; Notion *could* work via user-created internal-integration token but needs a database-picker UX and is a notes tool, not read-later | ❌ (Notion → parking lot at most) |
| Feedly / Inoreader | OAuth w/ secret; RSS readers where save-URL is secondary | ❌ |
| Safari Reading List | No extension API exposed | ❌ |

Net effect on the build: **three first-class providers** (Raindrop,
Instapaper, Readwise Reader) plus the **webhook escape hatch**, all on the
same credentials.js foundation; self-hosted tier and Pinboard as
demand-driven follow-ups. Still nothing that needs `identity` or a secret.

## Dropbox (owner-requested, third round — 2026-07-05)

Different shape from everything above, and worth it:

- **The endpoint is a gift**: `POST /2/files/save_url` makes *Dropbox's
  servers* fetch the URL and store the file — no client-side download,
  async job with a status-check endpoint
  ([docs](https://www.dropbox.com/developers/documentation/http/documentation),
  [dropbox.tech writeup](https://dropbox.tech/developers/programmatically-saving-a-url-to-dropbox)).
  Pairs perfectly with URL-type smart defaults ("PDFs → Dropbox").
- **No secret needed** — Dropbox explicitly recommends **OAuth2 + PKCE**
  for browser apps ([PKCE guide](https://dropbox.tech/developers/pkce--what-and-why-));
  the app key is public by design.
- **But it's the one provider that re-needs `identity`**: PKCE requires a
  real authorization redirect (`identity.launchWebAuthFlow`), and Dropbox
  issues **short-lived (~4h) access tokens + long-lived refresh tokens**
  ([offline access guide](https://dropbox.tech/developers/using-oauth-2-0-with-offline-access)),
  so credentials.js grows token-refresh logic. No paste-a-permanent-token
  path exists (long-lived tokens were retired in 2021).

**Tier decision**: build *after* the token-paste providers (5a–5d ship
first), as its own sub-phase. Permission strategy: since Chrome disables an
extension pending user re-approval when permissions grow, either (a) bundle
Dropbox into the same release as the other new host permissions (one
re-approval event — requires building it in Phase 5), or (b) ship it later
and accept a second re-approval prompt. Owner's call when Phase 5 starts;
the P3 `identity` drop stays correct either way — never ship an unused
permission, re-request with justification when the feature lands.

## Mailist

No public API (verified against their FAQ, 2026-07-05 — manual entry, their
own extensions, bookmarklets, and Pocket-import only; no Zapier either).
Options, in order of preference:

1. **Watch item** — email contact@mailist.app asking if an API or
   email-in-address exists or is planned; revisit on reply. (Their Pocket
   *import* feature suggests they understand the migration moment.)
2. Not worth building: scraping their web app or driving their extension —
   fragile, ToS-risky, against this project's bar.

Tracked in backlog.md as a blocked improvement; not part of the build phases
until an API exists.

## Implementation phases (slots into docs/plan.md as Phase 5)

**5a — Foundation (S/M):** `credentials.js` storage + verify helpers;
options-page "Connected services" section with per-service enable gating.
Tests: credential round-trip, verify() against mocked fetch.

**5b — Raindrop (S/M):** provider class (single + true bulk), icon, registry
entry, manifest host permission, error mapping (401/429). Tests: payload
shape, bulk chunking at 100, error paths. Manual smoke: save 3 tabs, check
they land in Raindrop "Unsorted".

**5c — Instapaper (S):** provider class (single), icon, registry entry,
manifest host permission, 403 handling. Tests: Basic-Auth header
construction, 201/403 paths.

**5c′ — Readwise Reader (S):** provider class (single save; 50 req/min is
ample), icon, registry entry, `https://readwise.io/*` host permission,
401 handling + token-verify via `GET /api/v2/auth/`. Tests: Token header,
payload shape.

**5c″ — Generic webhook (S):** options field for an HTTPS URL,
`POST {url, title}` per tab; no icon dependency (generic send icon); no new
host permission possible (user-defined host) — document that it relies on
the target's CORS or an `optional_host_permissions` request at save time.
Tests: payload, non-2xx error path.

**5d — Release (S):** version bump (both files), README + store listings
("save tabs to Raindrop, Instapaper, or Readwise Reader"), screenshots,
AMO/CWS submission with the permission-swap notes.

Prerequisites: Phase 3 (Pocket amputation) and ideally Phase 4 (async/error
polish) — new providers should be born async with standardized errors, not
retrofitted.

## Implementation deviations (Phase 5 / 0.19.0)

Recorded as built; the design above is otherwise accurate.

- **Instapaper politeness gap dropped.** The spec suggested a ~250ms gap
  between per-tab saves. Enforcing it needs a sequential await-loop (trips the
  `no-await-in-loop` lint rule) or a bulk branch that loses the per-tab
  feedback/autoclose semantics of `UI.doActionToTabForTabs`. Instapaper has no
  published rate limit and one window's tabs is a small burst, so saves fire in
  parallel like the other per-tab providers.
- **Webhook enablement is gated on a real save-schema test POST, not just a URL
  shape check.** `credentials.verify("webhook", …)` sends the exact
  `{url, title}` payload (no extra fields, so strict endpoints don't
  false-fail) to prove the endpoint is reachable and CORS-capable. Consequence:
  only CORS-capable HTTPS endpoints can be connected, and **Verify may trigger
  downstream automations** — the options copy warns about this.
- **Raindrop bulk reports chunk-level partial results.** `doActionToTabs`
  returns `{succeeded, failed}` built from `Promise.allSettled` over the
  100-item chunks, mapping each settled chunk back to its own tabs.
  `UI.doBulkActionForTabs` then applies per-tab success/fail feedback and
  autoclose only to saved tabs and summarizes mixed outcomes
  ("X saved to Raindrop, Y failed"). Granularity is per-chunk, not per-item
  (the plural endpoint returns an aggregate); true idempotency/dedup is out of
  scope (Raindrop has no client-supplied dedup key).
- **Credential-gated services are managed only in "Connected services".** They
  get no checkbox in the generic Services list, so the sole enable path is a
  successful Verify. Their `service_<action>` flag defaults to `"disabled"`.
