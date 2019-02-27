import ServiceFactory from "./services/ServiceFactory.js";

export const keys = [];

keys.preferences = [];

/**
 * Layout preference key, determines which views to display in popup
 * @type {Object}
 */
keys.preferences.layout = {
  simple: "true",
  advanced: "false"
};

/**
 * User preference key for whether to close tabs after a successful action
 * @type {Object}
 */
keys.preferences.autoClose = {
  autoCloseTabs: false
};
keys.preferences.retrieveFullMimeType = false;

keys.preferences.services = {};

//list of available actions to apply to a tab
let actions = ServiceFactory.getActions();
actions.unshift("ignore");
keys.preferences.tabActions = actions;

keys.preferences.tabOptions = ["enabled", "disabled"];

/**
 * Creates a collection of services based on the action
 * string and sets a default state for each service
 */
function setDefaultServices() {
  for (let action in actions) {
    let name = actions[action];
    keys.preferences.services["service_" + name] =
      keys.preferences.tabOptions[0];
  }
}
setDefaultServices();
