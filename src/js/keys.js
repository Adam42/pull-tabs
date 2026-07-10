import ServiceFactory from "./services/ServiceFactory.js";
import { AUTO_CLOSE } from "./storageKeys.js";

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
keys.preferences.autoClose = AUTO_CLOSE;

//list of available actions to apply to a tab
const actions = ServiceFactory.getActions();

//ignore is always needed as a non-action
//and thus not able to be disabled by the user
actions.unshift("ignore");

keys.preferences.tabActions = actions;
keys.preferences.tabOptions = ["disabled", "enabled"];

/**
 * Services that require user-pasted credentials and stay disabled until the
 * user verifies them in the options page "Connected services" section. Their
 * `service_<action>` flag defaults to "disabled" (unlike the built-in
 * actions, which default to "enabled").
 * @type {string[]}
 */
export const CREDENTIAL_GATED = [
  "raindrop",
  "instapaper",
  "readwise",
  "webhook",
];

/**
 * The list of possible services
 * under a "service_$ServiceActionName" key
 * for instance:
 * {
 *   service_download: "enabled",
 *   service_bookmark: "enabled",
 *   service_close: "enabled"
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
  // eslint-disable-next-line guard-for-in -- actions is a plain object literal; Phase 2-4 cleanup
  for (const action in actions) {
    const name = actions[action];
    keys.preferences.services["service_" + name] = CREDENTIAL_GATED.includes(
      name,
    )
      ? keys.preferences.tabOptions[0]
      : keys.preferences.tabOptions[1];
  }
}

setDefaultServices();
