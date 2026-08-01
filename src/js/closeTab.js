"use strict";
/**
 * Awaitable autoclose helper (0.21 "quiet paper" redesign).
 *
 * The receipt in popupView needs to know whether a tab was actually closed so
 * it can render "· tab closed" / dim the row only when true, and surface close
 * failures instead of leaking an unhandled rejection. This replaces the old
 * fire-and-forget `UI.autoCloseIfEnabled`.
 */
import { AUTO_CLOSE } from "./storageKeys.js";

/**
 * Close a tab after a successful action, but only when the user enabled
 * autoclose and the tab is not the active one (closing the active tab tears
 * down the popup). Awaits the removal so callers can gate UI on the outcome.
 *
 * @param  {object} tab A browser tab object
 * @return {Promise<boolean>} True iff the tab was actually removed
 */
export async function closeTabIfEnabled(tab) {
  const pref = await browser.storage.local.get(AUTO_CLOSE);
  if (String(pref.autoCloseTabs) !== "true") {
    return false;
  }
  // Never close the active tab — it would halt the extension popup.
  if (!tab || tab.active === true) {
    return false;
  }
  try {
    await browser.tabs.remove(tab.id);
    return true;
  } catch (error) {
    console.warn("autoclose failed:", error && error.message);
    return false;
  }
}
