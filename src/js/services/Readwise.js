import ServiceProvider from "./ServiceProvider.js";
import credentials from "./credentials.js";

const READWISE_SAVE = "https://readwise.io/api/v3/save/";

/**
 * Saves tabs to Readwise Reader.
 *
 * No bulk endpoint (50 req/min is ample for one window), so saves go per-tab
 * through `UI.doActionToTabForTabs`.
 */
export default class ReadwiseProvider extends ServiceProvider {
  /**
   * Save a single tab to Readwise Reader.
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves with the created document response body
   * @throws {Error} If the tab is invalid, credentials are missing, or the save fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const token = await this.getToken();

      const response = await fetch(READWISE_SAVE, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: tab.url, title: tab.title.toString() }),
      });

      if (!response.ok) {
        throw new Error(ReadwiseProvider.mapError(response.status));
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Readwise failed: ${error.message}`);
    }
  }

  /**
   * Read the stored Readwise token or throw if unconfigured.
   * @return {Promise<string>} The token
   * @throws {Error} If no token is stored
   */
  // eslint-disable-next-line class-methods-use-this -- reads shared credential store, no instance state
  async getToken() {
    const creds = await credentials.get("readwise");
    if (!creds.token) {
      throw new Error("Readwise is not configured");
    }
    return creds.token;
  }

  /**
   * Map an HTTP status code to a user-facing hint.
   * @param  {number} status HTTP status code
   * @return {string} Human-readable error message
   */
  static mapError(status) {
    if (status === 401) {
      return "Check your Readwise token in Options";
    }
    return `Readwise returned status ${status}`;
  }
}
