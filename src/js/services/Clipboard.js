import ServiceProvider from "./ServiceProvider.js";

/**
 * Provides copying to clipboard actions to tabs
 */
export default class ClipboardProvider extends ServiceProvider {
  /**
   * Copy a single tab's Title & URL to the clipboard
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves once the tab is copied
   * @throws {Error} If the tab is invalid or the copy fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const result = await this.copyAllTabsToClipboard([tab]);
      return result;
    } catch (error) {
      throw new Error(`Clipboard failed: ${error.message}`);
    }
  }

  /**
   * Copy every tab's Title & URL to the clipboard in one operation
   * @return {Promise} Resolves once every tab is copied
   * @throws {Error} If any tab is invalid or the copy fails
   */
  async doActionToTabs() {
    try {
      this.tabs.forEach((tab) => ServiceProvider.validateTab(tab));
      const result = await this.copyAllTabsToClipboard(this.tabs);
      return result;
    } catch (error) {
      throw new Error(`Clipboard failed: ${error.message}`);
    }
  }

  /**
   * Copies the Title & URL of every tab into the clipboard
   *
   * @param  {object[]} tabs Collection of tab objects
   * @return {void}
   * @throws {Error} If the copy command fails
   */
  copyAllTabsToClipboard(tabs) {
    const text = "";

    const reducer = (acc, currentTab) =>
      acc + String(currentTab.title) + ": " + String(currentTab.url) + "\n";

    const clipboardText = tabs.reduce(reducer, text);

    let tempElem = document.createElement("textarea");

    tempElem = this.hideClipboardElement(tempElem);

    tempElem.id = "temp-clipboard-text";
    tempElem.value = clipboardText;
    document.body.appendChild(tempElem);
    const copyText = document.getElementById("temp-clipboard-text");
    copyText.select();

    try {
      document.execCommand("Copy");
    } catch (err) {
      throw new Error("could not copy tabs to clipboard");
    }

    document.body.removeChild(tempElem);
  }

  /**
   * We need to create an element to store the text we create
   * by appending Titles & URLs. We need to hide this element from the user.
   *
   * @param  {object} element The hidden HTML element
   * @return {object}         Returns the HTML element with hidden styles applied
   */
  // eslint-disable-next-line class-methods-use-this -- pure DOM helper, no instance state
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
