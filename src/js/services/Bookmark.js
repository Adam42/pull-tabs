import ServiceProvider from "./ServiceProvider.js";

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
  // eslint-disable-next-line class-methods-use-this -- worker calls browser.* only, no instance state
  bookmarkTab(tab) {
    const bookmark = {
      parentId: localStorage["pullTabsFolderId"],
      title: tab.title.toString(),
      url: tab.url,
    };

    return browser.bookmarks.create(bookmark);
  }
}
