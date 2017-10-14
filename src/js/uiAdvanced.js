"use strict";
import { form } from "./form.js";
import { browserUtils } from "./browser.js";
import { pocket } from "./pocket.js";

/**
 * Displays the advanced bulk view where users can
 * activate or de-activate each tab and set actions on it
 * @type {[type]}
 */
export var uiAdvanced = uiAdvanced || {
  prefs: "",

  mimeTypesMap: {},

  getFullMimeType: function() {
    return browserUtils.retrieve(options.fullMimeType);
  },

  addMimeTypeToTabs: function() {
    return this.tabs.map(function(tab) {
      uiAdvanced
        .getContentType(tab.url)
        .then(function(mimeType) {
          var id = "tab" + tab.id.toString();
          uiAdvanced.setMimeTypesMap(id, mimeType);
        })
        .catch(function(e) {
          console.log(e);
        });
    });
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

  /**
   * Loop through each tab and create an advanced
   * form input view for it with each action
   * available as a form input
   *
   * @param  {array} tabs      [description]
   * @param  {object} prefs     [description]
   * @param  {object} mimeTypes [description]
   * @return {[type]}           [description]
   */
  assembleForm: function(tabs, prefs, mimeTypes) {
    tabs.forEach(function(tab) {
      if (mimeTypes.length > 0) {
        //            var mT = mimeTypes.filter(function(item) { return item.name === 'tab-2196'; });
      }

      uiAdvanced.displayDefaultAdvancedLayout(tab);

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

  /**
   * Display a default advanced view for a tab
   *  without checking nor acting on mimeType of the tab
   *
   * @param  {object} tab - A browser tab object
   * @return {[type]}     [description]
   */
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

  /**
   * Display the advanced view for all tabs and check
   * the mimeType and set actions based on its type
   *
   * @param  {array} tabs Collection of browser tab objects
   * @return {[type]}      [description]
   */
  displayAdvancedLayout: function(tabs) {
    this.tabs = tabs;
    var advanced = document.getElementById("advanced");
    advanced.classList.remove("hidden");
    this.getOptions()
      .then(function(value) {
        uiAdvanced.setOptions(value);
      })
      .then(
        uiAdvanced
          .getFullMimeType()
          .then(function(fullMimeType) {
            if (fullMimeType.retrieveFullMimeType) {
              Promise.all(uiAdvanced.addMimeTypeToTabs).then(function() {
                uiAdvanced.assembleForm(
                  uiAdvanced.tabs,
                  uiAdvanced.pref,
                  uiAdvanced.mimeTypesMap
                );
              });
            } else {
              uiAdvanced.assembleForm(
                uiAdvanced.tabs,
                uiAdvanced.pref,
                uiAdvanced.mimeTypesMap
              );
            }
          })
          .then(function() {
            uiAdvanced.watchSubmit();

            var numFormTabs = document
              .getElementById("resources")
              .getElementsByClassName("list-group-item");

            uiAdvanced.watchCheckBoxes(numFormTabs);
            uiAdvanced.observeCheckboxes();
            uiAdvanced.setActions();
          })
      );
  },

  /**
   * Perform actions on the selected tabs
   * @param  {event} evt Form submit event
   * @return {[type]}     [description]
   */
  doActionToSelectedTabs: function(evt) {
    evt.preventDefault();
    uiAdvanced.getTabStatus();
  },

  /**
   * Collect the selected form elements and determine
   * which action was chosen for each tab, then
   * perform that action on tabs grouped by their
   * chosen action
   *
   * @return {[type]} [description]
   */
  getTabStatus: function() {
    this.tabs = form.getSelectedTabs(this.tabs);

    if (this.tabs.downloads.length > 0) {
      browserUtils.downloadUrls(this.tabs.downloads);
    }

    if (this.tabs.pockets.length > 0) {
      pocket.saveTabsToPocket(this.tabs.pockets);
    }

    if (this.tabs.closes.length > 0) {
      browserUtils.closeTabs(this.tabs.closes);
    }

    if (this.tabs.bookmarks.length > 0) {
      browserUtils.bookmarkTabs(this.tabs.bookmarks);
    }

    return;
  },

  setMimeTypesMap: function(id, mimeType) {
    uiAdvanced.mimeTypesMap[id] = mimeType;
  },

  //returns a promise
  getOptions: function() {
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

    return browserUtils.retrieve(key);
  },

  setOptions: function(items) {
    uiAdvanced.prefs = items;
  },

  watchCheckBoxes: function(numFormTabs) {
    var i;
    for (i = 0; i < numFormTabs.length; i++) {
      form.toggleLabels(numFormTabs[i]);
    }
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
      uiAdvanced.setAllActive();
    });

    var uncheckAllButton = document.getElementById("uncheck-all-button");
    uncheckAllButton.addEventListener("click", function() {
      uiAdvanced.setAllInactive();
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

  /**
     * Watches checkboxes for clicks and highlights or unhighlights
     * labels when a tab input field is clicked
     *
     * @return {[type]} [description]
     */
  observeCheckboxes: function() {
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

  /**
   * Perform the chosen action on each selected tab when form is submitted
   * @return {Listener} [description]
   */
  watchSubmit: function() {
    var checked = document.getElementById("list");
    checked.addEventListener("submit", uiAdvanced.doActionToSelectedTabs);
  }
};
