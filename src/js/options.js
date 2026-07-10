"use strict";
import { messageManager } from "./message.js";
import UI from "./ui.js";
import capitalize from "./helpers.js";
import storage from "./storage.js";
import { CREDENTIAL_GATED, keys } from "./keys.js";
import credentials from "./services/credentials.js";

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
          // Credential-gated services get no generic checkbox — they are
          // managed only in the "Connected services" section, so the sole
          // enable path is a successful Verify (no bypass).
          const action = service.substring("service_".length);
          if (!CREDENTIAL_GATED.includes(action)) {
            addServiceCheckBox(service, servicesForm);
          }
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

      opt.renderConnectedServices();

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

        // Credential-gated services have no generated checkbox; guard so we
        // never dereference a null input.
        if (serviceInput && String(value) === "enabled") {
          serviceInput.checked = true;
          serviceInput.value = "enabled";
        } else if (serviceInput) {
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

    /**
     * Read the credential input(s) for a gated service into a plain object.
     * @param  {string} service Gated service name
     * @return {object} Credential object matching the service's shape
     */
    function readCredentialInputs(service) {
      if (service === "raindrop") {
        return { token: document.getElementById("raindrop-token").value.trim() };
      }
      if (service === "instapaper") {
        return {
          username: document.getElementById("instapaper-username").value.trim(),
          password: document.getElementById("instapaper-password").value,
        };
      }
      if (service === "readwise") {
        return { token: document.getElementById("readwise-token").value.trim() };
      }
      // webhook
      return { url: document.getElementById("webhook-url").value.trim() };
    }

    /**
     * Prefill a gated service's input(s) from stored credentials.
     * @param  {string} service Gated service name
     * @param  {object} creds   Stored credential object
     */
    function fillCredentialInputs(service, creds) {
      if (service === "raindrop") {
        document.getElementById("raindrop-token").value = creds.token || "";
      } else if (service === "instapaper") {
        document.getElementById("instapaper-username").value =
          creds.username || "";
        document.getElementById("instapaper-password").value =
          creds.password || "";
      } else if (service === "readwise") {
        document.getElementById("readwise-token").value = creds.token || "";
      } else if (service === "webhook") {
        document.getElementById("webhook-url").value = creds.url || "";
      }
    }

    /**
     * Update the status text/style for a gated service.
     * @param  {string} service Gated service name
     * @param  {string} text    Status text
     * @param  {string} state   "connected", "disconnected", or "error"
     */
    function setServiceStatus(service, text, state) {
      const status = document.getElementById("status-" + service);
      if (status) {
        status.textContent = text;
        status.className = "connected-service-status " + state;
      }
    }

    /**
     * Wire up the "Connected services" section: prefill inputs, reflect
     * current enabled state, and bind Verify/Disconnect buttons.
     */
    opt.renderConnectedServices = function() {
      CREDENTIAL_GATED.forEach(function(service) {
        const verifyButton = document.getElementById("verify-" + service);
        const disconnectButton = document.getElementById(
          "disconnect-" + service
        );

        if (!verifyButton) {
          // Section markup absent (e.g. isolated test) — nothing to wire.
          return;
        }

        verifyButton.addEventListener("click", function() {
          opt.verifyService(service);
        });

        if (disconnectButton) {
          disconnectButton.addEventListener("click", function() {
            opt.disconnectService(service);
          });
        }

        credentials.get(service).then(function(creds) {
          fillCredentialInputs(service, creds);
        });

        storage
          .retrieve(keys.preferences.services)
          .then(function(services) {
            const enabled =
              String(services["service_" + service]) === "enabled";
            setServiceStatus(
              service,
              enabled ? "Connected" : "Not connected",
              enabled ? "connected" : "disconnected"
            );
          });
      });
    };

    /**
     * Verify a gated service's credentials; on success store them and enable
     * the service, on failure keep it disabled and surface a status code.
     * @param  {string} service Gated service name
     */
    /**
     * Persist a gated service's flag as disabled, hiding it in both popup
     * layouts. Used on verification failure so a previously enabled service
     * (e.g. one whose token was revoked) does not stay visible.
     * @param  {string} service Gated service name
     * @return {Promise} Resolves once the flag is stored
     */
    function disableGatedService(service) {
      const serviceObj = {};
      serviceObj["service_" + service] = "disabled";
      return storage.store(serviceObj);
    }

    /**
     * Handle a failed verification: disable the service (so a stale, revoked
     * credential can't leave it enabled), surface a message, and re-enable
     * input.
     * @param  {string} service Gated service name
     * @param  {string} message Human-readable failure message
     */
    function handleVerifyFailure(service, message) {
      disableGatedService(service).then(function() {
        setServiceStatus(service, "Verification failed", "error");
        messageManager.updateStatusMessage(message, "medium", "danger");
        opt.disableOverlay();
      });
    }

    opt.verifyService = function(service) {
      const creds = readCredentialInputs(service);

      opt.enableOverlay();

      credentials
        .verify(service, creds)
        .then(function(valid) {
          if (!valid) {
            handleVerifyFailure(
              service,
              capitalize(service) + " verification failed"
            );
            return;
          }

          credentials.set(service, creds).then(function() {
            const serviceObj = {};
            serviceObj["service_" + service] = "enabled";
            opt.storeOption(serviceObj, capitalize(service));
            setServiceStatus(service, "Connected", "connected");
          });
        })
        .catch(function(error) {
          handleVerifyFailure(service, "Error: " + error.message);
        });
    };

    /**
     * Disconnect a gated service: clear its credentials and disable it.
     * @param  {string} service Gated service name
     */
    opt.disconnectService = function(service) {
      credentials.clear(service).then(function() {
        fillCredentialInputs(service, {});
        const serviceObj = {};
        serviceObj["service_" + service] = "disabled";
        opt.storeOption(serviceObj, capitalize(service));
        setServiceStatus(service, "Not connected", "disconnected");
      });
    };

    return opt;
  })();
