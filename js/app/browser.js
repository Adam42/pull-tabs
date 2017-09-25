"use strict";
/*
 * Browser
 *
 * Generic browser object switches between Chrome & Firefox
 * Use this through pullTabs to keep it as browser-agnostic
 * as possible.
 *
 */
var chrome = chrome || {}; //appeases jshint
var pullTabs = pullTabs || {};
pullTabs.Browser = pullTabs.Browser || {
  ENV: "",

  browser: function() {},

  /*
     * Kickoff browser setup
     * to wrap around native APIs
     * Default expectation is around Chrome
     */
  init: function() {
    this.ENV = pullTabs.Config.configuration.mode;
    this.isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    this.setBrowser();
    //if a pulltabs bookmark doesn't exist, create one
    if (typeof localStorage["pullTabsFolderId"] === "undefined") {
      this.getBookmarks();
    }
    return;
  },

  //Check for Chrome existence
  setBrowser: function() {
    if (this.ENV === "DEVELOPMENT") {
      this.browser = DevBrowse;
    } else if (typeof chrome !== "undefined") {
      this.browser = PTChrome;
    } else {
      this.browser = DevBrowse;
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

  getTabs: function() {
    return this.browser.getTabs();
  },

  getBookmarks: function(callback) {
    this.browser.getBookmarks(callback);
  },

  closeTabs: function(tabs) {
    this.browser.closeTabs(tabs);
  },

  closeTab: function() {
    this.browser.closeTab(tab);
  },

  bookmarkTabs: function(tabs) {
    this.browser.bookmarkTabs(tabs);
  },

  bookmarkTab: function() {
    this.browser.bookmarkTab(tab);
  },

  downloadUrls: function(tabs) {
    this.browser.downloadUrls(tabs);
  },

  login: function(pocket) {
    this.browser.login(pocket);
  },

  save: function(key, object) {
    this.browser.save(key, object);
  },

  retrieve: function(key, callback) {
    return this.browser.retrieve(key, callback);
  },

  createTab: function(tabKey) {
    this.browser.createTab(tabKey);
  },

  store: function(key, callback) {
    this.browser.store(key, callback);
  },

  getStorageType: function() {
    this.browser.getStorageType();
  }
};

/*
 * Development Browser
 *
 * Stub in sample API results when in
 * development.
 *
 */
var DevBrowse = {
  downloadUrls: function(tabs) {
    tabs.forEach(function(tab) {
      var file = {
        url: tab.url,
        method: "GET"
      };
      console.log("Dev downloaded " + file);
    });
  },

  getTabs: function() {
    return '[{"active":false,"height":779,"highlighted":false,"id":71,"incognito":false,"index":0,"pinned":false,"selected":false,"status":"complete","title":"Dot Boston: Apple, Bicycles, Boston, Dot and Web Media","url":"http://adamp.com/","width":1440,"windowId":68},{"active":false,"height":779,"highlighted":false,"id":83,"incognito":false,"index":1,"pinned":false,"selected":false,"status":"complete","title":"Is It Boston? Find out if your area is part of Boston.","url":"http://isitboston.com/","width":1440,"windowId":68},{"active":false,"height":779,"highlighted":false,"id":85,"incognito":false,"index":2,"pinned":false,"selected":false,"status":"complete","title":"amiacylon.com","url":"http://amiacylon.com/","width":1440,"windowId":68},{"active":true,"height":779,"highlighted":true,"id":91,"incognito":false,"index":3,"pinned":false,"selected":true,"status":"complete","title":"3571814663_5c742efc65_b.jpg (1024×768)","url":"https://c4.staticflickr.com/4/3322/3571814663_5c742efc65_b.jpg","width":1440,"windowId":68}]';
  }
};

/*
 * PullTabs Chrome
 *
 * Wrapper around Google Chrome API.
 * Should only be automatically called via Browser.
 *
 */
var PTChrome = {
  /**
     * Download a resource represented via a tab's URL
     * to local disk either as an HTML file or with
     * the URL's extension if it has one
     *
     * @param  {array} tabs Collection of tab objects
     * @return {[type]}      [description]
     */
  downloadUrls: function(tabs) {
    tabs.forEach(function(tab) {
      //advanced mode
      if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
        var label = document.getElementById("label-tab-" + tab.labelTabId);
        var status = document.getElementById("status");
      }

      var file = {
        url: tab.url
      };

      if (!pullTabs.Browser.isFirefox) {
        file.method = "GET";
      }

      //Chrome handles downloads well but Firefox saves URLs without extension endings
      //with a generic download(x) filename so let's add .html to the tab's title instead.
      if (pullTabs.Browser.isFirefox) {
        if (!pullTabs.Browser.isFile(tab.url)) {
          file.filename = tab.title + ".html";
        }
      }

      try {
        chrome.downloads.download(file, function(e) {
          if (e === undefined) {
            if (label) {
              label.setAttribute("class", label.className + " failed");
            }
            pullTabs.Form.updateStatus(tab, "Failed downloading ");
            return;
          }
          if (label) {
            label.setAttribute("class", label.className + " successful");
          }

          var span = document.createElement("span");
          var link = document.createElement("a");
          var message = document.createTextNode("Downloaded ");

          link.title = tab.title;
          link.href = tab.url;
          link.innerHTML = tab.title;

          span.appendChild(message);
          span.appendChild(link);
          pullTabs.App.updateStatusMessage(span, "short", "success");

          //@to-do check preferences to see if user chose to auto-close tabs upon successful action
          var autoClose = false;
          if (tab.active !== true && autoClose === true) {
            chrome.tabs.remove(tab.id);
          }
        });
      } catch (e) {
        pullTabs.Form.updateStatus(tab, "Error downloading ");
        console.log(e);
      }
    });
  },

  /**
     * Retrieve the current window's tab objects
     *
     * @return {Promise} Promise represents collection of tab object
     */
  getTabs: function() {
    return new Promise(function(resolve, reject) {
      var info = { currentWindow: true };
      chrome.tabs.query(info, function(e) {
        if (typeof e === "object") {
          resolve(e);
          return;
        }
        reject(Error("Couldnt get tabs"));
        //                pullTabs.App.setTabs(e);
      });
    });
  },

  /**
      * Retrieve's a users bookmarks AND
      *  searches for a "Pulltabs" folder
      *  AND if it does not find one then creates one
      *
      * @todo  this funtion should be refactored into
      *        at least three functions -->
      *          findPulltabsBookmarkFolder()
      *          createPulltabsBookmarkFolder()
      *          AND an function to encapsulate the call
      *          to those two functions as well as getBookmarks
      *          END TODO
      *
      * @param  {Function} callback [description]
      * @return {[type]}            [description]
      */
  getBookmarks: function(callback) {
    var otherBookmarks;

    callback = function(tree) {
      //other bookmarks folder
      otherBookmarks = tree[0].children[1];

      var count = otherBookmarks.children.length;
      var i;
      var logIt = function(newFolder) {
        console.log(newFolder.title);
      };

      for (i = 0; i < count; i++) {
        if (otherBookmarks.children[i].title === "Pulltabs") {
          break;
        }
        if (i == count - 1) {
          var folder = {
            parentId: otherBookmarks.id,
            title: "Pulltabs"
          };
          chrome.bookmarks.create(folder, logIt);
        }
      }

      localStorage["pullTabsFolderId"] = otherBookmarks.children[i].id;
    };

    if (typeof localStorage["pullTabsFolderId"] === "undefined") {
      chrome.bookmarks.getTree(callback);
    }
  },

  /**
     * For each tab in a collection of tab object's
     * close that tab
     *
     * @param  {array} tabs Collection of tabs
     * @return {void}
     */
  closeTabs: function(tabs) {
    var numTabs = tabs.length;
    var i;
    for (i = 0; i < numTabs; i++) {
      this.closeTab(tabs[i]);
    }
  },

  /**
     * Close an individual tab
     * @param  {object} tab A browser tab object
     * @return {void}
     */
  closeTab: function(tab) {
    chrome.tabs.remove(tab.id);
  },

  /**
     * Bookmark collection of tabs
     * @param  {array} tabs Collection of tab objects
     */
  bookmarkTabs: function(tabs) {
    var numTabs = tabs.length;
    var i;
    for (i = 0; i < numTabs; i++) {
      this.bookmarkTab(tabs[i]);
    }
  },

  /**
     * Bookmark a single tab
     * @param  {object}   tab      A browser tab object
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
  bookmarkTab: function(tab, callback) {
    var bookmark = {
      parentId: localStorage["pullTabsFolderId"],
      title: tab.title,
      url: tab.url
    };

    chrome.bookmarks.create(bookmark, function(savedMark) {
      var link = document.createElement("a");
      var status = document.createElement("span");
      var message = document.createTextNode("Successfuly bookmarked ");

      link.title = tab.title;
      link.href = tab.url;
      link.innerHTML = tab.title;

      status.appendChild(message);
      status.appendChild(link);

      pullTabs.App.updateStatusMessage(status, "short", "success");

      //            pullTabs.Form.setLabelStatus(tab, "successful");
    });
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
    var redirect = chrome.extension.getURL("pocket.html");
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
      pocket.auth + encodeURIComponent(chrome.identity.getRedirectURL());

    pocket.interactive = true;

    var auth = {
      url: pocket.auth,
      interactive: pocket.interactive
    };

    chrome.identity.launchWebAuthFlow(auth, function(responseUrl) {
      Pocket.getAccessToken(pocket);
    });
  },

  /*
     * Figure out if Firefox, Chrome or other, if Chrome use sync
     * otherwise use local
     */
  getStorageType: function() {
    if (!pullTabs.Browser.isFirefox) {
      if (
        typeof chrome.storage.sync !== "undefined" &&
        typeof chrome.storage.sync.get !== "undefined"
      ) {
        pullTabs.Browser.storageType = chrome.storage.sync;
        return pullTabs.Browser.storageType;
      }
    } else if (
      typeof chrome.storage.local !== "undefined" &&
      typeof chrome.storage.local.get !== "undefined"
    ) {
      pullTabs.Browser.storageType = chrome.storage.local;
      return pullTabs.Browser.storageType;
    }

    //@to-do revert to localStorage
    console.log("chrome.storage is unavailable.");
    return;
  },

  /*
     * Only chrome has sync, if sync is available use it
     * otherwise reverts to using local storage
     * @to-do add a localStorage fallback for browsers that
     * don't recognize chrome.storage
     */
  store: function(key, callback) {
    pullTabs.Browser.getStorageType();

    if (typeof pullTabs.Browser.storageType === "undefined") {
      console.log("No storage available");
      callback();
      return;
    }

    try {
      pullTabs.Browser.storageType.set(key, callback);
    } catch (e) {
      console.log(e);
      return;
    }
  },

  /**
     * Save an object to local storage via a key
     *
     * @param  {string} key    Local storage key
     * @param  {object} object The object to save
     * @return {[type]}        [description]
     */
  save: function(key, object) {
    console.log(key + " save " + object);
    if (typeof chrome.storage === "undefined") {
      console.log("ERROR");
    }
    try {
      chrome.storage.local.set(object, function() {
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
     * @param  {Function} callback [description]
     * @return {Promise}           Promise represents object retrieved from local storage
     */
  retrieve: function(key, callback) {
    var storageType;

    if (pullTabs.Browser.isFirefox) {
      if (
        typeof chrome.storage.local !== "undefined" &&
        typeof chrome.storage.local.get !== "undefined"
      ) {
        storageType = chrome.storage.local;
      } else {
        console.log(
          "Browser is Firefox but chrome.storage.local is unavailable, returning default key value"
        );
        //    callback(key);
        //   return;
      }
    } else if (
      typeof chrome.storage.sync !== "undefined" &&
      typeof chrome.storage.sync.get !== "undefined"
    ) {
      storageType = chrome.storage.sync;
    } else {
      console.log("Storage unavailable, returning default key value");
      // callback(key);
      // return;
    }

    return new Promise(function(resolve, reject) {
      storageType.get(key, function(value) {
        if (typeof value !== "undefined") {
          resolve(value);
          return value;
        }
        reject(Error("Couldn't retrieve key"));
      });
    });
  },

  /**
     * Create a new tab in the current window
     * @param  {string} tabKey A URL?
     * @todo  Properly document the tabKey parameter
     * @return {[type]}        [description]
     */
  createTab: function(tabKey) {
    if (typeof chrome.tabs.create !== "undefined") {
      chrome.tabs.create(tabKey);
      return;
    }

    console.log("Unable to create this tab: ");
    console.dir(tabKey);
    return;
  },

  /**
     * Convert a path to the fully qualified browser extension URL
     * @param  {string} path - A string to convert into a full URL
     * @return {[type]}     [description]
     */
  extensionGetURL: function(path) {
    if (typeof chrome.extension.getURL !== "undefined") {
      return chrome.extension.getURL(path);
    }

    console.log("Unable to get extension relative URL as absolute URL");
    return false;
  }
};

//pullTabs.Browser.init();
if (
  typeof (pullTabs.Browser.ENV !== "undefined") &&
  pullTabs.Browser.ENV === "DEVELOPMENT"
) {
  console.log("DEFAULT TABS: " + pullTabs.Browser.getTabs());
}
pullTabs.Browser.init(pullTabs);
