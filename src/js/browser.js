"use strict";
var sanitize = require("sanitize-filename");
import { messageManager } from "./message.js";
import { config } from "./config.js";
import { form } from "./form.js";

//Make sure the browser namespace is set to something
//supported msBrowser is Edge, browser is Firefox/W3C, chrome is Google Chrome
if ("undefined" == typeof browser) {
  window.browser = (function() {
    return window.msBrowser || window.browser || window.chrome;
  })();
}
/*
 * Browser
 *
 * Generic browser object switches between Chrome & Firefox
 * Use this through pullTabs to keep it as browser-agnostic
 * as possible.
 *
 */
export var browserUtils = {
  /*
     * Kickoff browser setup
     * to wrap around native APIs
     * Default expectation is around Chrome
     */
  init: function() {
    this.isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    //if we don't have pulltabs bookmark id saved, search for an existing one
    if (typeof localStorage["pullTabsFolderId"] === "undefined") {
      var gettingTree = browser.bookmarks.getTree();

      gettingTree.then(tree => {
        this.findPulltabsBookmarkFolder(tree);
      });
    }
  },

  isFile: function(pathname) {
    return (
      pathname
        .split("/")
        .pop()
        .split(".").length > 1
    );
  },

  //Update the advanced UI after an action
  updateAdvancedUI: function(tab, message) {
    if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
      form.setLabelStatus(tab, message);
    }
  },

  /**
   * Setup up a listener to watch for changes to DownloadItem
   * @return {[type]} [description]
   */
  watchDownloads: function(callback) {
    browser.downloads.onChanged.addListener(callback);
  },

  /**
     * Download a resource represented via a tab's URL
     * to local disk either as an HTML file or with
     * the URL's extension if it has one
     *
     * Note that the promise is resolved when a download is
     * started, DownloadItem's state will change to either
     * "complete" when the download is successful or to "interrupted"
     * if something prevented the download from completing
     * thus we must watch for changes to DownloadItem
     * to check status
     *
     * @param  {array} tabs Collection of tab objects
     * @return {[type]}      [description]
     */
  downloadUrls: function(tabs) {
    this.watchDownloads();

    var tabMap = { downloadItemToTabMap: {} };

    tabs.forEach(function(tab) {
      //Internal Firefox pages will halt all downloading
      //so we'll skip any URLs that start with "about:"
      if (tab.url.substring(0, 6) === "about:") {
        return;
      }
      return this.downloadUrl(tab)
        .then(e => {
          //create a mapping of downloadItem ID to tab object
          tab.downloadItemId = e;
          tabMap.downloadItemToTabMap[e] = tab;
          browser.storage.local.set(tabMap);

          //Display a message that the download has begun
          simpleUI.updateUI(tab, "Started downloading ", "info");
        })
        .catch(e => {
          simple.updateUI(tab, "Download start failed", "danger");
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
   * Download a single URL
   * @param  {object} tab A browser tab object
   * @return {Promise}     Promise representing whether download started
   */
  downloadUrl: function(tab) {
    var file = {
      url: tab.url
    };

    //If the file doesn't have an filename ending save it as an HTML file
    if (!browserUtils.isFile(tab.url)) {
      file.filename = sanitize(tab.title.toString()) + ".html";
    }

    if (!browserUtils.isFirefox) {
      file.method = "GET";
    }

    return browser.downloads.download(file);
  },

  /**
     * Retrieve the current window's tab objects
     *
     * @return {Promise} Promise represents collection of tab object
     */
  getTabs: function() {
    return new Promise(function(resolve, reject) {
      var info = { currentWindow: true };

      browser.tabs.query(info).then(function(e) {
        if (typeof e === "object") {
          resolve(e);
          return;
        }
        reject(Error("Couldnt get tabs"));
      });
    });
  },

  /**
      * Retrieve's a users bookmarks AND
      *  searches for a "Pulltabs" folder
      *  AND if it does not find one then creates one
      *
      * @param  {object} tree -  array representing tree of bookmarks
      * @return {[type]}            [description]
      */
  findPulltabsBookmarkFolder: function(tree) {
    let bookmarks = tree[0].children[1];

    var count = bookmarks.children.length;
    var i;

    //look for an existing bookmark folder called Pulltabs
    for (i = 0; i < count; i++) {
      //We already have a bookmark folder created
      //so just save that folder id
      if (bookmarks.children[i].title === "Pulltabs") {
        this.saveBookmarkFolder(bookmarks.children[i].id);
        break;
      }
      //We've reached the end of the bookmark folders
      //and did not find an existing pulltabs folder
      if (i == count - 1) {
        var folder = {
          parentId: bookmarks.id,
          title: "Pulltabs"
        };
        this.createPulltabsBookmarkFolder(folder);
      }
    }
  },

  createPulltabsBookmarkFolder: function(folder) {
    browser.bookmarks
      .create(folder)
      .then(result => {
        this.saveBookmarkFolder(result.id);
      })
      .catch(err => {
        console.log("Creating bookmark failed" + err.message);
      });
  },

  /**
   * Save the id of the "pulltabs" folder to local storage
   * @param  {integer} id - Numeric id
   */
  saveBookmarkFolder: function(id) {
    localStorage["pullTabsFolderId"] = id;
  },

  /**
     * Login to getpocket.com
     *
     * @param  {object} pocket [description]
     * @return {void}        [description]
     *
     * @todo should be made generic
     * @todo  should try to use loginViaWebAuthFlow first & fallback to this method
     *
     */
  login: function(pocket) {
    var redirect = browser.extension.getURL("pocket.html");
    pocket.auth = pocket.auth + encodeURIComponent(redirect);
    window.open(pocket.auth);
  },

  /**
     * Use launchWebAuthFlow to perform getpocket.com login
     * Supported in Chrome and Firefox ( as of version 53 )
     *
     * @link https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/identity/launchWebAuthFlow
     * @param  {object} pocket [description]
     * @return {[type]}        [description]
     * @todo  Re-implement using this method instead of window.open
     */
  loginViaWebAuthFlow: function(pocket) {
    pocket.auth =
      pocket.auth + encodeURIComponent(browser.identity.getRedirectURL());

    pocket.interactive = true;

    var auth = {
      url: pocket.auth,
      interactive: pocket.interactive
    };

    browser.identity.launchWebAuthFlow(auth).then(function(responseUrl) {
      Pocket.getAccessToken(pocket);
    });
  },

  /*
     * Only chrome has sync, if sync is available use it
     * otherwise reverts to using local storage
     * @to-do add a localStorage fallback for browsers that
     * don't recognize chrome.storage
     */
  store: function(key) {
    return browser.storage.local.set(key);
  },

  /**
     * Save an object to local storage via a key
     *
     * @param  {string} key    Local storage key
     * @param  {object} object The object to save
     * @return {[type]}        [description]
     */
  save: function(key, object) {
    try {
      browser.storage.local.set(object, function() {
        var status = document.getElementById("status");
        status.textContent = key + " saved.";
        setTimeout(function() {
          status.textContent = "";
        }, 750);
      });
    } catch (e) {
      console.log(e);
    }
  },

  /**
     * Get an object from local storage
     *
     * @param  {string}   key      The name of key in local storage
     * @return {Promise}           Promise represents object retrieved from local storage
     */
  retrieve: function(key) {
    return browser.storage.local.get(key);
  },

  /**
     * Convert a path to the fully qualified browser extension URL
     * @param  {string} path - A string to convert into a full URL
     * @return {[type]}     [description]
     */
  extensionGetURL: function(path) {
    return browser.extension.getURL(path);
  }
};

browserUtils.init();
