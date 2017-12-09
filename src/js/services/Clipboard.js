import ServiceProvider from "./ServiceProvider.js";

/**
 * Provides copying to clipboard actions to tabs
 */
export default class ClipboardProvider extends ServiceProvider {
  constructor(tabs) {
    super(tabs);
  }

  doActionToTab(tab) {
    return this.copyTabToClipboard(tab);
  }

  doActionToTabs() {
    return this.copyAllTabsToClipboard(this.tabs);
  }

  /**
   * [copyAllTabsToClipboard description]
   * @return {[type]} [description]
   */
  copyAllTabsToClipboard() {
    let clipboardText = this.tabs.reduce(
      (text, currentTab) =>
        text + String(currentTab.title) + ": " + String(currentTab.url) + "\n"
    );

    let tempElem = document.createElement("textarea");

    //Just setting display or visibility to none interferes with selecting the text to copy
    //https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    // Place in top-left corner of screen regardless of scroll position.
    tempElem.style.position = "fixed";
    tempElem.style.top = 0;
    tempElem.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    tempElem.style.width = "2em";
    tempElem.style.height = "2em";

    // We don't need padding, reducing the size if it does flash render.
    tempElem.style.padding = 0;

    // Clean up any borders.
    tempElem.style.border = "none";
    tempElem.style.outline = "none";
    tempElem.style.boxShadow = "none";

    // Avoid flash of white box if rendered for any reason.
    tempElem.style.background = "transparent";

    tempElem.id = "temp-clipboard-text";
    tempElem.value = clipboardText;
    document.body.appendChild(tempElem);
    var copyText = document.getElementById("temp-clipboard-text");
    copyText.select();

    try {
      document.execCommand("Copy");
    } catch (err) {
      return Promise.reject(new Error("fail"));
    }

    document.body.removeChild(tempElem);

    return Promise.resolve();
  }
}
