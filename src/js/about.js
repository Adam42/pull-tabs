import { watchOptionsLink } from "./watchOptionsLink.js";

var aboutPullTabs = aboutPullTabs || {
  /**
   * Open links on the about page in a new tab to keep focus within the extension
   */
  init: function() {
    "use strict";
    var creditLinks = document.getElementById("about-credits");
    var links = creditLinks.getElementsByTagName("a");
    var i;
    var len = links.length;

    for (i = 0; i < len; i++) {
      links[i].addEventListener("click", function(e) {
        let tab = {
          url: e.target.href,
          active: false
        };
        browser.tabs.create(tab);
      });
    }
  }
};
document.addEventListener("DOMContentLoaded", function() {
  watchOptionsLink.init();
  aboutPullTabs.init();
});
