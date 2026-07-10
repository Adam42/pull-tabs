/* eslint-disable */
// Legacy per-tab advanced view; full lint cleanup deferred to a later phase.
"use strict";
import { form } from "./form.js";
import { keys } from "./keys.js";
import storage from "./storage.js";
import ServiceProvider from "./services/ServiceProvider.js";
import ServiceFactory from "./services/ServiceFactory.js";
import { messageManager } from "./message.js";
import UI from "./ui.js";
import { gerund, pastTense } from "./actionLabels.js";

/**
 * Displays the advanced bulk view where users can
 * activate or de-activate each tab and set actions on it
 * @type {[type]}
 */
export var uiAdvanced = uiAdvanced || {
  prefs: "",

  /**
   * Loop through each tab and create an advanced
   * form input view for it with each action
   * available as a form input
   *
   * @param  {array} tabs      Collection of browser tab objects
   * @param  {object} services Enabled/disabled state keyed per service
   */
  assembleForm: function(tabs, services) {
    tabs.forEach(function(tab) {
      uiAdvanced.displayDefaultAdvancedLayout(tab, services);
    });
  },

  /**
   * Display a default advanced view for a tab
   *
   * @param  {object} tab      A browser tab object
   * @param  {object} services Enabled/disabled state keyed per service
   */
  displayDefaultAdvancedLayout: function(tab, services) {
    var resources = document.getElementById("resources");
    var pref = "ignore";
    var checked = "";
    var active = "";

    var checkbox = form.createCheckbox(tab, checked);
    var label = form.createLabel(tab, active);
    label.appendChild(checkbox);

    let actions = ServiceFactory.getActions();

    actions.forEach(function(action) {
      let status = services["service_" + action];
      if (String(status) === "enabled") {
        let radioButton = form.createRadioInput(tab, action, pref);
        label.appendChild(radioButton);
        resources.appendChild(label);
      }
    });
  },

  /**
   * Display the advanced view for all tabs
   *
   * @param  {array} tabs Collection of browser tab objects
   * @return {Promise}    Resolves once the form is rendered and wired
   */
  displayAdvancedLayout: function(tabs) {
    this.tabs = tabs;
    var advanced = document.getElementById("advanced");
    advanced.classList.remove("hidden");

    return this.getOptions()
      .then(function(value) {
        uiAdvanced.setOptions(value);
        // A legacy disabled-service key from the removed read-later
        // integration may still linger in storage for existing users; it is
        // intentionally ignored (queries use the current defaults object as
        // keys, so a stale key is never read) and not migrated.
        return browser.storage.local.get(keys.preferences.services);
      })
      .then(function(services) {
        uiAdvanced.assembleForm(uiAdvanced.tabs, services);
        uiAdvanced.watchSubmit();

        var numFormTabs = document
          .getElementById("resources")
          .getElementsByClassName("list-group-item");

        uiAdvanced.watchCheckBoxes(numFormTabs);
        uiAdvanced.observeCheckboxes();
        uiAdvanced.setActions();
      });
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
    this.selectedTabs = form.getSelectedTabs(this.tabs);

    let actions = ServiceFactory.getActions();

    actions.forEach(function(action) {
      if (this.selectedTabs.selected[action].length > 0) {
        this.doServiceAction(this.selectedTabs.selected[action], action);
      }
    }, this);

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

    // DownloadProvider goes through two states
    // the promise received from browser to start
    // the download and the result of downloading
    if (String(action) === "download") {
      this.initDownload(service, tabs);

      //early return so we don't trigger the normal process
      return;
    }

    //Performing copy on each tab would result in just one tab
    //in the clipboard at the end of a set of actions
    if (String(action) === "clipboard") {
      service.doActionToTabs(tabs).then(
        () => {
          messageManager.updateStatusMessage(
            "Copied tabs to clipboard",
            "short",
            "success"
          );
        },
        () => {
          messageManager.updateStatusMessage(
            "Failed to copy tabs to clipboard",
            "medium",
            "danger"
          );
        }
      );

      return;
    }

    //Raindrop is a true bulk provider returning {succeeded, failed}
    if (String(action) === "raindrop") {
      UI.doBulkActionForTabs(tabs, action, uiAdvanced);

      return;
    }

    //For everything else we perform the action on each tab and perform default UI updates
    UI.doActionToTabForTabs(tabs, action, uiAdvanced);
  },

  initDownload: function(service, tabs) {
    let callback = uiAdvanced.handleChangedDownloads;
    service.registerCallback(callback);

    //Loop through each tab and start the download or mark it failed
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

    return storage.retrieve(key);
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
      .getElementById("advanced-ui")
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
      .getElementById("advanced-ui")
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
   * labels when a tab input field is clicked.
   *
   * Observes changes to the DOM within the specified form element,
   * and adds event listeners to dynamically added checkboxes.
   * When a checkbox's label is clicked, it toggles the active class
   * based on the checkbox's checked state.
   */
  observeCheckboxes: function() {
    const form = document.querySelector("#resources");

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          let node = document.querySelector(`#${mutation.addedNodes[0].id} > input`);

          if (node) {
            let label = document.querySelector(`#label-${node.id}`);

            if (label) {
              label.addEventListener("click", function() {
                if (label.classList.contains("active")) {
                  if (!node.checked) {
                    label.classList.remove("active");
                  }
                } else {
                  if (node.checked) {
                    label.classList.add("active");
                  }
                }
              });
            }
          }
        }
      });
    });

    const setup = { attributes: true, childList: true, characterData: true };
    observer.observe(form, setup);
  },

  /**
   * Perform the chosen action on each selected tab when form is submitted
   * @return {Listener} [description]
   */
  watchSubmit: function() {
    var checked = document.getElementById("advanced-ui");
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
        UI.autoCloseIfEnabled(tab);
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
    uiAdvanced.updateUI(tab, "Successfully " + pastTense(action) + " ", "success");
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
    uiAdvanced.updateUI(tab, "Failed " + gerund(action) + " ", "fail");
  }
};
