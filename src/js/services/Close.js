import ServiceProvider from "./ServiceProvider.js";

/**
 * Provides closing actions to tabs
 */
export default class CloseProvider extends ServiceProvider {
  doActionToTab(tab) {
    return this.closeTab(tab);
  }

  /**
     * Close an individual tab
     * @param  {object} tab A browser tab object
     * @return {Promise} - A Promise resolving to result of closing tabs
     */
  // eslint-disable-next-line class-methods-use-this -- Phase 2-4: services-layer polish
  closeTab(tab) {
    //Don't close the tab that the popup was invoked on
    //as it'll halt the extension
    //ideally we should move to event scripts
    //so the popup isn't dependent on a tab being open
    if (tab.active === true) {
      return Promise.reject(new Error("Refusing to autoclose the active tab!"));
    }

    return browser.tabs.remove(tab.id);
  }
}
