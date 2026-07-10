import ServiceProvider from "./ServiceProvider.js";
import credentials from "./credentials.js";

const RAINDROP_SINGLE = "https://api.raindrop.io/rest/v1/raindrop";
const RAINDROP_BULK = "https://api.raindrop.io/rest/v1/raindrops";
const CHUNK_SIZE = 100;

/**
 * Saves tabs to Raindrop.io as bookmarks (raindrops).
 *
 * The first true bulk provider besides Clipboard: `doActionToTabs` posts to
 * the plural endpoint in chunks of 100 and reports chunk-level partial
 * results so a mid-run failure doesn't mis-report already-saved tabs.
 */
export default class RaindropProvider extends ServiceProvider {
  /**
   * Save a single tab to Raindrop.
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves with the created raindrop response body
   * @throws {Error} If the tab is invalid, credentials are missing, or the save fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const token = await this.getToken();
      const response = await fetch(RAINDROP_SINGLE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          link: tab.url,
          title: tab.title.toString(),
          pleaseParse: {},
        }),
      });

      if (!response.ok) {
        throw new Error(RaindropProvider.mapError(response.status));
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Raindrop failed: ${error.message}`);
    }
  }

  /**
   * Save every tab to Raindrop in bulk, chunked at 100 per request.
   *
   * Chunks fire concurrently via `Promise.allSettled`; each settled result is
   * mapped back to that chunk's tabs so callers can apply per-tab feedback and
   * autoclose only to tabs that actually saved.
   *
   * @return {Promise<{succeeded: object[], failed: object[]}>} Partitioned tabs
   * @throws {Error} If credentials are missing or a tab is invalid
   */
  async doActionToTabs() {
    this.tabs.forEach((tab) => ServiceProvider.validateTab(tab));
    const token = await this.getToken();

    const chunks = [];
    for (let i = 0; i < this.tabs.length; i += CHUNK_SIZE) {
      chunks.push(this.tabs.slice(i, i + CHUNK_SIZE));
    }

    const settled = await Promise.allSettled(
      chunks.map((chunk) => RaindropProvider.saveChunk(chunk, token)),
    );

    const succeeded = [];
    const failed = [];
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        succeeded.push(...chunks[i]);
      } else {
        failed.push(...chunks[i]);
      }
    });

    return { succeeded, failed };
  }

  /**
   * POST one chunk of tabs to the bulk raindrops endpoint.
   * @param  {object[]} chunk Up to 100 browser tab objects
   * @param  {string} token   Raindrop bearer token
   * @return {Promise} Resolves with the response body on success
   * @throws {Error} If the request fails
   */
  static async saveChunk(chunk, token) {
    const items = chunk.map((tab) => ({
      link: tab.url,
      title: tab.title.toString(),
      pleaseParse: {},
    }));

    const response = await fetch(RAINDROP_BULK, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(RaindropProvider.mapError(response.status));
    }

    return response.json();
  }

  /**
   * Read the stored Raindrop token or throw if unconfigured.
   * @return {Promise<string>} The bearer token
   * @throws {Error} If no token is stored
   */
  // eslint-disable-next-line class-methods-use-this -- reads shared credential store, no instance state
  async getToken() {
    const creds = await credentials.get("raindrop");
    if (!creds.token) {
      throw new Error("Raindrop is not configured");
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
      return "Check your Raindrop token in Options";
    }
    if (status === 429) {
      return "Raindrop rate limit — try again shortly";
    }
    return `Raindrop returned status ${status}`;
  }
}
