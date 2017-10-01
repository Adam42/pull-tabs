/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "config", function() { return config; });

//Change this filename to config.js and fill in the details below

var config = config || function () {
  var setup = {
    credentials: {
      //get an API key from getpocket.com and place it here
      consumer_key: "***REMOVED***"
    },

    configuration: {
      //DEVELOPMENT is the other mode
      //though it is not very fleshed out
      //and this repo doesn't include node's XMLHttpRequest
      //...you should probably just leave this as is
      mode: "PRODUCTION"
    },

    app: {
      name: "Pull Tabs"
    }
  };

  return setup;
}();

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "browser", function() { return browser; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PTChrome", function() { return PTChrome; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__message_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__config_js__ = __webpack_require__(0);

//var sanitize;
//

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var sanitize = __webpack_require__(3);



/*
 * Browser
 *
 * Generic browser object switches between Chrome & Firefox
 * Use this through pullTabs to keep it as browser-agnostic
 * as possible.
 *
 */
var browser = browser || {
  ENV: "",

  browser: function browser() {},

  /*
     * Kickoff browser setup
     * to wrap around native APIs
     * Default expectation is around Chrome
     */
  init: function init() {
    this.ENV = __WEBPACK_IMPORTED_MODULE_1__config_js__["config"].configuration.mode;
    this.isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    this.setBrowser();
    //if a pulltabs bookmark doesn't exist, create one
    if (typeof localStorage["pullTabsFolderId"] === "undefined") {
      this.getBookmarks();
    }
    return;
  },

  //Check for Chrome existence
  setBrowser: function setBrowser() {
    if (this.ENV === "DEVELOPMENT") {
      this.browser = DevBrowse;
    } else if (typeof chrome !== "undefined") {
      this.browser = PTChrome;
    } else {
      this.browser = DevBrowse;
    }
  },

  isFile: function isFile(pathname) {
    return pathname.split("/").pop().split(".").length > 1;
  },

  getTabs: function getTabs() {
    return this.browser.getTabs();
  },

  getBookmarks: function getBookmarks(callback) {
    this.browser.getBookmarks(callback);
  },

  closeTabs: function closeTabs(tabs) {
    this.browser.closeTabs(tabs);
  },

  closeTab: function closeTab() {
    this.browser.closeTab(tab);
  },

  bookmarkTabs: function bookmarkTabs(tabs) {
    this.browser.bookmarkTabs(tabs);
  },

  bookmarkTab: function bookmarkTab() {
    this.browser.bookmarkTab(tab);
  },

  downloadUrls: function downloadUrls(tabs) {
    this.browser.downloadUrls(tabs);
  },

  login: function login(pocket) {
    this.browser.login(pocket);
  },

  save: function save(key, object) {
    this.browser.save(key, object);
  },

  retrieve: function retrieve(key, callback) {
    return this.browser.retrieve(key, callback);
  },

  createTab: function createTab(tabKey) {
    this.browser.createTab(tabKey);
  },

  store: function store(key, callback) {
    this.browser.store(key, callback);
  },

  getStorageType: function getStorageType() {
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
  downloadUrls: function downloadUrls(tabs) {
    tabs.forEach(function (tab) {
      var file = {
        url: tab.url,
        method: "GET"
      };
      console.log("Dev downloaded " + file);
    });
  },

  getTabs: function getTabs() {
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
  downloadUrls: function downloadUrls(tabs) {
    tabs.forEach(function (tab) {
      //advanced mode
      if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
        var label = document.getElementById("label-tab-" + tab.labelTabId);
        var status = document.getElementById("status");
      }

      var file = {
        url: tab.url
      };

      //If the file doesn't have an filename ending save it as an HTML file
      if (!browser.isFile(tab.url)) {
        file.filename = sanitize(tab.title.toString()) + ".html";
      }

      if (!browser.isFirefox) {
        file.method = "GET";
      }

      try {
        chrome.downloads.download(file, function (e) {
          if (e === undefined) {
            if (label) {
              label.setAttribute("class", label.className + " failed");
            }
            form.updateStatus(tab, "Failed downloading, trying with generic filename ");
            return;
          }
          if (label) {
            label.setAttribute("class", label.className + " successful");
          }

          var span = document.createElement("span");
          var link = document.createElement("a");
          var message = document.createTextNode("Downloaded ");

          link.title = tab.title.toString();
          link.href = tab.url;
          link.textContent = tab.title.toString();

          span.appendChild(message);
          span.appendChild(link);

          __WEBPACK_IMPORTED_MODULE_0__message_js__["a" /* messageManager */].updateStatusMessage(span, "short", "success");

          //@to-do check preferences to see if user chose to auto-close tabs upon successful action
          var autoClose = false;
          if (tab.active !== true && autoClose === true) {
            chrome.tabs.remove(tab.id);
          }
        });
      } catch (e) {
        form.updateStatus(tab, "Error downloading ");
        console.log(e);
      }
    });
  },

  /**
     * Retrieve the current window's tab objects
     *
     * @return {Promise} Promise represents collection of tab object
     */
  getTabs: function getTabs() {
    return new Promise(function (resolve, reject) {
      var info = { currentWindow: true };
      chrome.tabs.query(info, function (e) {
        if ((typeof e === "undefined" ? "undefined" : _typeof(e)) === "object") {
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
  getBookmarks: function getBookmarks(callback) {
    var otherBookmarks;

    callback = function callback(tree) {
      //other bookmarks folder
      otherBookmarks = tree[0].children[1];

      var count = otherBookmarks.children.length;
      var i;
      var logIt = function logIt(newFolder) {
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
  closeTabs: function closeTabs(tabs) {
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
  closeTab: function closeTab(tab) {
    chrome.tabs.remove(tab.id);
  },

  /**
     * Bookmark collection of tabs
     * @param  {array} tabs Collection of tab objects
     */
  bookmarkTabs: function bookmarkTabs(tabs) {
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
  bookmarkTab: function bookmarkTab(tab, callback) {
    var bookmark = {
      parentId: localStorage["pullTabsFolderId"],
      title: tab.title.toString(),
      url: tab.url
    };

    chrome.bookmarks.create(bookmark, function (savedMark) {
      var link = document.createElement("a");
      var status = document.createElement("span");
      var message = document.createTextNode("Successfuly bookmarked ");

      link.title = tab.title.toString();
      link.href = tab.url;
      link.textContent = tab.title.toString();

      status.appendChild(message);
      status.appendChild(link);

      __WEBPACK_IMPORTED_MODULE_0__message_js__["a" /* messageManager */].updateStatusMessage(status, "short", "success");
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
  login: function login(pocket) {
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
  loginViaWebAuthFlow: function loginViaWebAuthFlow(pocket) {
    pocket.auth = pocket.auth + encodeURIComponent(chrome.identity.getRedirectURL());

    pocket.interactive = true;

    var auth = {
      url: pocket.auth,
      interactive: pocket.interactive
    };

    chrome.identity.launchWebAuthFlow(auth, function (responseUrl) {
      Pocket.getAccessToken(pocket);
    });
  },

  /*
     * Figure out if Firefox, Chrome or other, if Chrome use sync
     * otherwise use local
     */
  getStorageType: function getStorageType() {
    if (!browser.isFirefox) {
      if (typeof chrome.storage.sync !== "undefined" && typeof chrome.storage.sync.get !== "undefined") {
        browser.storageType = chrome.storage.sync;
        return browser.storageType;
      }
    } else if (typeof chrome.storage.local !== "undefined" && typeof chrome.storage.local.get !== "undefined") {
      browser.storageType = chrome.storage.local;
      return browser.storageType;
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
  store: function store(key, callback) {
    browser.getStorageType();

    if (typeof browser.storageType === "undefined") {
      console.log("No storage available");
      callback();
      return;
    }

    try {
      browser.storageType.set(key, callback);
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
  save: function save(key, object) {
    console.log(key + " save " + object);
    if (typeof chrome.storage === "undefined") {
      console.log("ERROR");
    }
    try {
      chrome.storage.local.set(object, function () {
        var status = document.getElementById("status");
        status.textContent = key + " saved.";
        setTimeout(function () {
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
  retrieve: function retrieve(key, callback) {
    var storageType;

    if (browser.isFirefox) {
      if (typeof chrome.storage.local !== "undefined" && typeof chrome.storage.local.get !== "undefined") {
        storageType = chrome.storage.local;
      } else {
        console.log("Browser is Firefox but chrome.storage.local is unavailable, returning default key value");
        //    callback(key);
        //   return;
      }
    } else if (typeof chrome.storage.sync !== "undefined" && typeof chrome.storage.sync.get !== "undefined") {
      storageType = chrome.storage.sync;
    } else {
      console.log("Storage unavailable, returning default key value");
      // callback(key);
      // return;
    }

    return new Promise(function (resolve, reject) {
      storageType.get(key, function (value) {
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
  createTab: function createTab(tabKey) {
    if (typeof chrome.tabs !== "undefined") {
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
  extensionGetURL: function extensionGetURL(path) {
    if (typeof chrome.extension.getURL !== "undefined") {
      return chrome.extension.getURL(path);
    }

    console.log("Unable to get extension relative URL as absolute URL");
    return false;
  }
};

//browser.init();
if (_typeof(browser.ENV !== "undefined") && browser.ENV === "DEVELOPMENT") {
  console.log("DEFAULT TABS: " + browser.getTabs());
}
browser.init();

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return messageManager; });
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Accepts an HTML element to add a text message to
 * or searches for a "status" element and appends to that element
 *
 * @type {[type]}
 */
var messageManager = messageManager || {
  /**
     * Updates a status element with a message and displays
     * it for a specified duration
     *
     * @param  {string|object} message  Either the text of the message or an element object
     * @param  {string} duration - short,medium,long, dependent or re-stack
     * @param  {string} type     The type of message, e.g. success, danger or info
     * @return {void|number}      A dependent message returns a numeric ID, others void.
     */
  updateStatusMessage: function updateStatusMessage(message, duration, type) {
    var status = document.getElementById("status");
    var statusMessage = document.createElement("p");
    var elementIDName = "status-message-";

    var alertType = "alert-" + type;
    statusMessage.classList.add("alert", alertType);
    status.classList.remove("hidden");
    status.style.top = 0;
    statusMessage.textContent = message;

    //test if it's a DOM element instead of just a string
    if ((typeof message === "undefined" ? "undefined" : _typeof(message)) === "object" && message instanceof HTMLElement) {
      statusMessage.textContent = "";
      statusMessage.appendChild(message);
    }

    statusMessage.id = elementIDName + status.children.length;

    //if there are children then get the id of the last child
    //and bump it to avoid colliding with an older message
    //that hasn't yet been removed
    if (status.children.length > 0) {
      var lastChildID = status.lastChild.id;
      lastChildID = lastChildID.replace(elementIDName, "");
      lastChildID = parseInt(lastChildID) + 1;
      statusMessage.id = elementIDName + lastChildID;
    }

    status.appendChild(statusMessage);

    switch (duration) {
      case "short":
        setTimeout(this.removeStatusMessage, 2000, statusMessage.id);
        break;

      case "medium":
        setTimeout(this.removeStatusMessage, 4000, statusMessage.id);
        break;

      case "long":
        setTimeout(this.removeStatusMessage, 8000, statusMessage.id);
        break;

      case "dependent":
        return statusMessage.id;

      case "restack":
        break;

      default:
        setTimeout(this.removeStatusMessage, 3000, statusMessage.id);
        break;
    }
  },

  /**
     * Remove a previously created status message from DOM via it's ID
     * @param  {Number} id The ID of the element being removed
     * @return {void}    [description]
     */
  removeStatusMessage: function removeStatusMessage(id) {
    if (typeof id === null) {
      id = "status-message-0";
    }
    var status = document.getElementById(id);
    var parent = status.parentNode;
    status.remove();

    if (parent.children.length <= 0) {
      parent.classList.add("hidden");
    }
  }
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


/**
 * Replaces characters in strings that are illegal/unsafe for filenames.
 * Unsafe characters are either removed or replaced by a substitute set
 * in the optional `options` object.
 *
 * Illegal Characters on Various Operating Systems
 * / ? < > \ : * | "
 * https://kb.acronis.com/content/39790
 *
 * Unicode Control codes
 * C0 0x00-0x1f & C1 (0x80-0x9f)
 * http://en.wikipedia.org/wiki/C0_and_C1_control_codes
 *
 * Reserved filenames on Unix-based systems (".", "..")
 * Reserved filenames in Windows ("CON", "PRN", "AUX", "NUL", "COM1",
 * "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
 * "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", and
 * "LPT9") case-insesitively and with or without filename extensions.
 *
 * Capped at 255 characters in length.
 * http://unix.stackexchange.com/questions/32795/what-is-the-maximum-allowed-filename-and-folder-size-with-ecryptfs
 *
 * @param  {String} input   Original filename
 * @param  {Object} options {replacement: String}
 * @return {String}         Sanitized filename
 */

var truncate = __webpack_require__(6);

var illegalRe = /[\/\?<>\\:\*\|":]/g;
var controlRe = /[\x00-\x1f\x80-\x9f]/g;
var reservedRe = /^\.+$/;
var windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
var windowsTrailingRe = /[\. ]+$/;

function sanitize(input, replacement) {
  var sanitized = input
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement);
  return truncate(sanitized, 255);
}

module.exports = function (input, options) {
  var replacement = (options && options.replacement) || '';
  var output = sanitize(input, replacement);
  if (replacement === '') {
    return output;
  }
  return sanitize(output, '');
};


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return pocket; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__message_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__config_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__browser_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__form_js__ = __webpack_require__(5);







/**
 * Integration with getpocket.com allowing
 * users to save tabs to their Pocket account
 * @type {[type]}
 */
var pocket = pocket || {
  pocketKey: {
    access_token: "access_token",
    user_name: "user_name"
  },

  init: function init() {
    if (typeof localStorage[this.pocketKey.user_name] !== "undefined" && localStorage[this.pocketKey.user_name] !== "user_name") {
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
  checkLocalLoginStatus: function checkLocalLoginStatus() {
    if (typeof localStorage[this.pocketKey.user_name] !== "undefined" && localStorage[this.pocketKey.user_name] !== "user_name") {
      this.isAuthorized();
      return;
    }

    this.isNotAuthorized();
    return;
  },

  /**
     * Update login status element to a logout link if the element exists
     */
  isAuthorized: function isAuthorized() {
    var status = document.getElementById("pocket-status");
    if (status !== null) {
      status.href = "#pocket-logout";
      status.textContent = "You are signed in as " + decodeURIComponent(localStorage[this.pocketKey.user_name]) + " Click to log out.";
    }
  },

  /**
     * Update login status element to a login link
     */
  isNotAuthorized: function isNotAuthorized() {
    var status = document.getElementById("pocket-status");
    status.href = "#pocket-login";
    status.textContent = "You are not authorized, please sign in.";
  },

  /**
     * Set user credentials to default values in local storage
     * @return {Promise} Promise represents result of storage action
     */
  logOut: function logOut() {
    localStorage[this.pocketKey.user_name] = "user_name";
    localStorage[this.pocketKey.access_token] = "access_token";

    chrome.storage.local.set({
      access_token: "access_token",
      user_name: "user_name"
    }, function (items) {
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
  checkLink: function checkLink(event) {
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
  initLogin: function initLogin() {
    var pocket = {};
    pocket.url = "https://getpocket.com/v3/oauth/request";
    pocket.key = __WEBPACK_IMPORTED_MODULE_1__config_js__["config"].credentials.consumer_key;
    pocket.getRequestToken(pocket);
  },

  /**
     * Saves a tab's title & URL to getpocket.com
     * @param  {object} tab - A browser tab object
     * @return {boolean}     true if successful, false if not
     */
  saveTabToPocket: function saveTabToPocket(tab) {
    var url = tab.url;

    var pocket_data = {
      url: url,
      consumer_key: __WEBPACK_IMPORTED_MODULE_1__config_js__["config"].credentials.consumer_key,
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

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status !== 200) {
          if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
            //                      pullTabs.Form.setLabelStatus(tab, 'failed');
          }
          message = document.createTextNode("Failed saving to Pocket ");
          status.appendChild(message);
          status.appendChild(link);
          __WEBPACK_IMPORTED_MODULE_0__message_js__["a" /* messageManager */].updateStatusMessage(status, "dependent", "danger");

          return false;
        } else if (xhr.readyState === 4 && xhr.status === 200) {
          if (tab.labelTabId !== undefined && tab.labelTabId !== null) {
            //                        pullTabs.Form.setLabelStatus(tab, 'successful');
          }

          message = document.createTextNode("Saved this tab to pocket: ");
          status.appendChild(message);
          status.appendChild(link);
          __WEBPACK_IMPORTED_MODULE_0__message_js__["a" /* messageManager */].updateStatusMessage(status, "medium", "success");

          //if we remove the tab that the popup was invoked on the popup
          //goes away, ideally we should move to event scripts
          //so the popup isn't dependent on a tab being open
          var autoClose;
          if (autoClose) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
              if (tab.id !== tabs[0].id) {
                //chrome.tabs.remove(tab.id);
              }
            });
          }

          return true;
        }
      };

      xhr.onerror = function (e) {
        __WEBPACK_IMPORTED_MODULE_3__form_js__["a" /* form */].setLabelStatus(tab, "failed");

        console.error("saveTabToPocket error: " + xhr.statusText);
        return;
      };

      xhr.send(JSON.stringify(pocket_data));
    } catch (e) {
      console.log("saveTabToPocket Exception: ");
      console.log(e);
      __WEBPACK_IMPORTED_MODULE_3__form_js__["a" /* form */].setLabelStatus(tab, "failed");
      return false;
    }
  },

  /**
     * Bulk save tabs to getpocket.com
     * @param  {array} tabs - Collection of browser tab objects
     * @return {[type]}      [description]
     */
  saveTabsToPocket: function saveTabsToPocket(tabs) {
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
     * @param  {object} pocket An object with key and token
     * @return {[type]}        [description]
     */
  getRequestToken: function getRequestToken(pocket) {
    var redirectURL = chrome.extension.getURL("pocket.html");

    var data = new FormData();
    data.append("consumer_key", pocket.key);
    data.append("redirect_uri", encodeURIComponent(redirectURL));

    var xhr = new XMLHttpRequest();

    xhr.open("POST", pocket.url, true);

    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          pocket.token = xhr.response.substring(5);

          localStorage[pocket.pocketKey.request_token] = pocket.token;

          pocket.auth = "https://getpocket.com/auth/authorize?request_token=" + pocket.token + "&redirect_uri=";

          __WEBPACK_IMPORTED_MODULE_2__browser_js__["browser"].login(pocket);
        } else {
          console.error(xhr.statusText);
        }
      }
    };

    xhr.onerror = function (e) {
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
  getStoredCredentials: function getStoredCredentials(callback) {
    if (chrome.storage.local) {
      chrome.storage.local.get({
        access_token: "access_token",
        user_name: "user_name"
      }, function (items) {
        if (items.user_name !== "user_name") {
          pocket.isAuthorized(items);
        } else {
          pocket.isNotAuthorized();
        }
        return;
      });
    }
  },

  /**
     * Persist a user's Pocket access token and username to local storage
     * AND then call function to update login status element
     *
     * @param {object} credentials Object with user's access token and username
     */
  setStoredCredentials: function setStoredCredentials(credentials) {
    //response = access_token=ACCESS_TOKEN&username=USERNAME
    var accessTokenStart = credentials.search("=") + 1;
    var accessTokenEnd = credentials.search("&");
    var userNameStart = accessTokenEnd + 10;

    var accessToken = credentials.substring(accessTokenStart, accessTokenEnd);
    var userName = credentials.substring(userNameStart);

    localStorage[this.pocketKey.access_token] = accessToken;

    localStorage[this.pocketKey.user_name] = userName;

    this.isAuthorized();
    /*
        //pullTabs.Browser.save('Pocket', pocket );
         chrome.storage.local.set( pocket , function () {
            var status = document.getElementById('status');
            status.textContent = pocket.key + ' saved.';
            setTimeout( function () {
               status.textContent = '';
            }, 750);
        });
    */
  },

  /**
     * Authorize a user to getpocket.com and if successful
     * call function to persist credentials to local storage
     *
     * @param  {object} pocket Object with consumer key and request token
     * @return {Promise|void}        If successful a promise via local storage action
     */
  getAccessToken: function getAccessToken(pocket) {
    var pocket = {};
    pocket.url = "https://getpocket.com/v3/oauth/authorize";
    pocket.key = __WEBPACK_IMPORTED_MODULE_1__config_js__["config"].credentials.consumer_key;
    pocket.token = localStorage[this.pocketKey.request_token];
    var data = new FormData();
    data.append("consumer_key", pocket.key);
    data.append("code", pocket.token);

    var xhr = new XMLHttpRequest();

    xhr.open("POST", pocket.url, true);

    xhr.onload = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          pocket.setStoredCredentials(xhr.response);
        } else {
          console.error(xhr.statusText);
        }
      }
    };

    xhr.onerror = function (e) {
      console.error(xhr.statusText);
    };

    xhr.send(data);
  }
};

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return form; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__popup_js__ = __webpack_require__(9);



/**
 * Common form functionality
 * @constructor
 */
var form = form || {
  options: "",

  init: function init(values) {
    this.options = values;
  },

  createForm: function createForm(tabs) {
    __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].getOptions(function (options) {
      __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].assembleForm(tabs, options);
      return;
    });

    __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].watchSubmit(tabs);
    return;
  },

  createCheckbox: function createCheckbox(tab, type, checked) {
    var input = document.createElement("input");
    input.type = "checkbox";
    input.id = "tab-" + tab.index;
    input.name = "tabs" + tab.index;
    input.title = tab.title.toString() + type;
    input.value = tab.url.toString();
    input.checked = checked;

    return input;
  },

  /**
   * Creates radio input form fields and selects the radio button
   * if it's action matches the user's preferred action
   *
   * @param  {object} tab         A browser tab object
   * @param  {string} action       An action user can perform on the tab
   * @param  {string} preferrence - User's preferred action
   * @return {element}             An HTML label element wrapped around a radio input element
   */
  createRadioInput: function createRadioInput(tab, action, preferrence) {
    action = action.toString();
    preferrence = preferrence.toString();

    var checked = "";

    if (action === preferrence) {
      checked = "checked";
    }
    var input = document.createElement("input");
    input.type = "radio";
    input.id = "tab-pref-" + tab.index;
    input.name = "tab-pref-" + tab.index;
    input.value = action;
    input.checked = checked;

    var label = document.createElement("label");
    label.setAttribute("class", "preferences");

    var actionSpan = document.createElement("span");
    actionSpan.textContent = action;

    label.appendChild(actionSpan);
    label.appendChild(input);

    return label;
  },

  createLabel: function createLabel(tab, type, active) {
    var label = document.createElement("label");
    label.setAttribute("class", "list-group-item " + active);
    label.setAttribute("id", "label-tab-" + tab.index);
    var title = document.createElement("p");
    title.textContent = "Title: " + tab.title.toString();
    label.appendChild(title);
    //if Full Mime Type add mimetype
    //@to-do Pull the setting from Options page
    //label.innerHTML = label.innerHTML + "<p> Type: " + type + "</p>";

    //Dead code without enabling mime type option in user preferences
    if (type.split("/").shift() === "image") {
      var image = document.createElement("img");
      image.classList.add("img-thumbnail");
      image.style = "width: 150px; height: 150px;";
      image.src = tab.url.toString();
      label.appendChild(image);
    }

    return label;
  },

  toggleLabels: function toggleLabels(label) {
    label.addEventListener("click", function () {
      var input = label.getElementsByTagName("input")[0];
      if (label.classList.contains("active")) {
        if (!input.checked) {
          label.classList.remove("active");
        }
      }
      if (!label.classList.contains("active")) {
        if (input.checked) {
          label.classList.add("active");
        }
      }
    });
  },

  setLabelStatus: function setLabelStatus(tab, status) {
    var label = document.getElementById("label-tab-" + tab.labelTabId);
    label.setAttribute("class", label.className + " " + status);
  },

  updateStatus: function updateStatus(tab, text) {
    var label = document.getElementById("status");
    var link = document.createElement("a");
    var status = document.createElement("p");
    var message = document.createTextNode(text);

    link.title = tab.title.toString();
    link.href = tab.url.toString();
    link.textContent = tab.title.toString();

    status.appendChild(message);
    status.appendChild(link);
    label.appendChild(status);
    label.removeAttribute("class", "hidden");
  },

  assembleForm: function assembleForm(tabs, options) {
    var resources = document.getElementById("resources");

    tabs.forEach(function (tab) {
      __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].getContentType(tab.url, function (response) {
        this.mType = response;
      });

      var type = this.mType.split("/").shift().toLowerCase();

      var pref = options[type] ? options[type] : "ignore";

      var checked = "";
      var active = "";

      if (pref === "download" || pref === "pocket") {
        checked = "checked";
        active = "active";
      }

      var input = __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].createCheckbox(tab, type, checked);

      if (pref === "download") {}
      var radioDown = __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].createRadioInput(tab, "download", pref);
      var radioPocket = __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].createRadioInput(tab, "pocket", pref);
      var radioIgnore = __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].createRadioInput(tab, "ignore", pref);

      var label = __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].createLabel(tab, type, active);

      label.appendChild(input);
      label.appendChild(radioDown);
      label.appendChild(radioPocket);
      label.appendChild(radioIgnore);

      resources.appendChild(label);
    });
  },

  getSelectedGroup: function getSelectedGroup() {
    var group = document.getElementById();
  },

  /**
     * For each tab we look for a form input
     * via it's tab ID and for each action type
     * push it to a stack of those actions
     *
     * @param  {array} tabs Collection of tab objects
     * @return {array}      Tabs with arrays of actions added
     */
  getSelectedTabs: function getSelectedTabs(tabs) {
    var inputs = tabs.length;
    var downloadURLs = [];
    var pocketURLs = [];
    var bookmarkURLs = [];
    var closeURLs = [];
    var ignoreURLs = [];
    var results = [];

    var i;

    for (i = 0; i < inputs; i++) {
      var input = document.getElementById("tab-" + i);
      if (input.checked) {
        var radios = document.getElementsByName("tab-pref-" + i);
        var x;
        tabs[i].labelTabId = i;
        for (x = 0; x < radios.length; x++) {
          if (radios[x].checked) {
            var action = radios[x].value;
            switch (action) {
              case "download":
                downloadURLs.push(tabs[i]);
                break;
              case "pocket":
                pocketURLs.push(tabs[i]);
                break;
              case "bookmark":
                bookmarkURLs.push(tabs[i]);
                break;
              case "close":
                closeURLs.push(tabs[i]);
                break;
              default:
                ignoreURLs.push(tabs[i]);
                break;
            }
          }
        }
      } else {
        ignoreURLs.push(tabs[i]);
      }
    }

    tabs.downloads = downloadURLs;
    tabs.pockets = pocketURLs;
    tabs.closes = closeURLs;
    tabs.bookmarks = bookmarkURLs;
    tabs.ignores = ignoreURLs;

    return tabs;
  },

  /**
     * Highlight labels when an tab input is clicked
     *
     * @return {[type]} [description]
     */
  watchMutateCheck: function watchMutateCheck() {
    var form = document.querySelector("#resources");

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var node = document.querySelector("#" + mutation.addedNodes[0].id + " > input");
        var label = document.querySelector("#label-" + node.id);
        label.addEventListener("click", function () {
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

    var config = { attributes: true, childList: true, characterData: true };

    observer.observe(form, config);
  }
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var truncate = __webpack_require__(7);
var getLength = __webpack_require__(8);
module.exports = truncate.bind(null, getLength);


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function isHighSurrogate(codePoint) {
  return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint) {
  return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

// Truncate string by size in bytes
module.exports = function truncate(getLength, string, byteLength) {
  if (typeof string !== "string") {
    throw new Error("Input must be string");
  }

  var charLength = string.length;
  var curByteLength = 0;
  var codePoint;
  var segment;

  for (var i = 0; i < charLength; i += 1) {
    codePoint = string.charCodeAt(i);
    segment = string[i];

    if (isHighSurrogate(codePoint) && isLowSurrogate(string.charCodeAt(i + 1))) {
      i += 1;
      segment += string[i];
    }

    curByteLength += getLength(segment);

    if (curByteLength === byteLength) {
      return string.slice(0, i + 1);
    }
    else if (curByteLength > byteLength) {
      return string.slice(0, i - segment.length + 1);
    }
  }

  return string;
};



/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function isHighSurrogate(codePoint) {
  return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint) {
  return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

// Truncate string by size in bytes
module.exports = function getByteLength(string) {
  if (typeof string !== "string") {
    throw new Error("Input must be string");
  }

  var charLength = string.length;
  var byteLength = 0;
  var codePoint = null;
  var prevCodePoint = null;
  for (var i = 0; i < charLength; i++) {
    codePoint = string.charCodeAt(i);
    // handle 4-byte non-BMP chars
    // low surrogate
    if (isLowSurrogate(codePoint)) {
      // when parsing previous hi-surrogate, 3 is added to byteLength
      if (prevCodePoint != null && isHighSurrogate(prevCodePoint)) {
        byteLength += 1;
      }
      else {
        byteLength += 3;
      }
    }
    else if (codePoint <= 0x7f ) {
      byteLength += 1;
    }
    else if (codePoint >= 0x80 && codePoint <= 0x7ff) {
      byteLength += 2;
    }
    else if (codePoint >= 0x800 && codePoint <= 0xffff) {
      byteLength += 3;
    }
    prevCodePoint = codePoint;
  }

  return byteLength;
};


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "popup", function() { return popup; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__form_js__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__message_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pocket_js__ = __webpack_require__(4);


var browser = __webpack_require__(1).browser;
var options = __webpack_require__(10);




/**
 * Main functionality of pullTabs extension
 * exposed to user via a popup window
 * @constructor
 */
var popup = popup || {
  tabs: "",

  prefs: "",

  layout: "",

  mimeTypesMap: {},

  init: function init() {
    //Force user to go to options page on initial load
    if (localStorage.initialSetup !== "no") {
      localStorage.initialSetup = "yes";
      popup.doInitialSetup();
      return;
    }
    //If we don't have any tabs yet then retrieve them
    if (!popup.tabs) {
      var msgID = __WEBPACK_IMPORTED_MODULE_1__message_js__["a" /* messageManager */].updateStatusMessage("Gathering your tabs", "dependent", "info");

      browser.getTabs().then(function (tabs) {
        popup.tabs = tabs;
        __WEBPACK_IMPORTED_MODULE_1__message_js__["a" /* messageManager */].removeStatusMessage(msgID);
        return tabs;
      }).then(function (tabs) {
        popup.setNumTabs(tabs);
      }).then(popup.getLayout().then(function (layout) {
        popup.setLayout(layout);
        popup.displayLayout();
      })).catch(function (e) {
        console.log(e);
      });

      return;
    }
  },

  doInitialSetup: function doInitialSetup() {
    if (document.getElementById("setup") === null) {
      var optionsLink = document.createElement("a");
      //Browser is not instantiated at this point
      //optionsLink.href = Browser.extensionGetURL('options.html');
      optionsLink.href = chrome.extension.getURL("options.html");
      optionsLink.id = "initial-load";
      optionsLink.textContent = " Setup PullTabs with your preferences.";

      var setupMessage = document.createElement("p");
      setupMessage.classList.add("alert", "alert-info");
      setupMessage.textContent = "This appears to be your first time using PullTabs. Please visit the options page to define your preferences and setup any external services you wish to use.";
      setupMessage.id = "setup";
      setupMessage.appendChild(optionsLink);

      var parent = document.getElementById("simple").parentNode;
      var simple = document.getElementById("simple");

      parent.insertBefore(setupMessage, simple);

      setupMessage.addEventListener("click", function (e) {
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
  displayLayout: function displayLayout() {
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

  addMimeTypeToTabs: function addMimeTypeToTabs() {
    return popup.tabs.map(function (tab) {
      //          var tabObj = popup.tabs.filter(function( tabObj ) {
      //            return tabObj.id == tab.id;
      //         })['0'];

      popup.getContentType(tab.url).then(function (mimeType) {
        var id = "tab" + tab.id.toString();
        popup.setMimeTypesMap(id, mimeType);
        //                popup.mimeTypesMap[id] = mimeType;
        //                tabObj.mimeType = mimeType;
      }).catch(function (e) {
        console.log(e);
      });
    });
  },

  setMimeTypesMap: function setMimeTypesMap(id, mimeType) {
    popup.mimeTypesMap[id] = mimeType;
  },

  displayAdvancedLayout: function displayAdvancedLayout() {
    var advanced = document.getElementById("advanced");
    advanced.classList.remove("hidden");
    this.getOptions().then(function (value) {
      popup.setOptions(value);
    }).then(popup.getFullMimeType().then(function (fullMimeType) {
      if (fullMimeType.retrieveFullMimeType) {
        Promise.all(popup.addMimeTypeToTabs).then(function () {
          popup.assembleForm(popup.tabs, popup.pref, popup.mimeTypesMap);
        });
      } else {
        popup.assembleForm(popup.tabs, popup.pref, popup.mimeTypesMap);
      }
    }).then(function () {
      popup.watchSubmit(popup.tabs);

      var numFormTabs = document.getElementById("resources").getElementsByClassName("list-group-item");

      popup.watchCheckBoxes(numFormTabs);
      popup.watchMutateCheck();
      popup.setActions();
    }));
  },

  watchCheckBoxes: function watchCheckBoxes(numFormTabs) {
    var i;
    for (i = 0; i < numFormTabs.length; i++) {
      __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].toggleLabels(numFormTabs[i]);
    }
  },

  /**
     * Retrieve the URLs represented in tabs collection
     * @param  {array} tabs Collection of tab objects
     * @return {array}      Collection of URLs from user's tabs
     */
  getUrls: function getUrls(tabs) {
    var urls = [];

    tabs.forEach(function (tab) {
      urls.push(tab.url);
    });

    return urls;
  },

  setTabs: function setTabs(tabs) {
    this.tabs = tabs;
  },

  setNumTabs: function setNumTabs(tabs) {
    var numTabs = document.getElementById("numTabs");
    numTabs.textContent = "This window has " + tabs.length + " tabs. Do this action to all tabs:";
  },

  getFullMimeType: function getFullMimeType() {
    return browser.retrieve(options.fullMimeType);
  },

  assembleForm: function assembleForm(tabs, prefs, mimeTypes) {
    tabs.forEach(function (tab) {
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

  displayDefaultAdvancedLayout: function displayDefaultAdvancedLayout(tab) {
    var resources = document.getElementById("resources");
    var fullType = "unknown";
    var pref = "ignore";
    var checked = "";
    var active = "";

    if (pref !== "ignore") {
      checked = "checked";
      active = "active";
    }

    var input = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].createCheckbox(tab, fullType, checked);
    var radioDown = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].createRadioInput(tab, "download", pref);
    var radioPocket = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].createRadioInput(tab, "pocket", pref);
    var radioBookmark = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].createRadioInput(tab, "bookmark", pref);
    var radioClose = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].createRadioInput(tab, "close", pref);
    var label = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].createLabel(tab, fullType, active);

    label.appendChild(input);
    label.appendChild(radioDown);
    label.appendChild(radioPocket);
    label.appendChild(radioBookmark);
    label.appendChild(radioClose);

    resources.appendChild(label);
  },

  getTabStatus: function getTabStatus() {
    this.tabs = __WEBPACK_IMPORTED_MODULE_0__form_js__["a" /* form */].getSelectedTabs(this.tabs);

    if (this.tabs.downloads.length > 0) {
      browser.downloadUrls(this.tabs.downloads);
    }

    if (this.tabs.pockets.length > 0) {
      __WEBPACK_IMPORTED_MODULE_2__pocket_js__["a" /* pocket */].saveTabsToPocket(this.tabs.pockets);
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
  getContentType: function getContentType(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        if (xhr.status === 200) {
          var contentType = xhr.getResponseHeader("Content-Type");

          //strip off everything but the first part of the Content-Type
          //unless it is null which is often due to internal tabs
          //like for instance a chrome-extension:// tab
          if (contentType !== null) {
            resolve(contentType.split(";").shift().split("/").shift().toLowerCase());
          } else {
            resolve("unknown");
            //                            reject("Content-Type unavailable");
          }
        }
        reject(Error(xhr.statusText));
      };

      xhr.onerror = function () {
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

  setLayout: function setLayout(layout) {
    popup.layout = layout;
  },

  //returns a Promise
  getLayout: function getLayout() {
    var key = {
      simple: "true",
      advanced: "false"
    };
    var msgID = __WEBPACK_IMPORTED_MODULE_1__message_js__["a" /* messageManager */].updateStatusMessage("Loading layout", "dependent", "info");

    return browser.retrieve(key).then(function (value) {
      __WEBPACK_IMPORTED_MODULE_1__message_js__["a" /* messageManager */].removeStatusMessage(msgID);
      return value;
    });
  },

  doError: function doError(error) {
    console.log("Error: ");
    console.log(error);
    return;
  },

  getOptions: function getOptions(callback) {
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

  setOptions: function setOptions(items) {
    popup.prefs = items;
  },

  /**
   * Sets up event listeners to watch for clicks
   * on check/uncheck all buttons
   *
   * @event click
   */
  setActions: function setActions() {
    var checkAllButton = document.getElementById("check-all-button");
    checkAllButton.addEventListener("click", function () {
      popup.setAllActive();
    });

    var uncheckAllButton = document.getElementById("uncheck-all-button");
    uncheckAllButton.addEventListener("click", function () {
      popup.setAllInactive();
    });
  },

  /**
   * Update all checkboxes in the list form and their labels to be active
   *
   * @todo  Extract out the form element so any form can be used
   */
  setAllActive: function setAllActive() {
    var labels = document.querySelectorAll("#resources > label");
    var numLabels = labels.length;
    var i;

    var checkBoxes = document.getElementById("list").querySelectorAll("input[type=checkbox]");

    checkBoxes.forEach(function (checkBox) {
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
  setAllInactive: function setAllInactive() {
    var labels = document.querySelectorAll("#resources > label");
    var numLabels = labels.length;
    var i;

    var checkBoxes = document.getElementById("list").querySelectorAll("input[type=checkbox]");

    checkBoxes.forEach(function (checkBox) {
      checkBox.checked = false;
    });

    for (i = 0; i < numLabels; i++) {
      if (labels[i].classList.contains("active")) {
        labels[i].classList.remove("active");
      }
    }
  },

  //Unused? Should it be used in setAllActive/Inactive above?
  updateBackground: function updateBackground(node, label) {
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

  watchMutateCheck: function watchMutateCheck() {
    var form = document.querySelector("#resources");

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var node = document.querySelector("#" + mutation.addedNodes[0].id + " > input");
        var label = document.querySelector("#label-" + node.id);
        label.addEventListener("click", function () {
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

  process: function process(evt) {
    evt.preventDefault();
    popup.getTabStatus();
  },

  processGroup: function processGroup(evt) {
    evt.preventDefault();
    var destination = document.getElementById("default");
  },

  doAction: function doAction(evt) {
    evt.preventDefault();
    popup.processButton(this.id);
  },

  processButton: function processButton(action) {
    switch (action) {
      case "download":
        browser.downloadUrls(popup.tabs);
        break;

      case "pocket":
        __WEBPACK_IMPORTED_MODULE_2__pocket_js__["a" /* pocket */].saveTabsToPocket(popup.tabs);
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

  watchButtons: function watchButtons() {
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

  watchSubmit: function watchSubmit() {
    var group = document.getElementById("default");
    group.addEventListener("submit", this.processGroup);

    var checked = document.getElementById("list");
    checked.addEventListener("submit", this.process);
  }
};

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "options", function() { return options; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__browser_js__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__pocket_js__ = __webpack_require__(4);


var sanitize = __webpack_require__(3);



/**
 * Settings/preferences interface for a user to save
 * things like Pocket login, layout options and other settings
 *
 * @return {[type]} [description]
 */
var options = options || function () {
  var tabSettings = {},
      opt = {};

  //list of mimetypes we'll act on
  opt.mimeTypes = ["application", "image", "message", "model", "multipart", "text", "video", "unknown"];
  opt.numOfmimeTypes = opt.mimeTypes.length;

  opt.mimeSettings = {};
  opt.fullMimeType = {
    retrieveFullMimeType: false
  };
  opt.layout = {
    simple: true,
    advanced: false
  };
  opt.autoClose = {
    autoCloseTabs: false
  };

  //list of available actions to apply to a tab
  opt.tabActions = ["ignore", "download", "pocket", "bookmark", "close"];

  opt.tabOptions = ["enabled", "disabled"];

  opt.numOftabActions = opt.tabActions.length;

  //create a default preferences object to pass to restoreOptions
  //in case there is no existing preferences stored or
  //if stored preferences can't be retrieved will use this default
  function setDefaultMimeTypes() {
    opt.mimeTypes.forEach(function (element) {
      opt.mimeSettings[element] = this.tabActions[0];
    }, opt);
  }

  function setDefaultTabActions() {
    opt.tabActions.forEach(function (element) {
      tabSettings[element] = this.tabOptions[0];
    }, opt);
  }

  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function createForm() {
    var optionsForm = document.getElementById("file-type-destinations");

    for (var i = 0; i < opt.numOfmimeTypes; i++) {
      var panel = document.createElement("div");
      panel.setAttribute("class", "panel panel-default row");

      var headerDiv = document.createElement("div");
      headerDiv.setAttribute("class", "panel-heading col-md-2");

      var header = document.createElement("h4");
      header.textContent = capitalize(opt.mimeTypes[i]);

      headerDiv.appendChild(header);
      panel.appendChild(headerDiv);

      var formDiv = document.createElement("div");
      formDiv.setAttribute("class", "panel-body col-md-10");

      for (var x = 0; x < opt.numOftabActions; x++) {
        var label = document.createElement("label");

        var input = document.createElement("input");
        input.type = "radio";
        input.id = opt.tabActions[x];
        input.name = opt.mimeTypes[i];
        input.value = opt.tabActions[x];

        var span = document.createElement("span");
        span.textContent = capitalize(opt.tabActions[x]);
        label.appendChild(input);
        label.appendChild(span);
        formDiv.appendChild(label);
      }
      panel.appendChild(formDiv);

      optionsForm.appendChild(panel);
    }
  }

  function bindUIActions() {
    document.getElementById("settings").addEventListener("submit", opt.saveMimeSettings);
    document.getElementById("pocket-status").addEventListener("click", console.log("hi"));
    document.getElementById("full-mime-types").addEventListener("click", opt.saveFullMimeType);
    document.getElementById("simple").addEventListener("click", opt.saveLayout);
    document.getElementById("advanced").addEventListener("click", opt.saveLayout);
    document.getElementById("autoclose").addEventListener("click", opt.saveAutoClose);
  }

  opt.init = function () {
    console.log(sanitize);
    bindUIActions();
    setDefaultMimeTypes();
    createForm();
    this.restoreMimeSettings().then(opt.setSettings);
    this.getLayout().then(options.setLayout);
    this.getAutoClose().then(options.setAutoClose);

    this.getFullMimeType().then(function (fullMimeType) {
      options.setFullMimeType(fullMimeType);
    }).catch(function (e) {
      console.log(e);
    });

    __WEBPACK_IMPORTED_MODULE_1__pocket_js__["a" /* pocket */].checkLocalLoginStatus();
  };

  opt.getMimeTypes = function () {
    return opt.mimeSettings;
  };

  opt.getMimeSettings = function () {
    return opt.mimeSettings;
  };

  opt.restoreMimeSettings = function (callback) {
    return __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].retrieve(opt.mimeSettings, callback);
  };

  /*
   *
   * Loop through available mimeTypes and apply user's
   * stored preferences to each tab.
   *
  */
  opt.setSettings = function (items) {
    for (var i = 0; i < opt.numOfmimeTypes; i++) {
      var settings = document.getElementsByName(opt.mimeTypes[i]);

      var setting = items[opt.mimeTypes[i]];

      for (var x = 0; x < settings.length; x++) {
        if (settings[x].id === setting) {
          opt.mimeSettings[opt.mimeTypes[i]] = settings[x].id;
          settings[x].checked = true;
        } else {
          settings[x].checked = false;
        }
      }
    }
  };

  /**
   * Set form inputs to match layout enabled/disabled preference
   *
   * @param {object} layout - An object representing current layout setting
   */
  opt.setLayout = function (layout) {
    var simple = document.getElementById("simple");
    var advanced = document.getElementById("advanced");
    if (layout.simple === true) {
      simple.checked = true;
    } else {
      simple.checked = false;
    }

    if (layout.advanced === true) {
      advanced.checked = true;
    } else {
      advanced.checked = false;
    }
  };

  /**
   * Set form input to match autoclose setting
   * @param {object} autoclose - Object storing user's autoclose preference
   */
  opt.setAutoClose = function (autoclose) {
    var autoCloseButton = document.getElementById("autoclose");

    if (autoclose.autoCloseTabs === true) {
      autoCloseButton.checked = true;
    }
  };

  /**
   * Persist user's autoclose preference to storage
   *
   * @return {Promise} Promise represents storage update result
   */
  opt.saveAutoClose = function () {
    var autoCloseButton = document.getElementById("autoclose");

    if (autoCloseButton.checked === true) {
      opt.autoClose.autoCloseTabs = true;
    } else {
      opt.autoClose.autoCloseTabs = false;
    }

    try {
      __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].store(opt.autoClose, opt.updateStatusMessage("Autoclose saved."));
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  /**
   * Persist user's layout preferences to storage
   * @return {Promise} Promise represents result of storage action
   */
  opt.saveLayout = function () {
    var simpleLayout = document.getElementById("simple");
    var advancedLayout = document.getElementById("advanced");

    if (simpleLayout.checked === true) {
      opt.layout.simple = true;
    } else {
      opt.layout.simple = false;
    }

    if (advancedLayout.checked === true) {
      opt.layout.advanced = true;
    } else {
      opt.layout.advanced = false;
    }

    try {
      __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].store(opt.layout, opt.updateStatusMessage("Layout saved."));
    } catch (e) {
      console.log("Chrome storage sync set Exception: ");
      console.log(e);
      return false;
    }

    return true;
  };

  /**
   * Update form input to match user's mimeType preference
   * @param {object} fullMimeType Object representing user's mimeType preference
   */
  opt.setFullMimeType = function (fullMimeType) {
    var fullMimeTypeElement = document.getElementById("full-mime-types");
    if (fullMimeType.retrieveFullMimeType === true) {
      fullMimeTypeElement.checked = true;
    } else {
      fullMimeTypeElement.checked = false;
    }
    return;
  };

  /**
   * Persist user's mimeType preference to storage
   * @return {Promise} Promise represents result of storage action
   */
  opt.saveFullMimeType = function () {
    var isChecked = document.getElementById("full-mime-types").checked;

    if (isChecked === true) {
      opt.fullMimeType.retrieveFullMimeType = true;
    } else {
      opt.fullMimeType.retrieveFullMimeType = false;
    }

    try {
      __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].store(opt.fullMimeType, opt.updateStatusMessage("Full mime type saved."));
    } catch (e) {
      console.log("Chrome storage sync set Exception: ");
      console.log(e);
      return false;
    }
  };

  opt.updateStatusMessage = function (message) {
    var status = document.getElementById("status");

    status.classList.add("alert", "alert-success");
    status.classList.remove("hidden");
    status.textContent = message;
    status.style.top = 0;

    setTimeout(function () {
      status.textContent = "";
      status.classList.remove("alert", "alert-success");
      status.classList.add("hidden");
    }, 1500);
  };

  opt.getFullMimeType = function () {
    return __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].retrieve(opt.fullMimeType);
  };

  opt.getLayout = function () {
    return __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].retrieve(opt.layout);
  };

  opt.getAutoClose = function () {
    return __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].retrieve(opt.autoClose);
  };

  /*
   *
   * Save user's mimetype prefences to local storage
   *
   *
   */
  opt.saveMimeSettings = function (evt) {
    evt.preventDefault();

    for (var i = 0; i < opt.numOfmimeTypes; i++) {
      var settings = document.getElementsByName(opt.mimeTypes[i]);

      for (var x = 0; x < opt.numOftabActions; x++) {
        if (settings[x].checked) {
          opt.mimeSettings[opt.mimeTypes[i]] = opt.tabActions[x];
        }
      }
    }

    try {
      __WEBPACK_IMPORTED_MODULE_0__browser_js__["browser"].store(opt.mimeSettings, opt.updateStatusMessage("Mime settings saved"));
    } catch (e) {
      console.log("Chrome storage sync set Exception: ");
      console.log(e);
      return false;
    }

    return true;
  };

  return opt;
}();

/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__popup_js__ = __webpack_require__(9);

/* Setup extension popup*/



document.addEventListener("DOMContentLoaded", function () {
  __WEBPACK_IMPORTED_MODULE_0__popup_js__["popup"].init();
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (var key in changes) {
    if (changes.hasOwnProperty("key")) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' + 'Old value was "%s", new value is "%s".', key, namespace, storageChange.oldValue, storageChange.newValue);
    }
  }
});

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(11);
__webpack_require__(0);
module.exports = __webpack_require__(9);


/***/ })
/******/ ]);