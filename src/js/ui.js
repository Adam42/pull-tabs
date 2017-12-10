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
