# Pull Tabs

This browser extension gathers the current window's tabs and offers actions to take on them, either in bulk or on a per-tab basis. Possible actions include saving to Pocket, bookmarking, downloading, closing and ignoring.

There are two ways of interacting with tabs, a simple bulk method and a more advanced per-tab layout. For more info or to install the extension for normal use visit the [extension site](https://adam42.github.io/pull-tabs/).

## Contributor Setup

This extension uses the promise based [browser web extensions API](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API) with a polyfill for callback style browsers.

To load the extension locally for development, git clone this repo and then run:

```
npm install
```

Once npm finishes installing build an install that npm watches and re-compiles when changes are made with

```
npm run watch
```

in Mozilla Firefox you can also use [web-ext](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext) to have Firefox watch the extension files and reload Firefox when it changes. After creating a build run web-ext in the "dist" directory:

```
web-ext run
```

Make all changes in the src directory use npm to build the extension. Load the extension from the dist directory in your browser.

## End goal of this extension
The end goal is to end up with an extension that can somewhat intelligently detect whether a tab is an article, image, PDF, or other media type and act on it according to preferences set for each type of media.

However, detecting the type of media present in a tab is quite difficult in practice and ends up being more of an exercise in guesstimating based on mimeType, which may or may not truly reflect the type of media featured within a tab. In other words, viewing a singular image on imgur could be thought of as viewing an image but based on mimeType would be represented as text which is accurate but doesn't help us if our end goal is to save the image.

*Downloading may or may not go as you expect, the extension will download the entirety of the tab, so if the tab is an imgur/instagram/flickr/etc. page with an image embedded it will download an HTML file. However, if the tab is a direct link to an image it will download just the image.

### Current features
- [x] Save all current tabs
- [x] Choose which tabs to save
- [x] Set file preferences by file group type [ 'application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown' ]
- [x] Save tabs by file group type [ 'application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown' ]
- [x] Save to Pocket
- [x] Google Chrome extension
- [x] Simple and advanced views
- [x] Mozilla Firefox extension

### Planned features
- [ ] Save tabs by file type [ e.g. .html, .pdf, .png etc.]
- [ ] Post to Twitter integration
- [ ] Save to Dropbox
- [ ] Save to Google Drive
- [ ] Save to Instapaper

### Pending technical improvements
- [ ] Rewrite how services are loaded and associated with tab actions to make adding new API providers easier