"use strict";
import { browser } from "./browser";
import { options } from "./options.js";
import { form } from "./form.js";
import { messageManager } from "./message.js";
import { pocket } from "./pocket.js";

/**
 * Main functionality of pullTabs extension
 * exposed to user via a popup window
 * @constructor
 */
export var popup = popup || {
  tabs: "",

  prefs: "",

  layout: "",

  mimeTypesMap: {},

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

      browser
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
            popup.displayLayout();
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
      //Browser is not instantiated at this point
      //optionsLink.href = Browser.extensionGetURL('options.html');
      optionsLink.href = chrome.extension.getURL("options.html");
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
        chrome.runtime.openOptionsPage();
      });
    }
  },

  /**
     * Determine which layouts are enabled and perform initial setup for those layouts
     * @return {void} [description]
     */
  displayLayout: function() {
    if (popup.layout.simple) {
      popup.watchButtons();
    } else {
      var simple = document.getElementById("simple");
      simple.classList.add("hidden");
    }

    if (popup.layout.advanced) {
      popup.displayAdvancedLayout();
    }
  },

  addMimeTypeToTabs: function() {
    return popup.tabs.map(function(tab) {
      //          var tabObj = popup.tabs.filter(function( tabObj ) {
      //            return tabObj.id == tab.id;
      //         })['0'];

      popup
        .getContentType(tab.url)
        .then(function(mimeType) {
          var id = "tab" + tab.id.toString();
          popup.setMimeTypesMap(id, mimeType);
          //                popup.mimeTypesMap[id] = mimeType;
          //                tabObj.mimeType = mimeType;
        })
        .catch(function(e) {
          console.log(e);
        });
    });
  },

  setMimeTypesMap: function(id, mimeType) {
    popup.mimeTypesMap[id] = mimeType;
  },

  displayAdvancedLayout: function() {
    var advanced = document.getElementById("advanced");
    advanced.classList.remove("hidden");
    this.getOptions()
      .then(function(value) {
        popup.setOptions(value);
      })
      .then(
        popup
          .getFullMimeType()
          .then(function(fullMimeType) {
            if (fullMimeType.retrieveFullMimeType) {
              Promise.all(popup.addMimeTypeToTabs).then(function() {
                popup.assembleForm(popup.tabs, popup.pref, popup.mimeTypesMap);
              });
            } else {
              popup.assembleForm(popup.tabs, popup.pref, popup.mimeTypesMap);
            }
          })
          .then(function() {
            popup.watchSubmit(popup.tabs);

            var numFormTabs = document
              .getElementById("resources")
              .getElementsByClassName("list-group-item");

            popup.watchCheckBoxes(numFormTabs);
            popup.watchMutateCheck();
            popup.setActions();
          })
      );
  },

  watchCheckBoxes: function(numFormTabs) {
    var i;
    for (i = 0; i < numFormTabs.length; i++) {
      form.toggleLabels(numFormTabs[i]);
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

  getFullMimeType: function() {
    return browser.retrieve(options.fullMimeType);
  },

  assembleForm: function(tabs, prefs, mimeTypes) {
    tabs.forEach(function(tab) {
      if (mimeTypes.length > 0) {
        //            var mT = mimeTypes.filter(function(item) { return item.name === 'tab-2196'; });
      }

      popup.displayDefaultAdvancedLayout(tab);

      /*
            if(fullMimeType){
                popup.getContentType().then(function ( value ) {
                    console.log(value);
                }).catch(function(e){
                    console.log(e);
                });
                //tab.url, function(response){
                 //   this.mType = response;
               // });
            }

/*            if(typeof(this.mType) !== 'undefined'){
                fullType = this.mType.split(";").shift();
                type = this.mType.split("/").shift().toLowerCase();
                pref = prefs[type] ? prefs[type] : 'ignore';

            }
            else{
  */
    });
  },

  displayDefaultAdvancedLayout: function(tab) {
    var resources = document.getElementById("resources");
    var fullType = "unknown";
    var pref = "ignore";
    var checked = "";
    var active = "";

    if (pref !== "ignore") {
      checked = "checked";
      active = "active";
    }

    var input = form.createCheckbox(tab, fullType, checked);
    var radioDown = form.createRadioInput(tab, "download", pref);
    var radioPocket = form.createRadioInput(tab, "pocket", pref);
    var radioBookmark = form.createRadioInput(tab, "bookmark", pref);
    var radioClose = form.createRadioInput(tab, "close", pref);
    var label = form.createLabel(tab, fullType, active);

    label.appendChild(input);
    label.appendChild(radioDown);
    label.appendChild(radioPocket);
    label.appendChild(radioBookmark);
    label.appendChild(radioClose);

    resources.appendChild(label);
  },

  getTabStatus: function() {
    this.tabs = form.getSelectedTabs(this.tabs);

    if (this.tabs.downloads.length > 0) {
      browser.downloadUrls(this.tabs.downloads);
    }

    if (this.tabs.pockets.length > 0) {
      pocket.saveTabsToPocket(this.tabs.pockets);
    }

    if (this.tabs.closes.length > 0) {
      browser.closeTabs(this.tabs.closes);
    }

    if (this.tabs.bookmarks.length > 0) {
      browser.bookmarkTabs(this.tabs.bookmarks);
    }

    return;
  },

  /**
     * Retrieve content type of a tab/URL
     * @param  {string} url - URL of a tab
     * @return {string}     the content type of the resource
     */
  getContentType: function(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        if (xhr.status === 200) {
          var contentType = xhr.getResponseHeader("Content-Type");

          //strip off everything but the first part of the Content-Type
          //unless it is null which is often due to internal tabs
          //like for instance a chrome-extension:// tab
          if (contentType !== null) {
            resolve(
              contentType
                .split(";")
                .shift()
                .split("/")
                .shift()
                .toLowerCase()
            );
          } else {
            resolve("unknown");
            //                            reject("Content-Type unavailable");
          }
        }
        reject(Error(xhr.statusText));
      };

      xhr.onerror = function() {
        reject(Error(xhr.statusText));
      };

      xhr.open("HEAD", url);
      xhr.send();
    });
  },

  /*  getExtension: function(url){
        return url.split('.').pop();
    },
*/

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

    return browser.retrieve(key).then(function(value) {
      messageManager.removeStatusMessage(msgID);
      return value;
    });
  },

  doError: function(error) {
    console.log("Error: ");
    console.log(error);
    return;
  },

  getOptions: function(callback) {
    var key = {
      application: "download",
      image: "download",
      message: "ignore",
      model: "ignore",
      multipart: "ignore",
      text: "download",
      video: "download",
      unknown: "ignore"
    };

    return browser.retrieve(key, callback);
  },

  setOptions: function(items) {
    popup.prefs = items;
  },

  /**
   * Sets up event listeners to watch for clicks
   * on check/uncheck all buttons
   *
   * @event click
   */
  setActions: function() {
    var checkAllButton = document.getElementById("check-all-button");
    checkAllButton.addEventListener("click", function() {
      popup.setAllActive();
    });

    var uncheckAllButton = document.getElementById("uncheck-all-button");
    uncheckAllButton.addEventListener("click", function() {
      popup.setAllInactive();
    });
  },

  /**
   * Update all checkboxes in the list form and their labels to be active
   *
   * @todo  Extract out the form element so any form can be used
   */
  setAllActive: function() {
    var labels = document.querySelectorAll("#resources > label");
    var numLabels = labels.length;
    var i;

    var checkBoxes = document
      .getElementById("list")
      .querySelectorAll("input[type=checkbox]");

    checkBoxes.forEach(function(checkBox) {
      checkBox.checked = true;
    });

    for (i = 0; i < numLabels; i++) {
      if (!labels[i].classList.contains("active")) {
        labels[i].classList.add("active");
      }
    }
  },

  /**
   * Update all checbox inputs in the list form and their labels to inactive
   *
   * @todo  Extract out the form element so any form can be used
   */
  setAllInactive: function() {
    var labels = document.querySelectorAll("#resources > label");
    var numLabels = labels.length;
    var i;

    var checkBoxes = document
      .getElementById("list")
      .querySelectorAll("input[type=checkbox]");

    checkBoxes.forEach(function(checkBox) {
      checkBox.checked = false;
    });

    for (i = 0; i < numLabels; i++) {
      if (labels[i].classList.contains("active")) {
        labels[i].classList.remove("active");
      }
    }
  },

  //Unused? Should it be used in setAllActive/Inactive above?
  updateBackground: function(node, label) {
    if (label.classList.contains("active")) {
      if (!node.checked) {
        label.classList.remove("active");
      }
    }
    if (!label.classList.contains("active")) {
      if (node.checked) {
        label.classList.add("active");
      }
    }
  },

  watchMutateCheck: function() {
    var form = document.querySelector("#resources");

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var node = document.querySelector(
          "#" + mutation.addedNodes[0].id + " > input"
        );
        var label = document.querySelector("#label-" + node.id);
        label.addEventListener("click", function() {
          if (label.classList.contains("active")) {
            if (!node.checked) {
              label.classList.remove("active");
            }
          }
          if (!label.classList.contains("active")) {
            if (node.checked) {
              label.classList.add("active");
            }
          }
        });
      });
    });

    var setup = { attributes: true, childList: true, characterData: true };
    observer.observe(form, setup);
  },

  process: function(evt) {
    evt.preventDefault();
    popup.getTabStatus();
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
        browser.downloadUrls(popup.tabs);
        break;

      case "pocket":
        pocket.saveTabsToPocket(popup.tabs);
        break;

      case "bookmark":
        browser.bookmarkTabs(popup.tabs);
        break;

      case "close":
        browser.closeTabs(popup.tabs);
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
    checked.addEventListener("submit", this.process);
  }
};
