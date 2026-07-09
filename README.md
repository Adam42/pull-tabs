# Pull Tabs

This browser extension gathers the current window's tabs and offers actions to take on them, either in bulk or on a per-tab basis. Possible actions include downloading, bookmarking, copying to the clipboard, closing and ignoring.

There are two ways of interacting with tabs, a simple bulk method and a more advanced per-tab layout. For more info or to install the extension for normal use visit the [extension site](https://adam42.github.io/pull-tabs/).

## Current Status

The extension works for its core actions: download, bookmark, close, and copy-to-clipboard.

- **Pocket support was removed in 0.18.0.** Mozilla shut down the Pocket service in July 2025; the save/login integration and its `identity`/host permissions have been deleted.
- **Tests run via `npm test`** (Jest, green in CI).

See [docs/architecture.md](docs/architecture.md) for a map of the codebase and [backlog.md](backlog.md) for known issues and planned work.

## Contributor Setup

This extension uses the promise based [browser web extensions API](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API) with a polyfill for callback style browsers.

To load the extension locally for development, git clone this repo and then run:

```
npm install
```

Once npm finishes installing, build an install that npm watches and re-compiles when changes are made with

```
npm run watch
```

in Mozilla Firefox you can also use [web-ext](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext) to have Firefox watch the extension files and reload Firefox when it changes. After creating a build run web-ext in the "dist/browser" directory:

```
web-ext run
```

Mac users, temporarily use the below to workaround a bug in web-ext:
```
web-ext run -f=/Applications/Firefox.app/Contents/MacOS/firefox
```

Make all changes in the src directory use npm to build the extension. Load the extension from the dist directory in your browser.

Please use [prettier](https://prettier.io/) to format any Javascript files in the src directory before committing!

### Deployment

Mostly a note for myself, when releasing a new version simply run `npm run dev`. As browsers prefer un-minified files and minifying local files doesn't provide much performance gain it's best to not use `npm run production` when creating releases.