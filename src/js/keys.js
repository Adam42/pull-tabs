import ServiceFactory from "./services/ServiceFactory.js";

export const keys = [];

keys.preferences = [];

keys.preferences.layout = {
  simple: "true",
  advanced: "false"
};

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

function setDefaultServices() {
  for (let action in actions) {
    let name = actions[action];
    keys.preferences.services["service_" + name] =
      keys.preferences.tabOptions[0];
  }
}
setDefaultServices();
