/**
 * Base class for ServiceProviders
 * All providers must implement doActionToTab and doActionToTabs methods
 * @abstract
 */
export default class ServiceProvider {
  /**
   * @param  {object[]} tabs Collection of browser tab objects
   * @throws {TypeError} If instantiated directly or tabs is not an array
   */
  constructor(tabs) {
    if (new.target === ServiceProvider) {
      throw new TypeError(
        "ServiceProvider is abstract and cannot be instantiated directly",
      );
    }
    if (!Array.isArray(tabs)) {
      throw new TypeError("tabs must be an array");
    }
    this.tabs = tabs;
  }

  /**
   * Validate that a tab has the fields providers rely on
   * @param  {object} tab Browser tab object
   * @throws {TypeError} If the tab is missing a url or title
   */
  static validateTab(tab) {
    if (!tab || !tab.url || !tab.title) {
      throw new TypeError("Tab is missing a url or title");
    }
  }

  /**
   * Perform an action on a single tab
   * @param  {object} tab Browser tab object
   * @throws {Error} Always; child classes must override this method
   */
  // eslint-disable-next-line class-methods-use-this, require-await -- abstract stub for child classes
  async doActionToTab(tab) {
    throw new Error("doActionToTab must be implemented by child class");
  }

  /**
   * Perform an action on multiple tabs
   * @param  {object[]} tabs Collection of tab objects
   * @throws {Error} Always; child classes must override this method
   */
  // eslint-disable-next-line class-methods-use-this, require-await -- abstract stub for child classes
  async doActionToTabs(tabs) {
    throw new Error("doActionToTabs must be implemented by child class");
  }
}
