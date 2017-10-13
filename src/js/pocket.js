"use strict";
import { messageManager } from "./message.js";
import { config } from "./config.js";
import { browserUtils } from "./browser.js";
import { form } from "./form.js";

/**
 * Integration with getpocket.com allowing
 * users to save tabs to their Pocket account
 * @type {[type]}
 */
export var pocket = pocket || {
  pocketKey: {
    access_token: "access_token",
    user_name: "user_name"
  },

  init: function() {
    if (
      typeof localStorage[this.pocketKey.user_name] !== "undefined" &&
      localStorage[this.pocketKey.user_name] !== "user_name"
    ) {
      this.isAuthorized();
      return;
    }

    this.isNotAuthorized();
    return;
  },

  /**
     * Check for user credentials saved in local storage
     * then update login status element based on results
     * @return {void} [description]
     */
  checkLocalLoginStatus: function() {
    if (
      typeof localStorage[this.pocketKey.user_name] !== "undefined" &&
      localStorage[this.pocketKey.user_name] !== "user_name"
    ) {
      this.isAuthorized();
      return;
    }

    this.isNotAuthorized();
    return;
  },

  /**
     * Update login status element to a logout link if the element exists
     */
  isAuthorized: function() {
    var status = document.getElementById("pocket-status");
    if (status !== null) {
      status.href = "#pocket-logout";
      status.textContent =
        "You are signed in as " +
        decodeURIComponent(localStorage[this.pocketKey.user_name]) +
        " Click to log out.";
    }
  },

  /**
     * Update login status element to a login link
     */
  isNotAuthorized: function() {
    var status = document.getElementById("pocket-status");
    status.href = "#pocket-login";
    status.textContent = "You are not authorized, please sign in.";
  },

  /**
     * Set user credentials to default values in local storage
     * @return {Promise} Promise represents result of storage action
     */
  logOut: function() {
    localStorage[this.pocketKey.user_name] = "user_name";
    localStorage[this.pocketKey.access_token] = "access_token";

    chrome.storage.local.set(
      {
        access_token: "access_token",
        user_name: "user_name"
      },
      function(items) {
        return;
      }
    );

    this.isNotAuthorized();
  },

  /**
     * Determine action to take when pocket status link is clicked
     * if user is logged in will log out the user
     * otherwise will attempt to authorize the user to getpocket.com
     * @param {event} - Click event on pocket status link
     * @listens event
     * @return {void|New Window}       Either returns nothing or opens a new window
     */
  checkLink: function(event) {
    var hash = event.target.href.indexOf("#") + 1;
    var action = event.target.href.substring(hash);

    if (action === "pocket-logout") {
      pocket.logOut();
      return;
    }

    pocket.initLogin();
  },

  /**
     * Kick off process to authorize a user to getpocket.com
     * by obtaining a request token using our consumer key
     *
     * @return {[type]} [description]
     */
  initLogin: function() {
    var pocketRequest = {};
    pocketRequest.url = "https://getpocket.com/v3/oauth/request";
    pocketRequest.key = config.credentials.consumer_key;
    pocket.getRequestToken(pocketRequest);
  },

  /**
     * Saves a tab's title & URL to getpocket.com
     * @param  {object} tab - A browser tab object
     * @return {boolean}     true if successful, false if not
     */
  saveTabToPocket: function(tab) {
    var url = tab.url;

    var pocket_data = {
      url: url,
      consumer_key: config.credentials.consumer_key,
      access_token: localStorage[this.pocketKey.access_token]
    };

    try {
      var xhr = new XMLHttpRequest();
      xhr.overrideMimeType("application/json");
      xhr.open("POST", "https://getpocket.com/v3/add", false);
      xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      xhr.setRequestHeader("X-Accept", "application/json");

      var link = document.createElement("a");
      var status = document.createElement("span");
      var message;

      link.title = tab.title.toString();
      link.href = tab.url;
      link.textContent = tab.title.toString();

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status !== 200) {
          if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
            form.setLabelStatus(tab, "failed");
          }
          message = document.createTextNode("Failed saving to Pocket ");
          status.appendChild(message);
          status.appendChild(link);
          messageManager.updateStatusMessage(status, "long", "danger");

          return false;
        } else if (xhr.readyState === 4 && xhr.status === 200) {
          if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
            form.setLabelStatus(tab, "successful");
          }

          message = document.createTextNode("Saved this tab to pocket: ");
          status.appendChild(message);
          status.appendChild(link);
          messageManager.updateStatusMessage(status, "medium", "success");

          //if we remove the tab that the popup was invoked on the popup
          //goes away, ideally we should move to event scripts
          //so the popup isn't dependent on a tab being open
          var autoClose;
          if (autoClose) {
            chrome.tabs.query(
              { active: true, lastFocusedWindow: true },
              function(tabs) {
                if (tab.id !== tabs[0].id) {
                  browser.tabs.remove(tab.id);
                }
              }
            );
          }

          return true;
        }
      };

      xhr.onerror = function(e) {
        form.setLabelStatus(tab, "failed");

        console.error("saveTabToPocket error: " + xhr.statusText);
        return;
      };

      xhr.send(JSON.stringify(pocket_data));
    } catch (e) {
      console.log("saveTabToPocket Exception: ");
      console.log(e);
      form.setLabelStatus(tab, "failed");
      return false;
    }
  },

  /**
     * Bulk save tabs to getpocket.com
     * @param  {array} tabs - Collection of browser tab objects
     * @return {[type]}      [description]
     */
  saveTabsToPocket: function(tabs) {
    var numURLs = tabs.length;
    var i;

    for (i = 0; i < numURLs; i++) {
      this.saveTabToPocket(tabs[i]);
    }
  },

  /**
     * Use the request token to initiate a login request to getpocket.com
     *
     * @todo  Rename this function to better represent what it actually does
     *
     * @param  {object} pocketRequest An object with key and token
     * @return {[type]}        [description]
     */
  getRequestToken: function(pocketRequest) {
    var redirectURL = chrome.extension.getURL("pocket.html");

    var data = new FormData();
    data.append("consumer_key", pocketRequest.key);
    data.append("redirect_uri", encodeURIComponent(redirectURL));

    var xhr = new XMLHttpRequest();

    xhr.open("POST", pocketRequest.url, true);

    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          pocketRequest.token = xhr.response.substring(5);
          localStorage[pocket.pocketKey.request_token] = pocketRequest.token;

          pocketRequest.auth =
            "https://getpocket.com/auth/authorize?request_token=" +
            pocketRequest.token +
            "&redirect_uri=";

          browserUtils.login(pocketRequest);
        } else {
          console.error(xhr.statusText);
        }
      }
    };

    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };

    xhr.send(data);
  },

  /**
     * Retrieve credentials from local storage and update login status element
     *
     * @todo  Refactor to properly pass in is/isNotAuthorized call as a callback
     *
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
  getStoredCredentials: function(callback) {
    if (chrome.storage.local) {
      chrome.storage.local.get(
        {
          access_token: "access_token",
          user_name: "user_name"
        },
        function(items) {
          if (items.user_name !== "user_name") {
            pocket.isAuthorized(items);
          } else {
            pocket.isNotAuthorized();
          }
          return;
        }
      );
    }
  },

  /**
     * Persist a user's Pocket access token and username to local storage
     * AND then call function to update login status element
     *
     * @param {object} credentials Object with user's access token and username
     */
  setStoredCredentials: function(credentials) {
    //response = access_token=ACCESS_TOKEN&username=USERNAME
    var accessTokenStart = credentials.search("=") + 1;
    var accessTokenEnd = credentials.search("&");
    var userNameStart = accessTokenEnd + 10;

    var accessToken = credentials.substring(accessTokenStart, accessTokenEnd);
    var userName = credentials.substring(userNameStart);

    localStorage[this.pocketKey.access_token] = accessToken;

    localStorage[this.pocketKey.user_name] = userName;

    this.isAuthorized();
  },

  /**
     * Authorize a user to getpocket.com and if successful
     * call function to persist credentials to local storage
     *
     * @param  {object} pocket Object with consumer key and request token
     * @return {Promise|void}        If successful a promise via local storage action
     */
  getAccessToken: function(pocketAuthAttempt) {
    var pocketAuthAttempt = {};
    pocketAuthAttempt.url = "https://getpocket.com/v3/oauth/authorize";
    pocketAuthAttempt.key = config.credentials.consumer_key;
    pocketAuthAttempt.token = localStorage[this.pocketKey.request_token];
    var data = new FormData();
    data.append("consumer_key", pocketAuthAttempt.key);
    data.append("code", pocketAuthAttempt.token);

    var xhr = new XMLHttpRequest();

    xhr.open("POST", pocketAuthAttempt.url, true);

    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          pocket.setStoredCredentials(xhr.response);
        } else {
          console.error(xhr.statusText);
        }
      }
    };

    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };

    xhr.send(data);
  }
};
