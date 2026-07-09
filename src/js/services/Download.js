import { sanitize } from "sanitize-filename-ts";
import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";

/**
 * Provides downloading actions to tabs
 */
export default class DownloadProvider extends ServiceProvider {
  doActionToTab(tab) {
    return this.downloadTab(tab);
  }

  /**
   * Download a single Tab
   *
   * Note that the promise is resolved when a download is
   * started; the DownloadItem's state will change to either
   * "complete" when the download is successful or to "interrupted"
   * if something prevented the download from completing,
   * thus we must watch for changes to DownloadItem to check status.
   * @param  {object} tab A browser tab object
   * @return {Promise}     Promise representing whether download started
   */
  downloadTab(tab) {
    //Internal Firefox pages will halt all downloading
    //so we'll skip any URLs that start with "about:"
    if (tab.url.substring(0, 6) === "about:") {
      //throw new Error("Cannot download internal Firefox pages");
      return Promise.reject(new Error("fail"));
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
      const downloadItem = "downloadTabItem-" + e;
      const obj = {};

      obj[downloadItem] = tab;

      return browser.storage.local.set(obj);
    }, this);
  }

  /**
   * Setup a callback to apply when the download item's
   * status changes
   * @param  {Function} callback Function to call when status changes
   */
  registerCallback(callback) {
    this.watchDownloads(callback);
  }

  /**
   * Setup up a listener to watch for changes to DownloadItem
   * @param  {Function} callback Function to call when status changes
   */
  // eslint-disable-next-line class-methods-use-this -- Phase 2-4: services-layer polish
  watchDownloads(callback) {
    browser.downloads.onChanged.addListener(callback);
  }
}
