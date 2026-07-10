import ServiceProvider from "./ServiceProvider.js";
import storage from "../storage.js";
import { PULLTABS_FOLDER_ID } from "../storageKeys.js";

/**
 * Provides bookmarking actions to tabs
 */
export default class BookmarkProvider extends ServiceProvider {
  /**
   * Bookmark a single tab
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves with the created bookmark node
   * @throws {Error} If the tab is invalid or bookmarking fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const result = await this.bookmarkTab(tab);
      return result;
    } catch (error) {
      throw new Error(`Bookmark failed: ${error.message}`);
    }
  }

  /**
   * Create a bookmark for a single tab
   * @param  {object} tab A browser tab object
   * @return {Promise} Promise representing the result of bookmarking
   */
  // eslint-disable-next-line class-methods-use-this -- reads storage + calls browser.*, no instance state
  async bookmarkTab(tab) {
    //Folder id now lives in browser.storage.local (Phase 7.1).
    const stored = await storage.retrieve(PULLTABS_FOLDER_ID);

    const bookmark = {
      parentId: stored[PULLTABS_FOLDER_ID],
      title: tab.title.toString(),
      url: tab.url,
    };

    return browser.bookmarks.create(bookmark);
  }
}
