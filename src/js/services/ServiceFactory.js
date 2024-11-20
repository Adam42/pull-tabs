import { Providers } from "./providers.js";
import capitalize from "../helpers.js";

/**
 * Helps instantiate ServiceProviders
 */
export default class ServiceFactory {
  constructor() {
    //Set up listing of potential providers
    this.providers = Providers;
  }

  /**
   * Get all available service providers
   * @return {Object<string, ServiceProvider>} Map of provider names to provider classes
   */
  static getProviders() {
    return Providers;
  }

  /**
   * Convert Providers into their action names
   * @return {string[]} Collection of provider actions
   */
  static getActions() {
    const providers = ServiceFactory.getProviders();

    return Object.keys(providers).map(key =>
      key.replace("Provider", "").toLowerCase()
    );
  }

  /**
   * Convert an action name to its corresponding provider
   * @param {string} action - An action taken on a tab or tabs
   * @throws {Error} If no provider is found for the given action
   * @return {ServiceProvider} The corresponding service provider class
   */
  static convertActionToProvider(action) {
    if (!action || typeof action !== 'string') {
      throw new TypeError('Action must be a non-empty string');
    }

    const name = `${capitalize(action)}Provider`;
    const providers = ServiceFactory.getProviders();

    if (!providers[name]) {
      throw new Error(`Provider for action "${action}" not found.`);
    }

    return providers[name];
  }
}
