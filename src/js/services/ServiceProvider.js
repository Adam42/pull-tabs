/**
 * Base class for ServiceProviders
 * All providers must implement doActionToTab and doActionToTabs methods
 * @abstract
 */
export default class ServiceProvider {
  constructor(tabs) {
    if (!Array.isArray(tabs)) {
      throw new TypeError('tabs must be an array');
    }
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

  /**
   * Do an action for each tab in a collection of tabs
   * @param  {array} tabs   Collection of browser tab objects
   * @param  {function} action Function to call on each tab
   * @return Promise        Returns promise returned by action function
   */
  forEachTabDo(tabs, action) {
    var numTabs = tabs.length;
    var i;
    for (i = 0; i < numTabs; i++) {
      return action(tabs[i]);
    }
  }
}
