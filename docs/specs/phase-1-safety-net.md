# Phase 1 — Safety net

Spec for /auto-dev. Read CLAUDE.md first (landmines: manifest fragments,
config.js, no minified releases, version in two places).

## Goal

Working test suite, working lint/format, zero shipped-dependency vulns,
CI on PRs. No behavior changes to the extension itself.

## Prerequisites

- Repo moved to ~/Herd/pull-tabs, `npm install` and `npm run dev` verified.
- Clean git status.

## Tasks

1. **Make Jest run.** `npx jest` currently fails with "Cannot use import
   statement outside a module". Fix the ESM transform: `.babelrc` is
   literally `{}` — configure `@babel/preset-env` (already in
   devDependencies) targeting current node for tests; replace the
   `jest.config.cjs` template (still contains `YOUR_MODULE_HERE`) with a
   real config (jsdom or node environment as the existing test needs;
   `src/tests/**/*.test.js` pattern). The existing suite
   `src/tests/services/ServiceFactory.test.js` must pass unmodified (it
   currently `jest.mock`s the providers module).
2. **Remove unused prod dependencies**: `del`, `es6-map`, `xmlhttprequest`
   from package.json. They are imported nowhere in `src/` or
   `webpack.mix.js` (verified in audit). Run `npm install` to update the
   lockfile; then `npm audit --omit=dev` must report 0 vulnerabilities.
3. **Add lint/format tooling that actually runs**: add `eslint` and
   `prettier` as devDependencies with `npm run lint` and `npm run format`
   scripts scoped to `src/js` and `src/tests`. `.eslintrc.json` exists —
   modernize minimally so it parses ES modules (es2021+, sourceType
   module, webextensions + browser + jest envs). Fix only lint errors that
   are trivial/mechanical; suppress-or-skip anything that would change
   behavior (behavior fixes belong to Phases 2–4).
4. **GitHub Actions CI**: `.github/workflows/ci.yml` — on push/PR:
   `npm ci`, `npm run lint`, `npm test`, `npm run dev`, then validate both
   built manifests: `python3 -c "import json;
   json.load(open('dist/browser/manifest.json'));
   json.load(open('dist/chrome/manifest.json'))"`.
   Note: the build requires `src/js/config.js` which is gitignored — CI
   must `cp src/js/config-sample.js src/js/config.js` before building
   (this step gets removed in Phase 3 when config.js dies).

## Constraints

- Do NOT touch extension behavior, providers, or manifests (beyond nothing).
- Do NOT bump the version (no release this phase).
- Keep prettier config consistent with existing style: 2-space indent,
  double quotes.

## Definition of done

- `npm test` green locally; `npm run lint` passes; `npm audit --omit=dev`
  → 0 vulns; CI workflow file present and coherent; `npm run dev` still
  builds both dists with valid manifests.
