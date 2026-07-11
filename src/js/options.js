"use strict";
import { messageManager } from "./message.js";
import capitalize from "./helpers.js";
import storage from "./storage.js";
import { CREDENTIAL_GATED, keys } from "./keys.js";
import credentials from "./services/credentials.js";
import {
  READ_LATER_PROVIDERS,
  UI_ACTIONS,
  getActiveProvider,
  iconForAction,
  setActiveProvider,
} from "./saveAction.js";
import {
  DEFAULT_ACTION,
  DEFAULT_ACTION_VALUE,
  SERVICE_SAVE,
} from "./storageKeys.js";

/**
 * Options/preferences interface (0.21 "quiet paper" redesign).
 *
 * The old Simple/Advanced layout toggle is gone (there is one merged popup
 * model now). This page configures three things:
 *   1. Read-later service  — the single active provider the "Save" action
 *      targets (`readLaterProvider`), plus that provider's credentials.
 *   2. Pulling             — autoclose (unchanged pref) + default action.
 *   3. Actions             — which UI actions appear in the popup's chips and
 *      per-row pickers (`service_<action>` flags + the additive `service_save`).
 *
 * `ignore`/`service_ignore` and the read-later connection flags are never
 * rendered as Action chips.
 */
export var options =
  options ||
  (function () {
    var opt = {};

    // Storage-key for an Action chip: Save has its own flag, others service_<id>.
    function serviceKeyFor(actionId) {
      return actionId === "save" ? SERVICE_SAVE : "service_" + actionId;
    }

    // ------------------------------------------------------------------
    // Init + autoclose binding
    // ------------------------------------------------------------------

    function updateAutoCloseFlag(on) {
      const flag = document.getElementById("autoclose-flag");
      if (flag) {
        flag.textContent = "AUTOCLOSE " + (on ? "ON" : "OFF");
      }
    }

    function bindAutoClose() {
      const autoCloseInput = document.getElementById(
        "preference-input-autoclose",
      );
      if (!autoCloseInput) {
        return;
      }
      autoCloseInput.addEventListener("click", function () {
        opt.saveAutoClose();
        updateAutoCloseFlag(autoCloseInput.checked);
      });
    }

    opt.init = function () {
      bindAutoClose();

      opt.renderProviderPicker();
      opt.renderConnectedServices();
      opt.renderActionChips();
      opt.renderDefaultActionSelect();

      this.getAutoClose().then(function (autoclose) {
        options.setAutoClose(autoclose);
        updateAutoCloseFlag(autoclose.autoCloseTabs === true);
      });
    };

    // ------------------------------------------------------------------
    // Read-later provider picker
    // ------------------------------------------------------------------

    /**
     * Render the radio-row provider picker and reveal the active provider's
     * credential block. The active provider is the single "Save" target.
     * @return {Promise} Resolves once the picker is rendered
     */
    opt.renderProviderPicker = function () {
      const picker = document.getElementById("provider-picker");
      if (!picker) {
        return Promise.resolve();
      }
      return Promise.all([
        storage.retrieve(keys.preferences.services),
        getActiveProvider(),
      ]).then(function (results) {
        const services = results[0];
        const active = results[1];

        picker.textContent = "";
        READ_LATER_PROVIDERS.forEach(function (provider) {
          const isActive = provider.id === active;
          const connected =
            String(services["service_" + provider.id]) === "enabled";
          picker.appendChild(buildProviderRow(provider, isActive, connected));
        });

        opt.showActiveCredBlock(active);
      });
    };

    function buildProviderRow(provider, isActive, connected) {
      const row = document.createElement("div");
      row.className = "op-provider" + (isActive ? " active" : "");
      row.addEventListener("click", function () {
        opt.selectProvider(provider.id);
      });

      const radio = document.createElement("span");
      radio.className = "op-radio";

      const glyph = document.createElement("img");
      glyph.className = "op-prov-glyph";
      glyph.src = "img/" + provider.id + ".svg";
      glyph.alt = "";

      const main = document.createElement("div");
      main.className = "op-prov-main";

      const name = document.createElement("div");
      name.className = "op-prov-name";
      name.textContent = provider.name;
      if (isActive && connected) {
        const chip = document.createElement("span");
        chip.className = "chip on";
        chip.style.fontSize = "10px";
        chip.style.padding = "1px 7px";
        chip.textContent = "active";
        name.appendChild(document.createTextNode(" "));
        name.appendChild(chip);
      }

      const desc = document.createElement("div");
      desc.className = "meta";
      desc.textContent = provider.desc;

      main.appendChild(name);
      main.appendChild(desc);

      const ctl = document.createElement("span");
      if (isActive) {
        ctl.className = "op-prov-ctl";
      } else {
        ctl.className = "op-prov-ctl op-select-hint";
        ctl.textContent = "select";
      }

      row.appendChild(radio);
      row.appendChild(glyph);
      row.appendChild(main);
      row.appendChild(ctl);
      return row;
    }

    /**
     * Make a provider the sole active Save target and re-render.
     * @param {string} id Read-later provider id
     */
    opt.selectProvider = function (id) {
      setActiveProvider(id).then(function () {
        opt.renderProviderPicker();
        // The Save chip's glyph follows the active provider.
        opt.renderActionChips();
      });
    };

    /**
     * Show only the active provider's credential detail block.
     * @param {string} active Read-later provider id
     */
    opt.showActiveCredBlock = function (active) {
      CREDENTIAL_GATED.forEach(function (service) {
        const block = document.getElementById("cred-" + service);
        if (block) {
          block.classList.toggle("hidden", service !== active);
        }
      });
    };

    // ------------------------------------------------------------------
    // Action chips (which actions appear in the popup)
    // ------------------------------------------------------------------

    /**
     * Render the Action visibility chips: Save + the four built-ins. Never
     * ignore/service_ignore or a read-later connection flag.
     * @return {Promise} Resolves once the chips are rendered
     */
    opt.renderActionChips = function () {
      const container = document.getElementById("list-of-services");
      if (!container) {
        return Promise.resolve();
      }
      return Promise.all([
        storage.retrieve(keys.preferences.services),
        getActiveProvider(),
      ]).then(function (results) {
        const services = results[0];
        const provider = results[1];

        container.textContent = "";
        UI_ACTIONS.forEach(function (action) {
          const key = serviceKeyFor(action.id);
          const enabled = String(services[key]) === "enabled";

          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "rf-chip" + (enabled ? " on" : "");
          chip.setAttribute("data-action", action.id);
          chip.title = (enabled ? "Hide " : "Show ") + action.label;

          const img = document.createElement("img");
          img.src = "img/" + iconForAction(action.id, provider) + ".svg";
          img.alt = "";
          img.width = 15;
          img.height = 15;
          if (enabled) {
            img.style.filter = "brightness(0) invert(1)";
          }

          const label = document.createElement("span");
          label.textContent = action.label;

          chip.appendChild(img);
          chip.appendChild(label);
          chip.addEventListener("click", function () {
            opt.toggleAction(action.id, key);
          });
          container.appendChild(chip);
        });
      });
    };

    /**
     * Flip an action's visibility flag and re-render the chip row.
     * @param {string} actionId UI action id
     * @param {string} key      Its storage key
     */
    opt.toggleAction = function (actionId, key) {
      const query = {};
      // Read with the SAME default the chip was rendered from
      // (keys.preferences.services), not a hard-coded "disabled" — otherwise a
      // default-on chip on a fresh profile (nothing persisted yet) would read
      // back "disabled" and the first click would re-enable it instead of
      // turning it off.
      query[key] = keys.preferences.services[key];
      storage.retrieve(query).then(function (stored) {
        const nowEnabled = String(stored[key]) !== "enabled";
        const serviceObj = {};
        serviceObj[key] = nowEnabled ? "enabled" : "disabled";
        storage.store(serviceObj).then(function () {
          messageManager.updateStatusMessage(
            capitalize(actionId) + " saved.",
            "short",
            "success",
          );
          opt.renderActionChips();
        });
      });
    };

    // ------------------------------------------------------------------
    // Default action select
    // ------------------------------------------------------------------

    // Populate + bind the default-action <select>.
    opt.renderDefaultActionSelect = function () {
      const select = document.getElementById("preference-input-default-action");
      if (!select) {
        return Promise.resolve();
      }
      return storage
        .retrieve({ [DEFAULT_ACTION]: DEFAULT_ACTION_VALUE })
        .then(function (stored) {
          select.textContent = "";
          UI_ACTIONS.forEach(function (action) {
            const optionEl = document.createElement("option");
            optionEl.value = action.id;
            optionEl.textContent = action.label;
            select.appendChild(optionEl);
          });
          select.value = stored[DEFAULT_ACTION] || DEFAULT_ACTION_VALUE;

          select.addEventListener("change", function () {
            opt.storeOption(
              { [DEFAULT_ACTION]: select.value },
              "Default action",
            );
          });
        });
    };

    // ------------------------------------------------------------------
    // Autoclose (unchanged pref: preference-input-autoclose)
    // ------------------------------------------------------------------

    /**
     * Set form input to match autoclose setting
     * @param {object} autoclose - Object storing user's autoclose preference
     */
    opt.setAutoClose = function (autoclose) {
      var autoCloseButton = document.getElementById(
        "preference-input-autoclose",
      );

      if (autoCloseButton && autoclose.autoCloseTabs === true) {
        autoCloseButton.checked = true;
      }
    };

    /**
     * Persist user's autoclose preference to storage
     */
    opt.saveAutoClose = function () {
      var autoCloseButton = document.getElementById(
        "preference-input-autoclose",
      );

      if (autoCloseButton.checked === true) {
        keys.preferences.autoClose.autoCloseTabs = true;
      } else {
        keys.preferences.autoClose.autoCloseTabs = false;
      }

      opt.storeOption(keys.preferences.autoClose, "Autoclose");
    };

    opt.getAutoClose = function () {
      return storage.retrieve(keys.preferences.autoClose);
    };

    // ------------------------------------------------------------------
    // Overlay + persistence helpers
    // ------------------------------------------------------------------

    /**
     * Display an overlay on the whole screen to prevent user input
     */
    opt.enableOverlay = function () {
      const overlay = document.getElementById("overlay");
      if (overlay) {
        overlay.style.display = "block";
      }
    };

    /**
     * Remove the overlay thus allowing user input again
     */
    opt.disableOverlay = function () {
      const overlay = document.getElementById("overlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    };

    /**
     * Try to store an option and update the UI with
     * the result of the attempt
     * @param  {object} option      The object to be saved
     * @param  {string} displayText Human formatted name for the option
     */
    opt.storeOption = function (option, displayText) {
      opt.enableOverlay();

      storage
        .store(option)
        .then(() => {
          messageManager.updateStatusMessage(
            displayText + " saved.",
            "short",
            "success",
          );
          opt.disableOverlay();
        })
        .catch((err) => {
          messageManager.updateStatusMessage(
            "Error:" + err.message,
            "medium",
            "danger",
          );
          opt.disableOverlay();
        });
    };

    // ------------------------------------------------------------------
    // Credential connect/disconnect (unchanged wiring, preserved ids)
    // ------------------------------------------------------------------

    /**
     * Read the credential input(s) for a gated service into a plain object.
     * @param  {string} service Gated service name
     * @return {object} Credential object matching the service's shape
     */
    function readCredentialInputs(service) {
      if (service === "raindrop") {
        return {
          token: document.getElementById("raindrop-token").value.trim(),
        };
      }
      if (service === "instapaper") {
        return {
          username: document.getElementById("instapaper-username").value.trim(),
          password: document.getElementById("instapaper-password").value,
        };
      }
      if (service === "readwise") {
        return {
          token: document.getElementById("readwise-token").value.trim(),
        };
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
     * Wire up each read-later credential block: prefill inputs, reflect the
     * current connected state, and bind Connect/Sign out.
     */
    opt.renderConnectedServices = function () {
      CREDENTIAL_GATED.forEach(function (service) {
        const verifyButton = document.getElementById("verify-" + service);
        const disconnectButton = document.getElementById(
          "disconnect-" + service,
        );

        if (!verifyButton) {
          // Markup absent (e.g. isolated test) — nothing to wire.
          return;
        }

        verifyButton.addEventListener("click", function () {
          opt.verifyService(service);
        });

        if (disconnectButton) {
          disconnectButton.addEventListener("click", function () {
            opt.disconnectService(service);
          });
        }

        credentials.get(service).then(function (creds) {
          fillCredentialInputs(service, creds);
        });

        storage.retrieve(keys.preferences.services).then(function (services) {
          const enabled = String(services["service_" + service]) === "enabled";
          setServiceStatus(
            service,
            enabled ? "Connected" : "Not connected",
            enabled ? "connected" : "disconnected",
          );
        });
      });
    };

    /**
     * Persist a gated service's flag as disabled. Used on verification
     * failure so a previously connected service (e.g. one whose token was
     * revoked) does not stay connected.
     * @param  {string} service Gated service name
     * @return {Promise} Resolves once the flag is stored
     */
    function disableGatedService(service) {
      const serviceObj = {};
      serviceObj["service_" + service] = "disabled";
      return storage.store(serviceObj);
    }

    /**
     * Handle a failed verification: disable the service, surface a message,
     * and re-enable input.
     * @param  {string} service Gated service name
     * @param  {string} message Human-readable failure message
     */
    function handleVerifyFailure(service, message) {
      disableGatedService(service).then(function () {
        setServiceStatus(service, "Verification failed", "error");
        messageManager.updateStatusMessage(message, "medium", "danger");
        opt.disableOverlay();
        opt.renderProviderPicker();
      });
    }

    opt.verifyService = function (service) {
      const creds = readCredentialInputs(service);

      opt.enableOverlay();

      credentials
        .verify(service, creds)
        .then(function (valid) {
          if (!valid) {
            handleVerifyFailure(
              service,
              capitalize(service) + " verification failed",
            );
            return;
          }

          credentials.set(service, creds).then(function () {
            const serviceObj = {};
            serviceObj["service_" + service] = "enabled";
            opt.storeOption(serviceObj, capitalize(service));
            setServiceStatus(service, "Connected", "connected");
            opt.renderProviderPicker();
          });
        })
        .catch(function (error) {
          handleVerifyFailure(service, "Error: " + error.message);
        });
    };

    /**
     * Disconnect a gated service: clear its credentials and disable it.
     * @param  {string} service Gated service name
     */
    opt.disconnectService = function (service) {
      credentials.clear(service).then(function () {
        fillCredentialInputs(service, {});
        const serviceObj = {};
        serviceObj["service_" + service] = "disabled";
        opt.storeOption(serviceObj, capitalize(service));
        setServiceStatus(service, "Not connected", "disconnected");
        opt.renderProviderPicker();
      });
    };

    return opt;
  })();
