# Pull Tabs

This browser extension gathers the current window's tabs and offers actions to take on them, either in bulk or on a per-tab basis. Possible actions include saving to Pocket, bookmarking, downloading, closing and ignoring.

There are two ways of interacting with tabs, a simple bulk method and a more advanced per-tab layout.

## Simple Workflow
A bulk action to apply to all tabs in the current window.

For instance you can download* all the tabs or save them all to Pocket. Other tab actions include bookmarking, saving to Pocket, ignoring or closing.

## Advanced Workflow
This layout presents tab action options ( download, save to Pocket, bookmark, ignore, close, etc. ) for each tab individually. A checkbox allows you to select whether the tab will be acted on or ignored completely.

In this workflow, if you have ten open tabs, you could choose to download two of them, close two of them, save two to pocket and ignore the remaining four. Additionally there is an option to close tabs upon a successful action ( except a successful ignore, which will leave the tab as is ). In the previous examples if all actions succeeded you'd be left with four open tabs. If say the save to Pocket action failed, you'd have six tabs left open.

This advanced layout was the motivation for writing this extension as I'd often end up with a window filled with countless tabs and wanted to quickly act on all of them but also wanted to act differently on some of them.

## End goal of this extension
Finally, my real end goal is to end up with an extension that can somewhat intelligently detect whether a tab is an article, image, PDF, or other media type and act on it according to preferences set for each type of media.

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