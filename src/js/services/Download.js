import { sanitize } from "sanitize-filename-ts";
import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";
import { DOWNLOAD_ITEM_PREFIX } from "../storageKeys.js";

/**
 * Best-effort fast-download-race reconciliation (Phase 7.2), isolated in its own
 * non-rethrowing try/catch.
 *
 * A download can reach a terminal state before onChanged observes the (now-
 * written) record. To recover, we nudge the BACKGROUND to reconcile: immediately
 * after the record write we dispatch a single `reconcile-download` message for
 * the id. The background — not this popup — runs the authoritative
 * `downloads.search` and no-ops for non-terminal items (see the reconcile-
 * download handler in background.js). The `sendMessage` is issued synchronously
 * here (before this function's first await), so the message reaches the runtime
 * before the popup can close; the search round trip that could be lost when the
 * popup is torn down now happens in the durable background context. That closes
 * the popup-close lost-nudge gap while keeping the deterministic post-store
 * trigger.
 *
 * downloadTab does NOT await the RESPONSE (it returns the store result first,
 * and this function does not await the sendMessage reply anyway). The popup
 * renders "Started downloading" in the .then() of doActionToTab; the background's
 * terminal "download-status" broadcast only comes back after the reconcile IPC
 * hop, the background search, and handleTerminal — several event-loop turns
 * later — so "Started" always renders first (a fast-completed download never
 * shows a stale "Started" after "Completed", nor re-adds the advanced in-
 * progress label). A sendMessage failure (e.g. no registered worker) is
 * swallowed so it can never surface as a failed download. The returned promise
 * is exposed on the provider instance so tests can await the dispatch
 * deterministically.
 *
 * @param  {number} downloadId The id returned by browser.downloads.download
 * @return {Promise<void>} Always resolves (never rejects)
 */
async function reconcileFastDownload(downloadId) {
  try {
    //Dispatch is synchronous (evaluated before this await), so the message is
    //handed to the runtime before the popup can be destroyed. We intentionally
    //do NOT await the background's handling of it beyond the send itself.
    await browser.runtime.sendMessage({
      type: "reconcile-download",
      id: downloadId,
    });
  } catch (error) {
    console.warn("download reconciliation skipped:", error && error.message);
  }
}

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
    const obj = { [`${DOWNLOAD_ITEM_PREFIX}${downloadId}`]: tab };
    const result = await browser.storage.local.set(obj);

    //Dispatch the background reconcile nudge but DO NOT await it — return the
    //store result immediately. The sendMessage inside reconcileFastDownload is
    //issued synchronously (before its first await), so the message reaches the
    //runtime before the popup can close and the authoritative downloads.search
    //runs in the durable background context (closing the popup-close lost-nudge
    //gap). Not awaiting keeps two guarantees:
    //  1. UI ordering: the popup renders "Started downloading" in the .then() of
    //     doActionToTab. Awaiting the background's handling would drive the
    //     terminal "download-status" broadcast ahead of that .then(), so a
    //     fast-completed download would show "Completed" then a stale "Started"
    //     line (and re-add the advanced in-progress label). Returning first
    //     keeps "Started" ahead of the broadcast (gated behind the reconcile IPC
    //     hop + background search + handleTerminal).
    //  2. A slow/stuck background never delays the "Started" feedback.
    //reconcileFastDownload never rejects; its promise is exposed on the instance
    //so tests can await the dispatch deterministically.
    this.reconciliation = reconcileFastDownload(downloadId);

    return result;
  }
}
