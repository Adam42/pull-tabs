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

/**
 * Preference key for whether to use additional HTTP requests
 * to get tabs again in order to determine their content-type
 * @type {Boolean}
 */
keys.preferences.retrieveFullMimeType = false;

//list of available actions to apply to a tab
let actions = ServiceFactory.getActions();

//ignore is always needed as a non-action
//and thus not able to be disabled by the user
actions.unshift("ignore");

keys.preferences.tabActions = actions;
keys.preferences.tabOptions = ["disabled", "enabled"];

/**
 * The list of possible services
 * under a "service_$ServiceActionName" key
 * for instance:
 * {
 *   service_download: "enabled",
 *   service_bookmark: "enabled",
 *   service_pocket: "disabled"
 *   etc...
 *  }
 * @type {Object}
 */
keys.preferences.services = {};

/**
 * Creates a collection of services based on the action
 * string and sets a default state for each service
 */
function setDefaultServices() {
  for (let action in actions) {
    let name = actions[action];
    keys.preferences.services["service_" + name] =
      keys.preferences.tabOptions[1];
  }
}

//Make this more dynamic but for now just disable the pocket service
//this just disables the service from the initial keys used to make
//the persistent service object so it only disables a service initially one time
function disableDefaultServices(service_name) {
  keys.preferences.services["service_" + service_name] =
    keys.preferences.tabOptions[0];
}

setDefaultServices();
disableDefaultServices("pocket");
