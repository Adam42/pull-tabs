import ServiceProvider from "./ServiceProvider.js";
import { browserUtils } from "../browser.js";

/**
 * Provides bookmarking actions to tabs
 */
export default class BookmarkProvider extends ServiceProvider {
  async doActionToTab(tab) {
    try {
      return await this.bookmarkTab(tab);
    } catch (error) {
      throw new Error(`Failed to bookmark tab: ${error.message}`);
    }
  }

  /**
   * Bookmark a single tab
   * @param  {object}   tab      A browser tab object
   * @return {Promise}            Returns a promise representing result of bookmarking
   */
  // eslint-disable-next-line class-methods-use-this, require-await -- Phase 2-4: services-layer polish
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
