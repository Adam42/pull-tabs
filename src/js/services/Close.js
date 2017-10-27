import ServiceProvider from "./ServiceProvider.js";

/**
 * Provides closing actions to tabs
 */
export default class CloseProvider extends ServiceProvider {
  constructor(tabs) {
    super(tabs);
  }

  doActionToTab(tab) {
    return this.closeTab(tab);
  }

  doActionToTabs() {
    return this.closeTabs(this.tabs);
  }

  /**
     * For each tab in a collection of tab object's
     * close that tab
     *
     * @param  {array} tabs Collection of tabs
     * @return {Promise} - A Promise resolving to result of closing tabs
     */
  closeTabs(tabs) {
    var numTabs = tabs.length;
    var i;
    for (i = 0; i < numTabs; i++) {
      return this.closeTab(tabs[i]);
    }
  }

  /**
     * Close an individual tab
     * @param  {object} tab A browser tab object
     * @return {Promise} - A Promise resolving to result of closing tabs
     */
  closeTab(tab) {
    return browser.tabs.remove(tab.id);
  }
}
