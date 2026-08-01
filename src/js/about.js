import { watchOptionsLink } from "./watchOptionsLink.js";

var aboutPullTabs = aboutPullTabs || {
  /**
   * Open credit links in a background tab instead of navigating the extension
   * page away. Delegated on the credits container so it covers links nested
   * inside the attribution grid.
   */
  init: function () {
    "use strict";
    var creditLinks = document.getElementById("about-credits");
    if (!creditLinks) {
      return;
    }

    creditLinks.addEventListener("click", function (e) {
      // Resolve the anchor even when the click lands on a child node; ignore
      // clicks that are not on a link at all.
      const anchor = e.target.closest("a");
      if (!anchor || !anchor.href) {
        return;
      }
      e.preventDefault();
      browser.tabs.create({ url: anchor.href, active: false });
    });
  },
};
document.addEventListener("DOMContentLoaded", function () {
  watchOptionsLink.init();
  aboutPullTabs.init();
});
