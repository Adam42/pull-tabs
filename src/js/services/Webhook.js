import ServiceProvider from "./ServiceProvider.js";
import credentials from "./credentials.js";

/**
 * Sends tabs to a user-defined HTTPS webhook (Zapier/n8n/self-hosted).
 *
 * The host is user-defined, so no static `host_permissions` entry is possible;
 * delivery relies on the target endpoint's CORS. Saves go per-tab through
 * `UI.doActionToTabForTabs`. The payload schema is identical to the one used
 * by the Connected-services Verify test POST.
 */
export default class WebhookProvider extends ServiceProvider {
  /**
   * Send a single tab to the configured webhook.
   * @param  {object} tab A browser tab object
   * @return {Promise} Resolves once the endpoint accepts the POST
   * @throws {Error} If the tab is invalid, the URL is missing, or the POST fails
   */
  async doActionToTab(tab) {
    try {
      ServiceProvider.validateTab(tab);
      const url = await this.getUrl();

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tab.url, title: tab.title.toString() }),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }

      return response.status;
    } catch (error) {
      throw new Error(`Webhook failed: ${error.message}`);
    }
  }

  /**
   * Read the stored webhook URL or throw if unconfigured.
   * @return {Promise<string>} The webhook URL
   * @throws {Error} If no URL is stored
   */
  // eslint-disable-next-line class-methods-use-this -- reads shared credential store, no instance state
  async getUrl() {
    const creds = await credentials.get("webhook");
    if (!creds.url) {
      throw new Error("Webhook is not configured");
    }
    return creds.url;
  }
}
