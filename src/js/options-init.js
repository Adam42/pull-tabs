"use strict";
import { options } from "./options.js";

document.addEventListener("DOMContentLoaded", function () {
  // Embedded in about:addons / chrome://extensions (options_ui,
  // open_in_tab: false): show pure preferences — no Pull/About nav, no
  // running tab actions from inside the browser's settings UI.
  if (window.self !== window.top) {
    document.body.classList.add("embedded");
  }
  options.init();
});
