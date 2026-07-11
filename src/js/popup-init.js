"use strict";
/* Setup extension popup*/
import { browserUtils } from "./browser.js";
import { popup } from "./popup.js";
import { watchOptionsLink } from "./watchOptionsLink.js";

document.addEventListener("DOMContentLoaded", async function () {
  watchOptionsLink.init();

  var popupEl = document.getElementById("popup");
  if (popupEl) {
    //Await storage migration + bookmark-folder discovery (Phase 7.1) before
    //rendering, so popup.init() reads from browser.storage.local reliably.
    await browserUtils.init();
    popup.init();
  }
});

/**
 * Log storage changes to console if dev flag is set.
 * @type {Boolean}
 */
const dev = false;
if (dev) {
  browser.storage.onChanged.addListener(function (changes, namespace) {
    // eslint-disable-next-line guard-for-in -- dev-only logging; Phase 2-4 cleanup
    for (var key in changes) {
      console.log(changes);
      if (changes.hasOwnProperty("key")) {
        var storageChange = changes[key];
        console.log(
          'Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
          key,
          namespace,
          storageChange.oldValue,
          storageChange.newValue,
        );
      }
    }
  });
}
