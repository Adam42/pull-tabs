"use strict";
export var watchOptionsLink = {
  init: function() {
    var optionsLink = document.getElementById("options-link");
    optionsLink.addEventListener("click", function(e) {
      e.preventDefault();
      browser.runtime.openOptionsPage();
    });
  }
};
