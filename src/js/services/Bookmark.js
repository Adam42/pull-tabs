import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";

/**
 * Provides bookmarking actions to tabs
 */
export default class BookmarkProvider extends ServiceProvider {
  constructor(tabs) {
    super(tabs);
  }

  doActionToTab(tab) {
    return this.bookmarkTab(tab);
  }

  doActionToTabs() {
    return this.bookmarkTabs(this.tabs);
  }

  /**
     * Bookmark collection of tabs
     * @param  {array} tabs Collection of tab objects
     */
  bookmarkTabs(tabs) {
    var numTabs = tabs.length;
    var i;
    for (i = 0; i < numTabs; i++) {
      return this.bookmarkTab(tabs[i]);
    }
  }

  /**
     * Bookmark a single tab
     * @param  {object}   tab      A browser tab object
     * @return {Promise}            Returns a promise representing result of bookmarking
     */
  bookmarkTab(tab) {
    var bookmark = {
      parentId: localStorage["pullTabsFolderId"],
      title: tab.title.toString(),
      url: tab.url
    };

    return browser.bookmarks.create(bookmark);
  }
}
