"use strict";
import { browserUtils } from "./browser.js";
import { options } from "./options.js";
import { messageManager } from "./message.js";
import { pocket } from "./pocket.js";
import { uiAdvanced } from "./uiAdvanced.js";

/**
 * Main functionality of pullTabs extension
 * exposed to user via a popup window
 * @constructor
 */
export var popup = popup || {
  tabs: "",

  layout: "",

  init: function() {
    //Force user to go to options page on initial load
    if (localStorage.initialSetup !== "no") {
      localStorage.initialSetup = "yes";
      popup.doInitialSetup();
      return;
    }
    //If we don't have any tabs yet then retrieve them
    if (!popup.tabs) {
      var msgID = messageManager.updateStatusMessage(
        "Gathering your tabs",
        "dependent",
        "info"
      );

      browserUtils
        .getTabs()
        .then(function(tabs) {
          popup.tabs = tabs;
          messageManager.removeStatusMessage(msgID);
          return tabs;
        })
        .then(function(tabs) {
          popup.setNumTabs(tabs);
        })
        .then(
          popup.getLayout().then(function(layout) {
            popup.setLayout(layout);
            popup.displayLayout(layout);
          })
        )
        .catch(function(e) {
          console.log(e);
        });

      return;
    }
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
        localStorage.initialSetup = "no";
        browser.runtime.openOptionsPage();
      });
    }
  },

  /**
     * Determine which layouts are enabled and perform initial setup for those layouts
     * @return {void} [description]
     */
  displayLayout: function(layout) {
    if (layout.simple) {
      popup.watchButtons();
    } else {
      var simple = document.getElementById("simple");
      simple.classList.add("hidden");
    }

    if (layout.advanced) {
      uiAdvanced.displayAdvancedLayout(this.tabs);
    }
  },

  /**
     * Retrieve the URLs represented in tabs collection
     * @param  {array} tabs Collection of tab objects
     * @return {array}      Collection of URLs from user's tabs
     */
  getUrls: function(tabs) {
    var urls = [];

    tabs.forEach(function(tab) {
      urls.push(tab.url);
    });

    return urls;
  },

  setTabs: function(tabs) {
    this.tabs = tabs;
  },

  setNumTabs: function(tabs) {
    var numTabs = document.getElementById("numTabs");
    numTabs.textContent =
      "This window has " + tabs.length + " tabs. Do this action to all tabs:";
  },

  setLayout: function(layout) {
    popup.layout = layout;
  },

  //returns a Promise
  getLayout: function() {
    var key = {
      simple: "true",
      advanced: "false"
    };
    var msgID = messageManager.updateStatusMessage(
      "Loading layout",
      "dependent",
      "info"
    );

    return browserUtils.retrieve(key).then(function(value) {
      messageManager.removeStatusMessage(msgID);
      return value;
    });
  },

  doError: function(error) {
    console.log("Error: ");
    console.log(error);
    return;
  },

  processGroup: function(evt) {
    evt.preventDefault();
    var destination = document.getElementById("default");
  },

  doAction: function(evt) {
    evt.preventDefault();
    popup.processButton(this.id);
  },

  processButton: function(action) {
    switch (action) {
      case "download":
        browserUtils.downloadUrls(popup.tabs);
        break;

      case "pocket":
        pocket.saveTabsToPocket(popup.tabs);
        break;

      case "bookmark":
        browserUtils.bookmarkTabs(popup.tabs);
        break;

      case "close":
        browserUtils.closeTabs(popup.tabs);
        break;

      default:
        break;
    }
  },

  watchButtons: function() {
    var download = document.getElementById("download");
    download.addEventListener("click", this.doAction);

    var pocket = document.getElementById("pocket");
    pocket.addEventListener("click", this.doAction);

    var bookmark = document.getElementById("bookmark");
    bookmark.addEventListener("click", this.doAction);

    var close = document.getElementById("close");
    close.addEventListener("click", this.doAction);

    var ignore = document.getElementById("ignore");
    ignore.addEventListener("click", this.doAction);
  },

  watchSubmit: function() {
    var group = document.getElementById("default");
    group.addEventListener("submit", this.processGroup);

    var checked = document.getElementById("list");
    checked.addEventListener("submit", uiAdvanced.process);
  }
};
