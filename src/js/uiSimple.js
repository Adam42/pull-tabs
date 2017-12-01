"use strict";
import { browserUtils } from "./browser.js";
import { popup } from "./popup.js";
import { messageManager } from "./message.js";
import ServiceProvider from "./services/ServiceProvider.js";
import ServiceFactory from "./services/ServiceFactory.js";

/**
 * Displays the advanced bulk view where users can
 * activate or de-activate each tab and set actions on it
 * @type {[type]}
 */
export var uiSimple = uiSimple || {
  doActionToAllTabs: function(evt) {
    evt.preventDefault();
    let action = evt.target.id.toString();
    uiSimple.processButton(action);
  },

  processButton: function(action) {
    //retrieve the ServiceProvider corresponding to this action
    let service = ServiceFactory.convertActionToProvider(action);
    service = new service(popup.tabs);

    switch (action) {
      case "download":
        let callback = uiSimple.handleChangedDownloads;
        service.registerCallback(callback);

        //Loop through each tab and perform the ServiceProvider's action on it
        popup.tabs.forEach(function(tab) {
          service
            .doActionToTab(tab)
            .then(
              //Display a message that the download has begun
              uiSimple.updateUI(tab, "Started downloading ", "info")
            )
            .catch(e => {
              uiSimple.updateUI(tab, "Failed downloading ", "danger");
              console.log(e);
            });
        });

        break;

      case "pocket":
      case "bookmark":
      case "close":
        //Loop through each tab and perform the ServiceProvider's action on it
        popup.tabs.forEach(function(tab) {
          service.doActionToTab(tab).then(
            () => {
              uiSimple.updateUIWithSuccess(tab, action);
            },
            () => {
              uiSimple.updateUIWithFail(tab, action);
            }
          );
        });
        break;

      default:
        break;
    }
  },

  /**
   * Get the provider actions and create a button for each of them
   * @return {[type]} [description]
   */
  displayButtons: function() {
    let simpleForm = document.getElementById("simple-ui");

    let actions = ServiceFactory.getActions();

    actions.forEach(function(action) {
      let label = document.createElement("label");
      let button = document.createElement("button");
      let img = document.createElement("img");

      button.id = action;
      img.setAttribute("height", "16px");
      img.setAttribute("width", "16px");
      img.setAttribute("src", "img/" + action + ".svg");

      button.appendChild(img);
      button.insertAdjacentHTML(
        "beforeEnd",
        action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()
      );
      label.appendChild(button);
      simpleForm.appendChild(label);
    });
  },

  /**
   * Watch for clicks on buttons in the default form
   * and pass the event for further processing
   */
  watchButtons: function() {
    let buttons = document.getElementById("simple-ui");

    buttons.addEventListener("click", function(event) {
      uiSimple.doActionToAllTabs(event);
    });
  },

  /**
   * [updateUI description]
   * @param  {object} tab     Browser tab object
   * @param  {string} message - a message describing the action result
   * @param  {string} status  corresponds to UI context
   */
  updateUI: function(tab, messageText, status) {
    var span = document.createElement("span");
    var link = document.createElement("a");
    var message = document.createTextNode(messageText);
    link.title = tab.title.toString();
    link.href = tab.url;
    link.textContent = tab.title.toString();

    span.appendChild(message);
    span.appendChild(link);

    var duration = "short";
    if (status === "danger") {
      duration = "long";
    }

    messageManager.updateStatusMessage(span, duration, status);
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
    uiSimple.updateUI(tab, "Successfuly " + actioned + " ", "success");
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
    uiSimple.updateUI(tab, "Failed " + actioning + " ", "danger");
  },

  /**
   * Trigger UI updates when downloads reach a final state
   * @param  {object} delta Changes to the downloadItem object
   */
  handleChangedDownloads: function(delta) {
    var name = "downloadTabItem-" + delta.id;

    browser.storage.local.get(name).then(function(result) {
      let tab = result[name];

      if (delta.state && delta.state.current === "complete") {
        uiSimple.updateUI(tab, "Completed downloading ", "success");

        browser.storage.local.remove(name);
        //      //@to-do check preferences to see if user chose to auto-close tabs upon successful action},
        //      var autoClose = false;
        //      if (tab.active !== true && autoClose === true) {
        //        browser.tabs.remove(tab.id);
        //      }
      }

      if (delta.state && delta.state.current === "interrupted") {
        uiSimple.updateUI(tab, "Error: failed downloading ", "danger");

        browser.storage.local.remove(name);
      }
    });
  }
};
