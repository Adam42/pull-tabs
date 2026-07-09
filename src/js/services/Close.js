import ServiceProvider from "./ServiceProvider.js";

/**
 * Provides closing actions to tabs
 */
export default class CloseProvider extends ServiceProvider {
  /**
   * Close a single tab
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves once the tab is removed
   * @throws {Error} If the tab is invalid or closing fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const result = await this.closeTab(tab);
      return result;
    } catch (error) {
      throw new Error(`Close failed: ${error.message}`);
    }
  }

  /**
   * Remove an individual tab
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves with the result of removing the tab
   * @throws {Error} If the tab is the active tab
   */
  // eslint-disable-next-line class-methods-use-this -- worker calls browser.* only, no instance state
  closeTab(tab) {
    //Don't close the tab that the popup was invoked on
    //as it'll halt the extension
    //ideally we should move to event scripts
    //so the popup isn't dependent on a tab being open
    if (tab.active === true) {
      throw new Error("refusing to close the active tab");
    }

    return browser.tabs.remove(tab.id);
  }
}
