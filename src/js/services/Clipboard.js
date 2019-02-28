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
   * Copies the Title & URL of every tab into the clipboard
   *
   * @return {Promise} Rejects with Error or resolves if successful
   */
  copyAllTabsToClipboard(tabs) {
    let text = "";

    const reducer = (text, currentTab) =>
      text + String(currentTab.title) + ": " + String(currentTab.url) + "\n";

    let clipboardText = tabs.reduce(reducer, text);

    let tempElem = document.createElement("textarea");

    tempElem = this.hideClipboardElement(tempElem);

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

  /**
   * We need to create an element to store the text we create
   * by appending Titles & URLs. We need to hide this element from the user.
   *
   * @param  {object} element The hidden HTML element
   * @return {object}         Returns the HTML element with hidden styles applied
   */
  hideClipboardElement(element) {
    //Just setting display or visibility to none interferes with selecting the text to copy
    //https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    // Place in top-left corner of screen regardless of scroll position.
    element.style.position = "fixed";
    element.style.top = 0;
    element.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    element.style.width = "2em";
    element.style.height = "2em";

    // We don't need padding, reducing the size if it does flash render.
    element.style.padding = 0;

    // Clean up any borders.
    element.style.border = "none";
    element.style.outline = "none";
    element.style.boxShadow = "none";

    // Avoid flash of white box if rendered for any reason.
    element.style.background = "transparent";

    return element;
  }
}
