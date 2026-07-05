import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";

/**
 * Provides bookmarking actions to tabs
 */
export default class BookmarkProvider extends ServiceProvider {
  constructor(tabs) {
    super(tabs);
  }

  async doActionToTab(tab) {
    try {
      return await this.bookmarkTab(tab);
    } catch (error) {
      throw new Error(`Failed to bookmark tab: ${error.message}`);
    }
  }

  doActionToTabs() {
    return this.bookmarkTabs(this.tabs);
  }

  /**
   * Bookmark collection of tabs
   * @param  {array} tabs Collection of tab objects
   */
  bookmarkTabs(tabs) {
    this.forEachTabDo(tabs, this.bookmarkTab.call(this));
  }

  /**
   * Bookmark a single tab
   * @param  {object}   tab      A browser tab object
   * @return {Promise}            Returns a promise representing result of bookmarking
   */
  async bookmarkTab(tab) {
    if (!tab?.url || !tab?.title) {
      throw new Error("Tab is missing url or title");
    }

    const bookmark = {
      parentId: localStorage["pullTabsFolderId"],
      title: tab.title.toString(),
      url: tab.url,
    };

    return browser.bookmarks.create(bookmark);
  }
}
