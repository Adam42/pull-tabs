var sanitize = require("sanitize-filename");
import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";

/**
 * Provides downloading actions to tabs
 */
export default class DownloadProvider extends ServiceProvider {
  constructor(tabs) {
    super(tabs);
  }

  doActionToTab(tab) {
    return this.downloadTab(tab);
  }

  doActionToTabs() {
    return this.downloadTabs(this.tabs);
  }

  /**
     * Download a resource represented via a tab's URL
     * to local disk either as an HTML file or with
     * the URL's extension if it has one
     *
     * Note that the promise is resolved when a download is
     * started, DownloadItem's state will change to either
     * "complete" when the download is successful or to "interrupted"
     * if something prevented the download from completing
     * thus we must watch for changes to DownloadItem
     * to check status
     *
     * @param  {array} tabs Collection of tab objects
     * @return {[type]}      [description]
     */
  downloadTabs(tabs) {

    tabs.forEach(function(tab) {
      return this.downloadTab(tab)
        .then(e => {})
        .catch(e => {
          this.updateUI(tab, "fail");
        });

      //@to-do check preferences to see if user chose to auto-close tabs upon successful action},
      var autoClose = false;
      if (tab.active !== true && autoClose === true) {
        browser.tabs.remove(tab.id);
      }
    }, this);
  }

  /**
   * Download a single Tab
   * @param  {object} tab A browser tab object
   * @return {Promise}     Promise representing whether download started
   */
  downloadTab(tab) {
    //Internal Firefox pages will halt all downloading
    //so we'll skip any URLs that start with "about:"
    if (tab.url.substring(0, 6) === "about:") {
      //throw new Error("Cannot download internal Firefox pages");
      return;
    }

    var file = {
      url: tab.url
    };

    //If the file doesn't have an filename ending save it as an HTML file
    if (!browserUtils.isFile(tab.url)) {
      file.filename = sanitize(tab.title.toString()) + ".html";
    }

    if (!browserUtils.isFirefox) {
      file.method = "GET";
    }

    return browser.downloads.download(file).then(e => {
      let downloadItem = "downloadTabItem-" + e;
      let obj = {};

      obj[downloadItem] = tab;

     return browser.storage.local.set(obj);
    }, this);
  }

  /**
   * Setup a callback to apply when the download item's
   * status changes
   * @param  {Function} callback Function to call when status changes
   * @return {[type]}            [description]
   */
  registerCallback(callback) {
    this.watchDownloads(callback);
  }

  /**
   * Setup up a listener to watch for changes to DownloadItem
   * @return {[type]} [description]
   */
  watchDownloads(callback) {
    browser.downloads.onChanged.addListener(callback);
  }
}
