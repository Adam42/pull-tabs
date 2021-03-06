import ServiceProvider from "./ServiceProvider.js";
import { config } from "../config.js";

/**
 * Provides saving tabs to getpocket.com actions
 */
export default class PocketProvider extends ServiceProvider {
  constructor(tabs) {
    super(tabs);
  }

  doActionToTab(tab) {
    return this.saveTabToPocket(tab);
  }

  doActionToTabs() {
    console.log(this.tabs);
  }

  /**
     * Saves a tab's title & URL to getpocket.com
     * @param  {object} tab - A browser tab object
     * @return {Promise}     Returns a promise representing result of saving to pocket
     */
  saveTabToPocket(tab) {
    return new Promise(function(resolve, reject) {
      var pocketKey = {
        access_token: "access_token",
        user_name: "user_name"
      };

      var pocket_data = {
        url: tab.url,
        consumer_key: config.credentials.consumer_key,
        access_token: localStorage[pocketKey.access_token]
      };

      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType("application/json");
      xhr.open("POST", "https://getpocket.com/v3/add", true);
      xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      xhr.setRequestHeader("X-Accept", "application/json");

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status !== 200) {
          reject(Error("Could not save to Pocket"));
        } else if (xhr.readyState === 4 && xhr.status === 200) {
          resolve(xhr.response);
        }
      };

      xhr.onerror = function(e) {
        reject(Error("Could not save to Pocket" + xhr.statusText));
      };

      xhr.send(JSON.stringify(pocket_data));
    });
  }

  /**
     * Bulk save tabs to getpocket.com
     * @param  {array} tabs - Collection of browser tab objects
     * @return {[type]}      [description]
     */
  saveTabsToPocket(tabs) {
    this.forEachTabDo(tabs, this.saveTabToPocket.call(this));
  }
}
