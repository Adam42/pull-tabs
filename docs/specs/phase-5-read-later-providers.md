# Phase 5 — Read-later providers (release v0.19.0)

Spec for /auto-dev. Read CLAUDE.md and **docs/read-later-services.md**
(the design doc — API details, auth decisions, and candidate screen live
there; this spec is the build order). Sub-phases 5a–5d are this spec.
NOT in scope: Dropbox (5f — separate decision, needs `identity` + PKCE),
share-to-social (5e — docs/share-providers.md), Pinboard/self-hosted tier
(demand-driven).

## Prerequisites

- Phase 3 (Pocket gone) and Phase 4 (async provider pattern, validateTab,
  standardized errors) complete.
- Owner has test credentials: Raindrop test token, Instapaper account,
  Readwise token (see session log API checklist).

## 5a — Credentials foundation

- New `src/js/services/credentials.js`: get/set/clear per-service
  credentials in **`browser.storage.local`** (never page localStorage),
  under keys like `credentials_raindrop`, `credentials_instapaper`,
  `credentials_readwise`, `credentials_webhook`.
- `verify(service)` helpers: Raindrop `GET
  https://api.raindrop.io/rest/v1/user` (Bearer token); Instapaper `POST
  https://www.instapaper.com/api/authenticate` (Basic Auth, 200 = valid);
  Readwise `GET https://readwise.io/api/v2/auth/` (`Authorization: Token
  X`, 204 = valid); webhook = well-formed HTTPS URL check only.
- Options page "Connected services" section: per service — credential
  input(s), Verify button with success/fail status via messageManager,
  and a link to where the user gets the token (Raindrop app console,
  readwise.io/access_token). Service action stays disabled (existing
  `service_*` enabled-flags mechanism in keys.js) until verified;
  verifying enables it.
- Never log credentials; error messages carry status codes only.
- UI copy: "stored locally on this device only".

## 5b — Raindrop

- `src/js/services/Raindrop.js`: `doActionToTab` → `POST
  https://api.raindrop.io/rest/v1/raindrop` `{link, title, pleaseParse:{}}`,
  Bearer token; `doActionToTabs` → `POST /rest/v1/raindrops` with `items`
  chunked at 100 — the first true bulk provider besides Clipboard; the
  simple layout's button should use it.
- Error mapping: 401 → "Check your Raindrop token in Options";
  429 → "Raindrop rate limit — try again shortly".
- Registry entry in providers.js (action name `raindrop`).

## 5c — Instapaper

- `src/js/services/Instapaper.js`: `doActionToTab` → `POST
  https://www.instapaper.com/api/add` with form params `url` + `title`,
  HTTP Basic Auth (password may be empty — many accounts have none).
  201 = saved; 403 → "Check your Instapaper credentials in Options".
  No bulk endpoint: sequential per-tab with a ~250ms gap (no published
  rate limit; be polite).

## 5c′ — Readwise Reader

- `src/js/services/Readwise.js`: `doActionToTab` → `POST
  https://readwise.io/api/v3/save/` JSON `{url, title}`,
  `Authorization: Token X`. 50 req/min is ample; 401 → options hint.

## 5c″ — Generic webhook

- `src/js/services/Webhook.js`: `doActionToTab` → `POST <user URL>` JSON
  `{url, title}`. Options field takes any HTTPS URL. Relies on the
  target's CORS (document this in the options help text); non-2xx → fail
  message with status code. Generic "send" icon.

## Icons & manifest

- Icons: `simple-icons@1.6.4` (2017) may lack these marks — vendor SVGs
  directly into `src/img/` (raindrop.svg, instapaper.svg, readwise.svg or
  a generic book icon, webhook.svg generic send) rather than upgrading
  the dependency. Keep them monochrome to match existing action icons.
- `src/manifest-base.json` host_permissions: `https://api.raindrop.io/*`,
  `https://www.instapaper.com/*`, `https://readwise.io/*`. Fragments are
  concatenated — verify both dist manifests parse. (Webhook host is
  user-defined — no permission possible; CORS note above.)

## Tests

Mock `fetch` + `browser.storage.local`: payload shapes, auth headers
(Basic construction, Token/Bearer), Raindrop bulk chunking at 100, error
mapping per provider, credentials round-trip + verify paths, disabled-
until-verified gating.

## Release steps

Version **0.19.0** both files; `npm run dev`; README + store-listing copy
("save tabs to Raindrop, Instapaper, or Readwise Reader"); note for owner:
manual smoke test each service with real credentials, then AMO/CWS
submission — permission additions will prompt Chrome users to re-approve.

## Definition of done

All four providers save from both layouts with verified credentials and
are hidden/disabled until then; suite + lint green; manifests valid;
docs/read-later-services.md updated with any implementation deviations.
