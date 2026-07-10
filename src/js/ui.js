import { messageManager } from "./message.js";
import storage from "./storage.js";
import { keys } from "./keys.js";
import ServiceFactory from "./services/ServiceFactory.js";
import { pastTense } from "./actionLabels.js";

export default class UI {
  constructor(state) {
    this.state = state || {
      message: "",
      status: "successful",
      duration: "short",
    };
  }

  //returns a Promise
  static getLayout() {
    return storage.retrieve(keys.preferences.layout);
  }

  static getAutoCloseStatus() {
    return storage.retrieve(keys.preferences.autoClose);
  }

  // eslint-disable-next-line class-methods-use-this -- stub overridden by layout views
  displayLayout() {}

  /**
   * Loop through each tab and perform the ServiceProvider's action on it,
   * have the UI react to each tab's result, then emit one summary message
   * @param  {object[]} tabs  Collection of browser tab objects
   * @param  {string} action  The action to apply via its ServiceProvider
   * @param  {object} view    A UI view (simple or advanced) implementing
   *                          updateUIWithSuccess/updateUIWithFail
   * @return {Promise} Resolves once every tab has settled and the summary posts
   * @throws {TypeError} If tabs, action, or view are invalid
   */
  static async doActionToTabForTabs(tabs, action, view) {
    if (!Array.isArray(tabs)) {
      throw new TypeError("tabs must be an array");
    }
    if (!action || typeof action !== "string") {
      throw new TypeError("action must be a non-empty string");
    }
    if (
      typeof view?.updateUIWithSuccess !== "function" ||
      typeof view?.updateUIWithFail !== "function"
    ) {
      throw new TypeError(
        "view must implement updateUIWithSuccess and updateUIWithFail",
      );
    }

    if (tabs.length === 0) {
      return;
    }

    const Service = ServiceFactory.convertActionToProvider(action);
    const service = new Service(tabs);

    const results = await Promise.allSettled(
      tabs.map(async (tab) => {
        try {
          await service.doActionToTab(tab);
          view.updateUIWithSuccess(tab, action);
          UI.autoCloseIfEnabled(tab);
        } catch (error) {
          view.updateUIWithFail(tab, action);
          throw error;
        }
      }),
    );

    const failed = results.filter(
      (result) => result.status === "rejected",
    ).length;
    const success = results.length - failed;

    const verb = pastTense(action);
    let summary = `${success} ${verb}`;
    if (failed > 0) {
      summary += `, ${failed} failed`;
    }

    messageManager.updateStatusMessage(
      summary,
      "medium",
      failed === 0 ? "success" : "warning",
    );
  }

  /**
   * Perform a bulk action whose provider returns `{succeeded, failed}` (a
   * chunked provider such as Raindrop), then apply per-tab feedback and
   * autoclose to the succeeded tabs only, mark the failed tabs, and emit one
   * mixed summary.
   *
   * Providers dispatched here MUST resolve `doActionToTabs()` to an object of
   * the shape `{succeeded: Tab[], failed: Tab[]}`. A thrown error (e.g. missing
   * credentials) is treated as every tab failing.
   *
   * @param  {object[]} tabs  Collection of browser tab objects
   * @param  {string} action  The action to apply via its ServiceProvider
   * @param  {object} view    A UI view implementing updateUIWithSuccess/Fail
   * @return {Promise} Resolves once every tab has settled and the summary posts
   * @throws {TypeError} If tabs, action, or view are invalid
   */
  static async doBulkActionForTabs(tabs, action, view) {
    if (!Array.isArray(tabs)) {
      throw new TypeError("tabs must be an array");
    }
    if (!action || typeof action !== "string") {
      throw new TypeError("action must be a non-empty string");
    }
    if (
      typeof view?.updateUIWithSuccess !== "function" ||
      typeof view?.updateUIWithFail !== "function"
    ) {
      throw new TypeError(
        "view must implement updateUIWithSuccess and updateUIWithFail",
      );
    }

    if (tabs.length === 0) {
      return;
    }

    const Service = ServiceFactory.convertActionToProvider(action);
    const service = new Service(tabs);

    let succeeded = [];
    let failed = [];
    try {
      const result = await service.doActionToTabs();
      succeeded = result.succeeded;
      failed = result.failed;
    } catch (error) {
      // A thrown error (e.g. missing credentials) fails every tab.
      failed = tabs;
    }

    succeeded.forEach((tab) => {
      view.updateUIWithSuccess(tab, action);
      UI.autoCloseIfEnabled(tab);
    });
    failed.forEach((tab) => {
      view.updateUIWithFail(tab, action);
    });

    const verb = pastTense(action);
    let summary = `${succeeded.length} ${verb}`;
    if (failed.length > 0) {
      summary += `, ${failed.length} failed`;
    }

    messageManager.updateStatusMessage(
      summary,
      "medium",
      failed.length === 0 ? "success" : "warning",
    );
  }

  /**
   * Check the user's preferences and autoclose
   * the tab after a successful result
   * @param  {object} tab Browser tab object
   */
  static autoCloseIfEnabled(tab) {
    browser.storage.local.get(keys.preferences.autoClose).then((preference) => {
      if (String(preference.autoCloseTabs) === "true") {
        const Close = ServiceFactory.convertActionToProvider("close");
        const close = new Close([tab]);
        close.doActionToTab(tab);
      }
    });
  }
}
