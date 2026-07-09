import { sanitize } from "sanitize-filename-ts";
import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";

/**
 * Provides downloading actions to tabs
 */
export default class DownloadProvider extends ServiceProvider {
  /**
   * Download a single tab
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves once the download has been started and tracked
   * @throws {Error} If the tab is invalid or the download cannot be started
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const result = await this.downloadTab(tab);
      return result;
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Start downloading a single tab and record it for status tracking
   *
   * Note that the promise is resolved when a download is
   * started; the DownloadItem's state will change to either
   * "complete" when the download is successful or to "interrupted"
   * if something prevented the download from completing,
   * thus we must watch for changes to DownloadItem to check status.
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves once the download record is stored
   * @throws {Error} If the tab is an internal browser page
   */
  // eslint-disable-next-line class-methods-use-this -- worker calls browser.*/module helpers only, no instance state
  async downloadTab(tab) {
    //Internal Firefox pages will halt all downloading
    //so we'll skip any URLs that start with "about:"
    if (tab.url.substring(0, 6) === "about:") {
      throw new Error("cannot download internal browser pages");
    }

    const file = {
      url: tab.url,
    };

    //If the file doesn't have an filename ending save it as an HTML file
    if (!browserUtils.isFile(tab.url)) {
      file.filename = sanitize(tab.title.toString()) + ".html";
    }

    if (!browserUtils.isFirefox) {
      file.method = "GET";
    }

    const downloadId = await browser.downloads.download(file);
    const obj = { [`downloadTabItem-${downloadId}`]: tab };
    const result = await browser.storage.local.set(obj);

    return result;
  }

  /**
   * Setup a callback to apply when the download item's
   * status changes
   * @param  {Function} callback Function to call when status changes
   * @return {void}
   */
  registerCallback(callback) {
    this.watchDownloads(callback);
  }

  /**
   * Setup up a listener to watch for changes to DownloadItem
   * @param  {Function} callback Function to call when status changes
   * @return {void}
   */
  // eslint-disable-next-line class-methods-use-this -- worker calls browser.* only, no instance state
  watchDownloads(callback) {
    browser.downloads.onChanged.addListener(callback);
  }
}
