# Pull Tabs!

Pull Tabs is a browser extension designed to perform actions on tabs either in bulk or on a per-tab basis. Currently available in the [Google Chrome Web Store](https://chrome.google.com/webstore/detail/pull-tabs/bimplhlpceccnolgbbedbiedkecophnn) and as a [Mozilla Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/pull-tabs/).

## Setup

After installation, click the pulltab icon to initate Pull Tabs. The first time running it will prompt you to check the Options page and authorize GetPocket use.

## Useage

After setup, clicking the pulltab icon will present bulk-action buttons and an advanced view allowing to set actions on a per-tab basis. Actions will only be performed on tabs that are checked allowing granular control over each tab. You can enable or disable the simple or advanced workflows in the options page or leave them both enabled.

### Simple Workflow
A bulk action to apply to all tabs in the current window.

For instance you can download* all the tabs or save them all to Pocket. Other tab actions include bookmarking, saving to Pocket, ignoring or closing.

### Advanced Workflow
This layout presents tab action options ( download, save to Pocket, bookmark, ignore, close, etc. ) for each tab individually. A checkbox allows you to select whether the tab will be acted on or ignored completely.

In this workflow, if you have ten open tabs, you could choose to download two of them, close two of them, save two to pocket and ignore the remaining four. Additionally there is an option to close tabs upon a successful action ( except a successful ignore, which will leave the tab as is ). In the previous examples if all actions succeeded you'd be left with four open tabs. If say the save to Pocket action failed, you'd have six tabs left open.

This advanced layout was the motivation for writing this extension as I'd often end up with a window filled with countless tabs and wanted to quickly act on all of them but also wanted to act differently on some of them.

##### Current features
- [x] Save all current tabs
- [x] Choose which tabs to save
- [x] Set file preferences by file group type [ 'application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown' ]
- [x] Save tabs by file group type [ 'application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown' ]
- [x] Save to Pocket
- [x] Google Chrome extension
- [x] Simple and advanced views
- [x] Mozilla Firefox extension

##### Planned features
- [ ] Save tabs by file type [ e.g. .html, .pdf, .png etc.]
- [ ] Post to Twitter integration
- [ ] Save to Dropbox
- [ ] Save to Google Drive
- [ ] Save to Instapaper