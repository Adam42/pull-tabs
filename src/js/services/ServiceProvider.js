/**
 * Base class for ServiceProviders
 * All providers must implement doActionToTab and doActionToTabs methods
 * @abstract
 */
export default class ServiceProvider {
  constructor(tabs) {
    if (!Array.isArray(tabs)) {
      throw new TypeError("tabs must be an array");
    }
    this.tabs = tabs;
  }

  /**
   * Perform an action on a single tab
   * @param  {object} tab Browser tab object
   */
  // eslint-disable-next-line class-methods-use-this, require-await -- abstract stub for child classes
  async doActionToTab(tab) {
    throw new Error("doActionToTab must be implemented by child class");
  }

  /**
   * Perform an action on multiple tabs
   * @param  {array} tabs Collection of tab objects
   */
  // eslint-disable-next-line class-methods-use-this, require-await -- abstract stub for child classes
  async doActionToTabs(tabs) {
    throw new Error("doActionToTabs must be implemented by child class");
  }
}
