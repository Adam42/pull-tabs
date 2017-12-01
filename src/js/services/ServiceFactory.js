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
   * Duplicates the prop setting in the constructor statically
   * so we can reference providers statically
   * @return {object} Object where keys are the classes for Service Providers we might need
   */
  static getProviders() {
    return Providers;
  }

  /**
   * Converts Providers into their actions words
   * @return {array} Collection of provider actions
   */
  static getActions() {
    let providers = ServiceFactory.getProviders();
    let actions = [];

    for (var key in providers) {
      if (providers.hasOwnProperty(key)) {
        let action = key.replace("Provider", "").toLowerCase();
        actions.push(action);
      }
    }
    return actions;
  }

  /**
   * Takes a text action and returns its provider
   * @param  {string} action An action taken on a tab or tabs
   * @return {Class}        Returns a class of that service provider
   */
  static convertActionToProvider(action) {
    let name = capitalize(action) + "Provider";

    let providers = ServiceFactory.getProviders();

    return providers[name];
  }
}
