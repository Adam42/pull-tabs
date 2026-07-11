"use strict";
import { browserUtils } from "./browser.js";
import storage from "./storage.js";
import { INITIAL_SETUP } from "./storageKeys.js";
import { downloadStatus } from "./downloadStatus.js";
import { popupView } from "./popupView.js";

/**
 * Popup entry point (0.21 "quiet paper" redesign).
 *
 * The old Simple/Advanced layout branching is gone: there is one merged view
 * rendered by popupView. This module just handles the first-run nudge, wires
 * the single download-status subscriber, and hands the current window's tabs to
 * popupView.
 * @constructor
 */
export var popup = popup || {
  tabs: [],

  init: function () {
    //First run: send the user to Options to set things up. State lives in
    //browser.storage.local (Phase 7.1); migration ran in browserUtils.init().
    storage.retrieve(INITIAL_SETUP).then(function (res) {
      if (typeof res[INITIAL_SETUP] === "undefined") {
        browser.runtime.openOptionsPage();
        storage.store({ [INITIAL_SETUP]: "done" });
      }
    });

    //Subscribe once to download-status broadcasts from the background worker
    //(Phase 7.2); popupView sets the actual onStatus callback when it renders.
    downloadStatus.init();

    browserUtils.getTabs().then(function (tabs) {
      popup.tabs = tabs;
      popupView.render(tabs);
    });
  },
};
