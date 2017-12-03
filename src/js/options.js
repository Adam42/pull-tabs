"use strict";
import { browserUtils } from "./browser.js";
import { PocketAPILayer } from "./pocket.js";
import { messageManager } from "./message.js";
import UI from "./ui.js";
import ServiceFactory from "./services/ServiceFactory.js";
import capitalize from "./helpers.js";

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

    opt.services = {};

    opt.autoClose = {
      autoCloseTabs: false
    };

    //list of available actions to apply to a tab
    let actions = ServiceFactory.getActions();
    actions.unshift("ignore");
    opt.tabActions = actions;

    opt.tabOptions = ["enabled", "disabled"];

    opt.numOftabActions = opt.tabActions.length;

    //create a default preferences object to pass to restoreOptions
    //in case there is no existing preferences stored or
    //if stored preferences can't be retrieved will use this default
    function setDefaultMimeTypes() {
      opt.mimeTypes.forEach(function(element) {
        opt.mimeSettings[element] = this.tabActions[0];
      }, opt);
    }

    function setDefaultServices() {
      opt.tabActions.forEach(function(action) {
        opt.services[action] = this.tabOptions[0];
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
      let group = document.createElement("div");
      group.setAttribute("class", "panel-body col-md-10");

      for (var x = 0; x < opt.numOftabActions; x++) {
        let label = document.createElement("label");
        let input = document.createElement("input");
        let action = opt.tabActions[x];

        input.type = "radio";
        input.id = action;
        input.name = name;
        input.value = action;

        let span = document.createElement("span");
        span.textContent = capitalize(action);

        label.appendChild(input);
        label.appendChild(span);
        group.appendChild(label);
      }

      return group;
    }

    /**
     * Create a checkbox element for services
     * @param  {[type]} name [description]
     * @return {HTMLButtonElement} [description]
     */
    function createCheckBoxInput(name) {
      var input = document.createElement("input");
      input.type = "checkbox";
      input.id = name;
      input.title = name;
      input.value = opt.services[name];
      input.checked = String(opt.services[name]) === "enabled" ? true : false;

      let label = document.createElement("label");
      label.classList.add("checkbox");
      label.setAttribute("for", name);

      label.appendChild(input);
      label.insertAdjacentHTML("beforeEnd", capitalize(name));

      return label;
    }

    /**
     * Create the form for services and their enabled/disabled status.
     */
    function createServicesForm() {
      var servicesForm = document.getElementById("list-of-services");
      for (var service in opt.services) {
        if (opt.services.hasOwnProperty(service)) {
          let checkbox = createCheckBoxInput(service);
          servicesForm.appendChild(checkbox);
        }
      }
    }

    function bindUIActions() {
      document
        .getElementById("preference-settings")
        .addEventListener("submit", opt.saveMimeSettings);
      document
        .getElementById("preference-services")
        .addEventListener("click", opt.saveServices);
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

    opt.init = function() {
      bindUIActions();

      setDefaultMimeTypes();
      setDefaultServices();

      createOptionsForm();
      createServicesForm();

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
      return browserUtils.retrieve(opt.mimeSettings);
    };

    opt.restoreServices = function() {
      console.log("running");
      return browserUtils.retrieve(opt.services);
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
      var simple = document.getElementById("preference-input-simple");
      var advanced = document.getElementById("preference-input-advanced");
      if (String(layout.simple) == "true") {
        simple.checked = true;
      } else {
        simple.checked = false;
      }

      if (String(layout.advanced) == "true") {
        advanced.checked = true;
      } else {
        advanced.checked = false;
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
        opt.autoClose.autoCloseTabs = true;
      } else {
        opt.autoClose.autoCloseTabs = false;
      }

      opt.storeOption(opt.autoClose, "Autoclose");
    };

    /**
     * Persist user's layout preferences to storage
     * @return {Promise} Promise represents result of storage action
     */
    opt.saveLayout = function() {
      var simpleLayout = document.getElementById("preference-input-simple");
      var advancedLayout = document.getElementById("preference-input-advanced");

      if (!simpleLayout.checked && !advancedLayout.checked) {
        //We don't want to save the layout if both
        //are disabled so we early return
        return messageManager.updateStatusMessage(
          "Choose at least one layout",
          "short",
          "danger"
        );
      }

      UI.getLayout().then(function(layout) {
        if (simpleLayout.checked === true) {
          layout.simple = true;
        } else {
          layout.simple = false;
        }

        if (advancedLayout.checked === true) {
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
      return browserUtils.retrieve(opt.fullMimeType);
    };

    opt.getAutoClose = function() {
      return browserUtils.retrieve(opt.autoClose);
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
            opt.mimeSettings[opt.mimeTypes[i]] = opt.tabActions[x];
          }
        }
      }

      opt.storeOption(opt.mimeSettings, "Mime settings");
    };

    /**
     * Try to store an option and update the UI with
     * the result of the attempt
     * @param  {object} option      The object to be saved
     * @param  {string} displayText Human formatted name for the option
     */
    opt.storeOption = function(option, displayText) {
      browserUtils
        .store(option)
        .then(
          messageManager.updateStatusMessage(
            displayText + " saved.",
            "short",
            "success"
          )
        )
        .catch(err => {
          messageManager.updateStatusMessage(
            "Error:" + err.message,
            "medium",
            "danger"
          );
        });
    };

    /**
     * Save service providers status ( enabled/disabled )
     * @param  {[type]} evt [description]
     * @return {[type]}     [description]
     */
    opt.saveServices = function(evt) {
      evt.preventDefault();
      let target = evt.target;
      let name = target.htmlFor ? target.htmlFor : target.id;
      let service = document.getElementById(name);
      service.checked = !service.checked;
      service.value = service.checked ? "enabled" : "disabled";

      if (opt.services.hasOwnProperty(name)) {
        let serviceObj = {};
        serviceObj[name] = service.checked ? "enabled" : "disabled";

        opt.storeOption(serviceObj, "Services");
      }
    };

    return opt;
  })();
