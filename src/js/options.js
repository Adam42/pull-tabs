"use strict";
import { PocketAPILayer } from "./pocket.js";
import { messageManager } from "./message.js";
import UI from "./ui.js";
import capitalize from "./helpers.js";
import storage from "./storage.js";
import { keys } from "./keys.js";

/**
 * Settings/preferences interface for a user to save
 * things like Pocket login, layout options and other settings
 *
 * @return {[type]} [description]
 */
export var options =
  options ||
  (function() {
    var opt = {};

    //list of mimetypes we'll act on
    opt.mimeTypes = [
      "application",
      "image",
      "message",
      "model",
      "multipart",
      "text",
      "video",
      "unknown"
    ];
    opt.numOfmimeTypes = opt.mimeTypes.length;

    opt.mimeSettings = {};
    opt.fullMimeType = {
      retrieveFullMimeType: false
    };

    opt.numOftabActions = keys.preferences.tabActions.length;

    //create a default preferences object to pass to restoreOptions
    //in case there is no existing preferences stored or
    //if stored preferences can't be retrieved will use this default
    function setDefaultMimeTypes() {
      opt.mimeTypes.forEach(function(element) {
        opt.mimeSettings[element] = keys.preferences.tabActions[0];
      }, opt);
    }

    function createOptionsForm() {
      var optionsForm = document.getElementById("file-type-destinations");

      for (var i = 0; i < opt.numOfmimeTypes; i++) {
        let mimeType = opt.mimeTypes[i];

        var panel = document.createElement("div");
        panel.setAttribute("class", "panel panel-default row");

        var headerDiv = document.createElement("div");
        headerDiv.setAttribute("class", "panel-heading col-md-2");

        var header = document.createElement("h4");
        header.textContent = capitalize(mimeType);

        headerDiv.appendChild(header);
        panel.appendChild(headerDiv);

        let radioInputs = createRadioInputs(mimeType);
        panel.appendChild(radioInputs);

        optionsForm.appendChild(panel);
      }
    }

    function createRadioInputs(name) {
      let div = document.createElement("div");
      div.setAttribute("class", "panel-body col-md-10");

      for (var x = 0; x < opt.numOftabActions; x++) {
        let label = document.createElement("label");
        let input = document.createElement("input");
        let action = keys.preferences.tabActions[x];

        input.type = "radio";
        input.id = action;
        input.name = name;
        input.value = action;

        let span = document.createElement("span");
        span.textContent = capitalize(action);

        label.appendChild(input);
        label.appendChild(span);
        div.appendChild(label);
      }

      return div;
    }

    /**
     * Create a checkbox element for services
     * @param  {[type]} name [description]
     * @return {HTMLButtonElement} [description]
     */
    function addServiceCheckBox(name, form) {
      let body = document.createElement("div");
      body.setAttribute("class", "panel-body col-md-8");
      let input = document.createElement("input");
      input.type = "checkbox";
      input.name = "service-checkbox";
      input.id = name;
      input.title = name;
      input.value = keys.preferences.services[name];
      input.checked =
        String(keys.preferences.services[name]) === "enabled" ? true : false;

      let label = document.createElement("label");
      label.setAttribute("for", name);
      label.insertAdjacentHTML(
        "beforeEnd",
        capitalize(name.substring("service_".length))
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
        .getElementById("pocket-status")
        .addEventListener("click", PocketAPILayer.checkLink);
      document
        .getElementById("preference-input-full-mime-types")
        .addEventListener("click", opt.saveFullMimeType);
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
      document
        .getElementById("preference-settings")
        .addEventListener("submit", opt.saveMimeSettings);
      document.getElementsByName("service-checkbox").forEach(function(elem) {
        elem.addEventListener("click", opt.saveServices);
      });
    }

    opt.init = function() {
      bindUIActions();

      setDefaultMimeTypes();

      createOptionsForm();
      createServicesForm();

      bindGeneratedUI();

      this.restoreMimeSettings().then(opt.setMimeSettings);
      this.restoreServices().then(opt.setServices);

      UI.getLayout().then(function(layout) {
        options.setLayout(layout);
      });

      this.getAutoClose().then(options.setAutoClose);

      this.getFullMimeType()
        .then(function(fullMimeType) {
          options.setFullMimeType(fullMimeType);
        })
        .catch(function(e) {
          console.log(e);
        });

      PocketAPILayer.checkLocalLoginStatus();
    };

    opt.getMimeTypes = function() {
      return opt.mimeSettings;
    };

    opt.getMimeSettings = function() {
      return opt.mimeSettings;
    };

    opt.restoreMimeSettings = function() {
      return storage.retrieve(opt.mimeSettings);
    };

    opt.restoreServices = function() {
      return storage.retrieve(keys.preferences.services);
    };

    /**
    * Loop through available mimeTypes and apply user's
    * stored action preferences for each mime Type.
    * @param {[type]} items [description]
    */
    opt.setMimeSettings = function(items) {
      for (var i = 0; i < opt.numOfmimeTypes; i++) {
        var settings = document.getElementsByName(opt.mimeTypes[i]);

        var setting = items[opt.mimeTypes[i]];

        for (var x = 0; x < settings.length; x++) {
          if (settings[x].id === setting) {
            opt.mimeSettings[opt.mimeTypes[i]] = settings[x].id;
            settings[x].checked = true;
          } else {
            settings[x].checked = false;
          }
        }
      }
    };

    opt.setServices = function(services) {
      services = Object.entries(services);
      let num = services.length;

      for (var i = 0; i < num; i++) {
        let service = services[i];
        let name = service[0];
        let value = service[1];
        let serviceInput = document.getElementById(name);

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
     *
     * @return {Promise} Promise represents storage update result
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
      let simpleCheckbox = document.getElementById("preference-input-simple");
      let advancedCheckbox = document.getElementById(
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

    /**
     * Update form input to match user's mimeType preference
     * @param {object} fullMimeType Object representing user's mimeType preference
     */
    opt.setFullMimeType = function(fullMimeType) {
      var fullMimeTypeElement = document.getElementById(
        "preference-input-full-mime-types"
      );
      if (fullMimeType.retrieveFullMimeType === true) {
        fullMimeTypeElement.checked = true;
      } else {
        fullMimeTypeElement.checked = false;
      }
      return;
    };

    /**
     * Persist user's mimeType preference to storage
     * @return {Promise} Promise represents result of storage action
     */
    opt.saveFullMimeType = function() {
      var isChecked = document.getElementById(
        "preference-input-full-mime-types"
      ).checked;

      if (isChecked === true) {
        opt.fullMimeType.retrieveFullMimeType = true;
      } else {
        opt.fullMimeType.retrieveFullMimeType = false;
      }

      opt.storeOption(opt.fullMimeType, "Full mime type");
    };

    opt.getFullMimeType = function() {
      return storage.retrieve(opt.fullMimeType);
    };

    opt.getAutoClose = function() {
      return storage.retrieve(keys.preferences.autoClose);
    };

    /*
     *
     * Save user's mimetype prefences to local storage
     *
     *
     */
    opt.saveMimeSettings = function(evt) {
      evt.preventDefault();

      for (var i = 0; i < opt.numOfmimeTypes; i++) {
        var settings = document.getElementsByName(opt.mimeTypes[i]);

        for (var x = 0; x < opt.numOftabActions; x++) {
          if (settings[x].checked) {
            opt.mimeSettings[opt.mimeTypes[i]] = keys.preferences.tabActions[x];
          }
        }
      }

      opt.storeOption(opt.mimeSettings, "Mime settings");
    };

    /**
     * Display an overlay on the whole screen to prevent user input
     *
     */
    opt.enableOverlay = function() {
      let overlay = document.getElementById("overlay");
      overlay.style.display = "block";
    };

    /**
     * Remove the overlay thus allowing user input again
     */
    opt.disableOverlay = function() {
      let overlay = document.getElementById("overlay");
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
     * @return {[type]}     [description]
     */
    opt.saveServices = function(evt) {
      let target = evt.target;
      let name = target.htmlFor ? target.htmlFor : target.id;
      target.value = target.checked ? "enabled" : "disabled";

      if (keys.preferences.services.hasOwnProperty(name)) {
        let serviceObj = {};
        serviceObj[name] = target.value;
        opt.storeOption(serviceObj, "Services");
      }

      target.checked = target.value == "enabled" ? true : false;
    };

    return opt;
  })();
