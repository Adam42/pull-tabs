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
export var PocketAPILayer = PocketAPILayer || {
  pocketKey: {
    access_token: "access_token",
    user_name: "user_name"
  },

  init: function() {
    this.checkLocalLoginStatus();
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

    browser.storage.local
      .set({
        access_token: "access_token",
        user_name: "user_name"
      })
      .then(function(items) {
        return;
      });

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
      PocketAPILayer.logOut();
      return;
    }

    PocketAPILayer.initLogin();
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
    PocketAPILayer.getRequestToken(pocketRequest);
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
    var redirectURL = browser.extension.getURL("pocket.html");

    var data = new FormData();
    data.append("consumer_key", pocketRequest.key);
    data.append("redirect_uri", encodeURIComponent(redirectURL));

    var xhr = new XMLHttpRequest();

    xhr.open("POST", pocketRequest.url, true);

    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          pocketRequest.token = xhr.response.substring(5);
          localStorage[PocketAPILayer.pocketKey.request_token] =
            pocketRequest.token;

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
    browser.storage.local
      .get({
        access_token: "access_token",
        user_name: "user_name"
      })
      .then(function(items) {
        if (items.user_name !== "user_name") {
          PocketAPILayer.isAuthorized(items);
        } else {
          PocketAPILayer.isNotAuthorized();
        }
        return;
      });
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
          PocketAPILayer.setStoredCredentials(xhr.response);
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
