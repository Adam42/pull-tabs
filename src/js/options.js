"use strict";
import { messageManager } from "./message.js";
import UI from "./ui.js";
import capitalize from "./helpers.js";
import storage from "./storage.js";
import { keys } from "./keys.js";

/**
 * Settings/preferences interface for a user to save
 * layout options, autoclose and which services are enabled.
 *
 * @return {[type]} [description]
 */
export var options =
  options ||
  (function() {
    var opt = {};

    /**
     * Create a checkbox element for services
     * @param  {[type]} name [description]
     * @param  {[type]} form [description]
     */
    function addServiceCheckBox(name, form) {
      const body = document.createElement("div");
      body.setAttribute("class", "panel-body col-md-8");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "service-checkbox";
      input.id = name;
      input.title = name;
      input.value = keys.preferences.services[name];
      input.checked =
        String(keys.preferences.services[name]) === "enabled";

      const label = document.createElement("label");
      label.setAttribute("for", name);
      label.insertAdjacentText(
        "beforeEnd",
        capitalize(name.substring("service_".length)).toString()
      );

      body.appendChild(input);
      body.appendChild(label);
      form.appendChild(body);
    }

    /**
     * Create the form for services and their enabled/disabled status.
     */
    function createServicesForm() {
      var servicesForm = document.getElementById("list-of-services");
      for (var service in keys.preferences.services) {
        if (keys.preferences.services.hasOwnProperty(service)) {
          addServiceCheckBox(service, servicesForm);
        }
      }
    }

    function bindUIActions() {
      document
        .getElementById("preference-input-simple")
        .addEventListener("click", opt.saveLayout);
      document
        .getElementById("preference-input-advanced")
        .addEventListener("click", opt.saveLayout);
      document
        .getElementById("preference-input-autoclose")
        .addEventListener("click", opt.saveAutoClose);
    }

    function bindGeneratedUI() {
      document.getElementsByName("service-checkbox").forEach(function(elem) {
        elem.addEventListener("click", opt.saveServices);
      });
    }

    opt.init = function() {
      bindUIActions();

      createServicesForm();

      bindGeneratedUI();

      this.restoreServices().then(opt.setServices);

      UI.getLayout().then(function(layout) {
        options.setLayout(layout);
      });

      this.getAutoClose().then(options.setAutoClose);
    };

    opt.restoreServices = function() {
      // A legacy disabled-service key from the removed read-later integration
      // may still linger in storage for existing users; it is intentionally
      // ignored (we restore using the current defaults object as keys, so any
      // stale key is never read) and not migrated.
      return storage.retrieve(keys.preferences.services);
    };

    opt.setServices = function(services) {
      services = Object.entries(services);
      const num = services.length;

      for (var i = 0; i < num; i++) {
        const service = services[i];
        const name = service[0];
        const value = service[1];
        const serviceInput = document.getElementById(name);

        if (String(value) === "enabled") {
          serviceInput.checked = true;
          serviceInput.value = "enabled";
        } else {
          serviceInput.checked = false;
          serviceInput.value = "disabled";
        }
      }
    };

    /**
     * Set form inputs to match layout enabled/disabled preference
     *
     * @param {object} layout - An object representing current layout setting
     */
    opt.setLayout = function(layout) {
      var simpleCheckbox = document.getElementById("preference-input-simple");
      var advancedCheckbox = document.getElementById(
        "preference-input-advanced"
      );

      if (String(layout.simple) == "true") {
        simpleCheckbox.checked = true;
      } else {
        simpleCheckbox.checked = false;
      }

      if (String(layout.advanced) == "true") {
        advancedCheckbox.checked = true;
      } else {
        advancedCheckbox.checked = false;
      }
    };

    /**
     * Set form input to match autoclose setting
     * @param {object} autoclose - Object storing user's autoclose preference
     */
    opt.setAutoClose = function(autoclose) {
      var autoCloseButton = document.getElementById(
        "preference-input-autoclose"
      );

      if (autoclose.autoCloseTabs === true) {
        autoCloseButton.checked = true;
      }
    };

    /**
     * Persist user's autoclose preference to storage
     */
    opt.saveAutoClose = function() {
      var autoCloseButton = document.getElementById(
        "preference-input-autoclose"
      );

      if (autoCloseButton.checked === true) {
        keys.preferences.autoClose.autoCloseTabs = true;
      } else {
        keys.preferences.autoClose.autoCloseTabs = false;
      }

      opt.storeOption(keys.preferences.autoClose, "Autoclose");
    };

    /**
     * Persist user's layout preferences to storage
     * @return {Promise} Promise represents result of storage action
     */
    opt.saveLayout = function() {
      const simpleCheckbox = document.getElementById("preference-input-simple");
      const advancedCheckbox = document.getElementById(
        "preference-input-advanced"
      );

      if (!simpleCheckbox.checked && !advancedCheckbox.checked) {
        //We don't want to save the layout if both
        //are disabled so we early return
        return messageManager.updateStatusMessage(
          "Choose at least one layout",
          "short",
          "danger"
        );
      }

      UI.getLayout().then(function(layout) {
        if (simpleCheckbox.checked === true) {
          layout.simple = true;
        } else {
          layout.simple = false;
        }

        if (advancedCheckbox.checked === true) {
          layout.advanced = true;
        } else {
          layout.advanced = false;
        }
        opt.storeOption(layout, "Layouts");
      });
    };

    opt.getAutoClose = function() {
      return storage.retrieve(keys.preferences.autoClose);
    };

    /**
     * Display an overlay on the whole screen to prevent user input
     *
     */
    opt.enableOverlay = function() {
      const overlay = document.getElementById("overlay");
      overlay.style.display = "block";
    };

    /**
     * Remove the overlay thus allowing user input again
     */
    opt.disableOverlay = function() {
      const overlay = document.getElementById("overlay");
      overlay.style.display = "none";
    };

    /**
     * Try to store an option and update the UI with
     * the result of the attempt
     * @param  {object} option      The object to be saved
     * @param  {string} displayText Human formatted name for the option
     */
    opt.storeOption = function(option, displayText) {
      opt.enableOverlay();

      storage
        .store(option)
        .then(() => {
          messageManager.updateStatusMessage(
            displayText + " saved.",
            "short",
            "success"
          );
          opt.disableOverlay();
        })
        .catch(err => {
          messageManager.updateStatusMessage(
            "Error:" + err.message,
            "medium",
            "danger"
          );
          opt.disableOverlay();
        });
    };

    /**
     * Save service providers status ( enabled/disabled )
     * @param  {[type]} evt [description]
     */
    opt.saveServices = function(evt) {
      const target = evt.target;
      const name = target.htmlFor ? target.htmlFor : target.id;
      target.value = target.checked ? "enabled" : "disabled";

      if (keys.preferences.services.hasOwnProperty(name)) {
        const serviceObj = {};
        serviceObj[name] = target.value;
        opt.storeOption(serviceObj, "Services");
      }

      target.checked = target.value == "enabled";
    };

    return opt;
  })();
