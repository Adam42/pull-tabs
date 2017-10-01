"use strict";
import { watchOptionsLink } from "./watchOptionsLink.js";
import { browser } from "./browser.js";

var aboutPullTabs = aboutPullTabs || {
  init: function() {
    var creditLinks = document.getElementById("about-credits");
    var links = creditLinks.getElementsByTagName("a");
    var i;
    var len = links.length;

    for (i = 0; i < len; i++) {
      links[i].addEventListener("click", function(e) {
        var tabKey = {
          url: e.target.href,
          active: false
        };

        browser.createTab(tabKey);
      });
    }
  }
};
document.addEventListener("DOMContentLoaded", function() {
  watchOptionsLink.init();
  aboutPullTabs.init();
});
