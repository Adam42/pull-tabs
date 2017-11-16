import PocketProvider from "./Pocket.js";
import BookmarkProvider from "./Bookmark.js";
import CloseProvider from "./Close.js";
import DownloadProvider from "./Download.js";

/**
 * Helps instantiate ServiceProviders
 */
export default class ServiceFactory {
  constructor() {
    //Set up listing of potential providers
    this.providers = {
      PocketProvider,
      BookmarkProvider,
      CloseProvider,
      DownloadProvider
    };
  }

  /**
   * Duplicates the prop setting in the constructor statically
   * so we can reference providers statically
   * @return {object} Object where keys are the classes for Service Providers we might need
   */
  static getProviders() {
    return {
      PocketProvider,
      BookmarkProvider,
      CloseProvider,
      DownloadProvider
    };
  }

  /**
   * Takes a text action and returns its provider
   * @param  {string} action An action taken on a tab or tabs
   * @return {Class}        Returns a class of that service provider
   */
  static convertActionToProvider(action) {
    let name =
      action.charAt(0).toUpperCase() +
      action.slice(1).toLowerCase() +
      "Provider";

    let providers = ServiceFactory.getProviders();

    return providers[name];
  }
}
