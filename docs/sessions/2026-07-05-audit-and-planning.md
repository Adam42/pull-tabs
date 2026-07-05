# Session log — 2026-07-05 — Audit, WIP landing, roadmap

Last session in `~/Dropbox/Sites/pull-tabs`; the repo moves to
`~/Herd/pull-tabs` immediately after this commit.

## What happened

1. **Reviewed the uncommitted `refactor/async-services` WIP** (Nov 2024 era):
   kept the service-layer async refactor, fixed the duplicated
   `doActionToTab` (mangled template string) in Bookmark.js, discarded
   `p.zip` build noise from mix-manifest.json, deleted four abandoned 2017
   prototype files (`pulltabs-app.js`, `service.js`, `service.html`,
   `todo.txt` — ideas absorbed into backlog.md).
2. **Full read-only audit** → produced/updated: README status section,
   CLAUDE.md (project constitution), docs/architecture.md,
   backlog.md (~30 items, no CRITICAL security findings; config.js secret
   verified never-committed). Headline: Pocket is dead (July 2025), five
   user-reachable bugs, broken-but-unused bulk-action layer, 48 dev-chain
   npm vulns vs. ~0 that ship.
3. **Reconciled an old services-layer code review** →
   docs/code-review-followups.md (⅓ done by the WIP, 6 items already in
   backlog, 9 new polish items, 3 declined with reasons).
4. **Wrote the 7-phase roadmap** → docs/plan.md, including the ~15-minute
   move-to-Herd procedure (verified relocatable: relative symlinks, no
   submodules).
5. **Researched Pocket replacements** → docs/read-later-services.md.
   First-class: Raindrop (test token; true bulk endpoint), Instapaper
   (Simple API, Basic Auth), Readwise Reader (token), generic webhook.
   Blocked: Mailist (no API). Dead: Omnivore. API-less: Matter.
   Dropbox: feasible via `save_url` + OAuth2 PKCE — only provider needing
   `identity` back; tier-decision deferred to Phase 5 start.
6. **Share-to-social design** → docs/share-providers.md. Compose-intent
   URLs (Bluesky/Threads/Reddit first) — no auth, no permissions; the
   original "draft a tweet per tab" idea (credit: Adam's partner),
   retargeted at living networks. Instagram infeasible.
7. **Decisions resolved** (recorded in backlog.md Questions):
   #1 remove Pocket entirely; #2 delete network-mime feature (successor:
   URL-type smart defaults, zero-permission lookup table); #3 prototypes
   deleted. #4 (build-tool swap) still open — blocks Phase 6 only.
8. **Parking lot**: owner's PullTabs server idea (OAuth secret custody,
   archive, digests) — backlog.md.

## Not yet done (all tracked)

- Phases 1–7 in [../plan.md](../plan.md); specs for 1–5 in
  [../specs/](../specs/) ready for /auto-dev.
- Everything in [../../backlog.md](../../backlog.md) and
  [../code-review-followups.md](../code-review-followups.md).
- Email contact@mailist.app about an API (watch item).
- Store-listing text updates accompany Phases 3 and 5 releases (manual,
  outside repo).

## Kickoff prompts

**Next session (post-move verification, then Phase 1):**

> We just moved this repo from ~/Dropbox/Sites/pull-tabs to
> ~/Herd/pull-tabs. Read CLAUDE.md, docs/plan.md, and
> docs/sessions/2026-07-05-audit-and-planning.md to load context. First
> verify the move per docs/plan.md Part 1: fresh `npm install`, `npm run
> dev`, validate both dist manifests parse, `git fsck`, delete the stale
> sublime-workspace file. Then start Phase 1 using
> docs/specs/phase-1-safety-net.md.

**Per-phase (auto-dev):**

> /auto-dev use docs/specs/phase-1-safety-net.md as the plan
> /auto-dev use docs/specs/phase-2-bug-patch.md as the plan
> /auto-dev use docs/specs/phase-3-amputations.md as the plan
> /auto-dev use docs/specs/phase-4-services-polish.md as the plan
> /auto-dev use docs/specs/phase-5-read-later-providers.md as the plan

Run them in order; each spec's "Prerequisites" section says what must be
true before it starts. Review + commit between phases (auto-dev ends with
staged, uncommitted changes).

## API access checklist (owner)

Nothing we're building is approval-gated. Do these when convenient:

| Service | What to do | Gated? |
|---|---|---|
| Raindrop | Create app in App Management Console → generate **test token** (for your own dev/testing) | No — instant |
| Instapaper | Just need an account; Simple API uses your username/password, no key | No — instant (the *Full* API needs an approval form; we don't use it) |
| Readwise Reader | Account required (**paid, ~30-day trial**) → token at readwise.io/access_token | No — instant, but start trial when Phase 5 is near so it doesn't lapse first |
| Dropbox (5f, optional) | Create app in Dropbox App Console (scope: `files.content.write`), note the app key | No for dev — instant; **production approval** only needed past ~500 linked users — apply at release time |
| Mailist | **Email contact@mailist.app asking about an API — do this one ASAP**, it's the only item with unknown latency | Blocked on their reply |
| Bluesky / Threads / Reddit intents | Nothing — no registration exists | No |
