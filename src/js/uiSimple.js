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
    switch (action) {
      case "download":
        return this.downloadUrls(popup.tabs);
        //return browserUtils.downloadUrls(popup.tabs);
        break;

      case "pocket":
      case "bookmark":
      case "close":
        //retrieve the ServiceProvider corresponding to this action
        let service = ServiceFactory.convertActionToProvider(action);
        service = new service(popup.tabs);

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

  watchButtons: function() {
    var download = document.getElementById("download");
    download.addEventListener("click", uiSimple.doActionToAllTabs);

    var pocket = document.getElementById("pocket");
    pocket.addEventListener("click", uiSimple.doActionToAllTabs);

    var bookmark = document.getElementById("bookmark");
    bookmark.addEventListener("click", uiSimple.doActionToAllTabs);

    var close = document.getElementById("close");
    close.addEventListener("click", uiSimple.doActionToAllTabs);

    var ignore = document.getElementById("ignore");
    ignore.addEventListener("click", uiSimple.doActionToAllTabs);
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

  downloadUrls: function(tabs) {
    browserUtils.watchDownloads(uiSimple.handleChangedDownloads);

    var tabMap = { downloadItemToTabMap: {} };

    tabs.forEach(function(tab) {
      //Internal Firefox pages will halt all downloading
      //so we'll skip any URLs that start with "about:"
      if (tab.url.substring(0, 6) === "about:") {
        return;
      }

      return browserUtils
        .downloadUrl(tab)
        .then(e => {
          //create a mapping of downloadItem ID to tab object
          tab.downloadItemId = e;
          tab.actionReferrer = "simple";
          tabMap.downloadItemToTabMap["di-" + e] = tab;
          browser.storage.local.set(tabMap);
          //Display a message that the download has begun
          uiSimple.updateUI(tab, "Started downloading ", "info");
        })
        .catch(e => {
          uiSimple.updateUI(tab, "danger");
          console.log(e);
        });
      //      return this.downloadUrl(tab);

      //@to-do check preferences to see if user chose to auto-close tabs upon successful action},
      var autoClose = false;
      if (tab.active !== true && autoClose === true) {
        browser.tabs.remove(tab.id);
      }
    }, this);
  },

  /**
   * Trigger UI updates when downloads reach a final state
   * @param  {object} delta Changes to the downloadItem object
   */
  handleChangedDownloads: function(delta) {
    //retrieve the map of downloadItem IDs to tab objects
    browser.storage.local
      .get({
        downloadItemToTabMap: ""
      })
      .then(function(result) {
        let key = "di-" + delta.id;
        let map = result["downloadItemToTabMap"];
        //get the tab object corresponding to this downloadItem ID
        let tabPendingDownload = map[key];
        if (delta.state && delta.state.current === "complete") {
          uiSimple.updateUI(
            tabPendingDownload,
            "Completed downloading ",
            "success"
          );
        }

        if (delta.state && delta.state.current === "interrupted") {
          uiSimple.updateUI(
            tabPendingDownload,
            "Error: failed downloading ",
            "danger"
          );
        }
      });
  }
};
