"use strict";
import { form } from "./form.js";
import { browserUtils } from "./browser.js";
import { PocketAPILayer } from "./pocket.js";
import ServiceProvider from "./services/ServiceProvider.js";
import ServiceFactory from "./services/ServiceFactory.js";

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

    // DownloadProvider goes through two states
    // the promise received from browser to start
    // the download and the result of downloading
    if (this.tabs.downloads.length > 0) {
      let tabs = this.tabs.downloads;
      let action = "download";
      let callback = uiAdvanced.handleChangedDownloads;

      //retrieve the ServiceProvider corresponding to this action
      let service = ServiceFactory.convertActionToProvider(action);
      service = new service(tabs);
      service.registerCallback(callback);

      //Loop through each tab and perform the ServiceProvider's action on it
      tabs.forEach(function(tab) {
        service.doActionToTab(tab).then(
          () => {
            form.setLabelStatus(tab, "list-group-item-info");
          },
          () => {
            uiAdvanced.updateUI(tab, "", "fail");
          }
        );
      });
    }

    if (this.tabs.pockets.length > 0) {
      let action = "pocket";

      this.doServiceAction(this.tabs.pockets, action);
    }

    if (this.tabs.closes.length > 0) {
      let action = "close";
      this.doServiceAction(this.tabs.closes, action);
    }

    if (this.tabs.bookmarks.length > 0) {
      let action = "bookmark";
      this.doServiceAction(this.tabs.bookmarks, action);
    }

    return;
  },

  /**
   * Creates a ServiceProvider and performs its associated
   * action on the collection of tabs
   *
   * @param  {array} tabs   Collection of browser tab objects
   * @param  {string} action The action to be performed
   * @return {void}
   */
  doServiceAction: function(tabs, action) {
    //retrieve the ServiceProvider corresponding to this action
    let service = ServiceFactory.convertActionToProvider(action);
    service = new service(tabs);
    //Loop through each tab and perform the ServiceProvider's action on it
    tabs.forEach(function(tab) {
      service.doActionToTab(tab).then(
        () => {
          uiAdvanced.updateUIWithSuccess(tab, action);
        },
        () => {
          uiAdvanced.updateUIWithFail(tab, action);
        }
      );
    });
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
  },

  /**
   * Trigger UI updates when downloads reach a final state
   * @param  {object} delta Changes to the downloadItem object
   */
  handleChangedDownloads: function(delta) {
    let name = "downloadTabItem-" + delta.id;

    browser.storage.local.get(name).then(function(result) {
      let tab = result[name];
      if (delta.state && delta.state.current === "complete") {
        form.removeLabelStatus(tab, "list-group-item-info");
        uiAdvanced.updateUI(tab, "Completed downloading ", "success");

        browser.storage.local.remove(name);
      }

      if (delta.state && delta.state.current === "interrupted") {
        form.removeLabelStatus(tab, "list-group-item-info");

        uiAdvanced.updateUI(tab, "Error: failed downloading ", "fail");

        browser.storage.local.remove(name);
      }
    });
  },

  /**
   * [updateUI description]
   * @param  {object} tab     Browser tab object
   * @param  {string} message - a message describing the action result
   * @param  {string} status  corresponds to UI context
   */
  updateUI: function(tab, message, status) {
    if (status === "fail") {
      uiAdvanced.updateAdvancedUI(tab, "failed");
      return;
    } else {
      uiAdvanced.updateAdvancedUI(tab, "successful");
    }
  },

  //Update the advanced UI after an action
  updateAdvancedUI: function(tab, message) {
    if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
      form.setLabelStatus(tab, message);
    }
  },

  /**
   * Update the UI with a successful message
   * the action passed in will be converted into passive
   * tense by added "ed" to the end of the string
   *
   * @param  {object} tab    A browser tab object
   * @param  {string} action Represents the ServiceProvider and its action
   * @return {[type]}        [description]
   */
  updateUIWithSuccess: function(tab, action) {
    let actioned = action + "ed";
    uiAdvanced.updateUI(tab, "Successfuly " + actioned + " ", "success");
  },

  /**
   * Update the UI with a failing message
   * the action passed in will be converted into current
   * tense by added "ing" to the end of the string
   *
   * @param  {object} tab    A browser tab object
   * @param  {string} action Represents the ServiceProvider and its action
   * @return {[type]}        [description]
   */
  updateUIWithFail: function(tab, action) {
    let actioning = action + "ing";
    uiAdvanced.updateUI(tab, "Failed " + actioning + " ", "fail");
  }
};
