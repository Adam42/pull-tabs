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
