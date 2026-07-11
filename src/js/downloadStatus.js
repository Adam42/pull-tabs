"use strict";

//Guard against registering more than one runtime.onMessage listener if init()
//is called again in the same popup context — otherwise every download-status
//message would fire the callback multiple times.
let initialized = false;

/**
 * Centralized subscriber for `download-status` broadcasts from the background
 * service worker (Phase 7.2).
 *
 * View-agnostic (0.21 redesign): it no longer knows about any layout. A view
 * (popupView) sets `downloadStatus.onStatus = (tab, state, closed) => {...}`;
 * `handle()` forwards each broadcast to it. Registered once from popup init so
 * there is exactly one receiver and no duplicate delivery.
 */
export var downloadStatus = downloadStatus || {
  /**
   * Callback invoked with `(tab, state, closed)` for each download-status
   * broadcast. Set by the active view; null until then.
   * @type {?function(object, string, boolean): void}
   */
  onStatus: null,

  init: function () {
    //Idempotent: only the first call registers the listener.
    if (initialized) {
      return;
    }
    initialized = true;

    browser.runtime.onMessage.addListener(function (message) {
      if (!message || message.type !== "download-status") {
        return;
      }
      downloadStatus.handle(message);
    });
  },

  /**
   * Forward a single download-status broadcast to the registered view.
   * @param {object} message { type, state, tab, closed }
   */
  handle: function (message) {
    const tab = message.tab;
    if (!tab) {
      return;
    }
    if (typeof downloadStatus.onStatus === "function") {
      downloadStatus.onStatus(tab, message.state, message.closed === true);
    }
  },
};
