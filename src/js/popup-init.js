"use strict";
/* Setup extension popup*/
import { popup } from "./popup.js";
import { watchOptionsLink } from "./watchOptionsLink.js";

document.addEventListener("DOMContentLoaded", function() {
  watchOptionsLink.init();

  var popupEl = document.getElementById("popup");
  if (popupEl) {
    popup.init();
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (var key in changes) {
    if (changes.hasOwnProperty("key")) {
      var storageChange = changes[key];
      console.log(
        'Storage key "%s" in namespace "%s" changed. ' +
          'Old value was "%s", new value is "%s".',
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue
      );
    }
  }
});
