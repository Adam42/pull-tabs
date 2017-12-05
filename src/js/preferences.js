import storage from "./storage.js";
import { keys } from "./keys.js";

/**
 * User preferences storage and retrieval
 */
export default class Preferences {
  constructor() {}

  static get(key) {
    let preference = keys.preferences[key];
    return storage.retrieve(preference);
  }
}
