import ServiceProvider from "./ServiceProvider.js";
import credentials, { basicAuth } from "./credentials.js";

const INSTAPAPER_ADD = "https://www.instapaper.com/api/add";

/**
 * Saves tabs to Instapaper via its simple `add` endpoint.
 *
 * Instapaper has no bulk endpoint, so saves go per-tab through
 * `UI.doActionToTabForTabs` (no `doActionToTabs` override). Basic-Auth
 * password may be empty — many accounts have none.
 */
export default class InstapaperProvider extends ServiceProvider {
  /**
   * Save a single tab to Instapaper.
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves once the tab is saved
   * @throws {Error} If the tab is invalid, credentials are missing, or the save fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const creds = await this.getCredentials();

      const body = new URLSearchParams();
      body.set("url", tab.url);
      body.set("title", tab.title.toString());

      const response = await fetch(INSTAPAPER_ADD, {
        method: "POST",
        headers: {
          Authorization: basicAuth(creds.username, creds.password),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (response.status !== 201) {
        throw new Error(InstapaperProvider.mapError(response.status));
      }

      return response.status;
    } catch (error) {
      throw new Error(`Instapaper failed: ${error.message}`);
    }
  }

  /**
   * Read the stored Instapaper credentials or throw if unconfigured.
   * @return {Promise<object>} `{username, password}`
   * @throws {Error} If no username is stored
   */
  // eslint-disable-next-line class-methods-use-this -- reads shared credential store, no instance state
  async getCredentials() {
    const creds = await credentials.get("instapaper");
    if (!creds.username) {
      throw new Error("Instapaper is not configured");
    }
    return creds;
  }

  /**
   * Map an HTTP status code to a user-facing hint.
   * @param  {number} status HTTP status code
   * @return {string} Human-readable error message
   */
  static mapError(status) {
    if (status === 403) {
      return "Check your Instapaper credentials in Options";
    }
    return `Instapaper returned status ${status}`;
  }
}
