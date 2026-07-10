"use strict";
import { uiSimple } from "./uiSimple.js";
import { form } from "./form.js";

//Guard against registering more than one runtime.onMessage listener if init()
//is called again in the same popup context (e.g. displayLayout re-entered) —
//otherwise every download-status message would render duplicate lines/labels.
let initialized = false;

/**
 * Centralized subscriber for `download-status` broadcasts from the background
 * service worker (Phase 7.2).
 *
 * Registered once from popup.displayLayout regardless of which layouts are
 * enabled, so there is exactly one receiver and no duplicate rendering. It
 * always renders one text status line (guaranteeing feedback under any
 * layout) and additionally colors the advanced label when its element exists.
 */
export var downloadStatus = downloadStatus || {
  init: function() {
    //Idempotent: only the first call registers the listener.
    if (initialized) {
      return;
    }
    initialized = true;

    browser.runtime.onMessage.addListener(function(message) {
      if (!message || message.type !== "download-status") {
        return;
      }
      downloadStatus.handle(message);
    });
  },

  /**
   * Render a single download-status message.
   * @param {object} message { type, state, tab }
   */
  handle: function(message) {
    const tab = message.tab;
    if (!tab) {
      return;
    }
    const complete = message.state === "complete";

    //Always render one text status line via the shared renderer.
    if (complete) {
      uiSimple.updateUI(tab, "Completed downloading ", "success");
    } else {
      uiSimple.updateUI(tab, "Error: failed downloading ", "danger");
    }

    //Additionally update the advanced label, but only when its element is
    //present (advanced layout active for this tab).
    if (
      typeof tab.labelTabId !== "undefined" &&
      tab.labelTabId !== null &&
      document.getElementById("label-tab-" + tab.labelTabId)
    ) {
      form.removeLabelStatus(tab, "list-group-item-info");
      form.setLabelStatus(tab, complete ? "successful" : "failed");
    }
  }
};
