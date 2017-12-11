import { messageManager } from "./message.js";
import storage from "./storage.js";
import { keys } from "./keys.js";
import ServiceFactory from "./services/ServiceFactory.js";

export default class UI {
  constructor(state) {
    this.state = state || {
      message: "",
      status: "successful",
      duration: "short"
    };
  }

  //returns a Promise
  static getLayout() {
    return storage.retrieve(keys.preferences.layout);
  }

  static getAutoCloseStatus() {
    return storage.retrieve(keys.preferences.autoClose);
  }

  displayLayout() {}

  /**
   * Loop through each tab and perform the ServiceProvider's action on it
   * and have the UI react to the promise resolution for that tab
   * @param  {array} tabs    Collection of browser tab objects
   * @param  {class} service A Service Provider
   * @param  {class} view    A UI type, simple or advanced
   */
  static doActionToTabForTabs(tabs, service, view) {
    tabs.forEach(function(tab) {
      service.doActionToTab(tab).then(
        () => {
          view.updateUIWithSuccess(tab, action);
          UI.autoCloseIfEnabled(tab);
        },
        () => {
          view.updateUIWithFail(tab, action);
        }
      );
    });
  }

  /**
   * Check the user's preferences and autoclose
   * the tab after a successful result
   * @param  {object} tab Browser tab object
   */
  static autoCloseIfEnabled(tab) {
    browser.storage.local.get(keys.preferences.autoClose).then(preference => {
      if (String(preference.autoCloseTabs) === "true") {
        let close = ServiceFactory.convertActionToProvider("close");
        close = new close();
        close.doActionToTab(tab);
      }
    });
  }
}
