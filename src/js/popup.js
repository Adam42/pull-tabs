"use strict";
import { browserUtils } from "./browser.js";
import { messageManager } from "./message.js";
import UI from "./ui.js";
import { uiAdvanced } from "./uiAdvanced.js";
import { uiSimple } from "./uiSimple.js";

/**
 * Main functionality of pullTabs extension
 * exposed to user via a popup window
 * @constructor
 */
export var popup = popup || {
  tabs: "",

  /**
   * Get user's UI layout preferences and then
   * get tabs if advanced layout is active
   *
   * @return {[type]} [description]
   */
  init: function() {
    //Force user to go to options page on initial load
    if (localStorage.getItem("initialSetup") === null) {
      popup.doInitialSetup();
      localStorage.initialSetup = "done";
    }

    var msgID = messageManager.updateStatusMessage(
      "Loading layout",
      "dependent",
      "info"
    );

    UI.getLayout()
      .then(function(layout) {
        messageManager.removeStatusMessage(msgID);
        popup.displayLayout(layout);
      })
      .catch(function(e) {
        console.log(e);
      });
  },

  doInitialSetup: function() {
    if (document.getElementById("setup") === null) {
      var optionsLink = document.createElement("a");
      optionsLink.href = browserUtils.extensionGetURL("options.html");
      optionsLink.id = "initial-load";
      optionsLink.textContent = " Setup PullTabs with your preferences.";

      var setupMessage = document.createElement("p");
      setupMessage.classList.add("alert", "alert-info");
      setupMessage.textContent =
        "This appears to be your first time using PullTabs. Please visit the options page to define your preferences and setup any external services you wish to use.";
      setupMessage.id = "setup";
      setupMessage.appendChild(optionsLink);

      var parent = document.getElementById("simple").parentNode;
      var simple = document.getElementById("simple");

      parent.insertBefore(setupMessage, simple);

      setupMessage.addEventListener("click", function(e) {
        e.preventDefault();
        browser.runtime.openOptionsPage();
      });
    }
  },

  /**
     * Determine which layouts are enabled and perform initial setup for those layouts
     * @return {void} [description]
     */
  displayLayout: function(layout) {
    if (String(layout.simple) == "true") {
      uiSimple.displayButtons();
      uiSimple.watchButtons();
    } else {
      var simple = document.getElementById("simple");
      simple.classList.add("hidden");
    }

    browserUtils.getTabs().then(function(tabs) {
      popup.tabs = tabs;

      if (String(layout.advanced) == "true") {
        uiAdvanced.displayAdvancedLayout(tabs);
      }
      popup.setNumTabs(tabs);
    });
  },

  setTabs: function(tabs) {
    this.tabs = tabs;
  },

  /**
   * Set the number of tabs message
   * @param {array} tabs Collection of browser tab objects
   */
  setNumTabs: function(tabs) {
    var spinner = document.getElementById("loading-tabs-pacman");
    spinner.classList.add("hidden");
    var numTabs = document.getElementById("numTabs");
    numTabs.textContent = tabs.length + " tabs";
  }
};
