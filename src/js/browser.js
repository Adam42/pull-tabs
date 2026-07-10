"use strict";
import { messageManager } from "./message.js";
import { form } from "./form.js";
import storage from "./storage.js";
import { INITIAL_SETUP, PULLTABS_FOLDER_ID } from "./storageKeys.js";

//Make sure the browser namespace is set to something
//supported msBrowser is Edge, browser is Firefox/W3C, chrome is Google Chrome
if (typeof browser == "undefined") {
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
     *
     * Returns a promise so callers can await storage migration and
     * bookmark-folder discovery before rendering (see popup-init.js).
     */
  init: async function() {
    this.isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

    //One-time migration of the two legacy page-localStorage keys into
    //browser.storage.local (Phase 7.1). Each key is migrated independently so
    //a user who only has one of them still gets it moved.
    await this.migrateLocalStorageKey(PULLTABS_FOLDER_ID);
    await this.migrateLocalStorageKey(INITIAL_SETUP);

    //If we still don't have a pulltabs bookmark id saved, search for an
    //existing folder (or create one).
    const stored = await storage.retrieve(PULLTABS_FOLDER_ID);
    if (typeof stored[PULLTABS_FOLDER_ID] === "undefined") {
      const tree = await browser.bookmarks.getTree();
      //Await the full discovery→create→persist chain so init() does not
      //resolve (and the popup does not render) before pullTabsFolderId is
      //stored — otherwise an immediate bookmark could read undefined.
      await this.findPulltabsBookmarkFolder(tree);
    }
  },

  /**
     * Move a single legacy key from page localStorage to
     * browser.storage.local, but only if storage doesn't already have it.
     *
     * @param  {string} key - The key to migrate
     * @return {Promise} Resolves once migration has been attempted
     */
  migrateLocalStorageKey: async function(key) {
    //Service-worker/background contexts have no localStorage; guard for it.
    if (typeof localStorage === "undefined") {
      return;
    }

    const legacyValue = localStorage[key];
    if (typeof legacyValue === "undefined") {
      return;
    }

    const existing = await storage.retrieve(key);
    if (typeof existing[key] === "undefined") {
      await storage.store({ [key]: legacyValue });
    }
  },

  isChrome: function(){
    return (typeof window.chrome !== 'undefined');
  },

  isFile: function(pathname) {
    return (
      pathname
        .split("/")
        .pop()
        .split(".").length > 1
    );
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
      * @return {Promise} Resolves once the folder id has been persisted
      */
  findPulltabsBookmarkFolder: function(tree) {
    const root = tree?.[0];
    //Chrome/Firefox roots differ: prefer the second child
    //("Other bookmarks" / toolbar), fall back to the first
    const bookmarks = root?.children?.[1] ?? root?.children?.[0];
    if (!bookmarks) {
      return Promise.resolve();
    }

    //look for an existing bookmark folder called Pulltabs
    const existing = (bookmarks.children ?? []).find(
      child => child.title === "Pulltabs"
    );
    if (existing) {
      return this.saveBookmarkFolder(existing.id);
    }

    return this.createPulltabsBookmarkFolder({
      parentId: bookmarks.id,
      title: "Pulltabs"
    });
  },

  /**
   * Create the "Pulltabs" bookmark folder and persist its id.
   * @param  {object} folder - `{ parentId, title }` for the new folder
   * @return {Promise} Resolves once the created folder id has been persisted
   */
  createPulltabsBookmarkFolder: function(folder) {
    return browser.bookmarks
      .create(folder)
      .then(result => this.saveBookmarkFolder(result.id))
      .catch(err => {
        console.log("Creating bookmark failed" + err.message);
      });
  },

  /**
   * Save the id of the "pulltabs" folder to browser.storage.local
   * @param  {integer} id - Numeric id
   * @return {Promise} Resolves once the id has been persisted
   */
  saveBookmarkFolder: function(id) {
    return storage.store({ [PULLTABS_FOLDER_ID]: id });
  },

  /**
     * Convert a path to the fully qualified browser extension URL
     * @param  {string} path - A string to convert into a full URL
     * @return {[type]}     [description]
     */
  extensionGetURL: function(path) {
      return browser.runtime.getURL(path);
  }
};
