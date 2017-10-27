/**
 * Base class for ServiceProviders to extend
 * When adding a new provider, extend this class and ensure it has a doActionToTab and doActionToTabs
 */
export default class ServiceProvider {
  constructor(tabs) {
    this.tabs = tabs;
  }

  /**
   * Perform an action on a single tab
   * @param  {object} tab Browser tab object
   */
  doActionToTab(tab) {
    console.log(tab);
  }

  /**
   * Perform an action on multiple tabs
   * @param  {array} tabs Collection of tab objects
   */
  doActionToTabs(tabs) {
    console.log(tabs);
  }
}
