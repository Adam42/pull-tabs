"use strict";
import { browserUtils } from "./browser.js";
import { PocketAPILayer } from "./pocket.js";
import { messageManager } from "./message.js";
import UI from "./ui.js";

/**
 * Settings/preferences interface for a user to save
 * things like Pocket login, layout options and other settings
 *
 * @return {[type]} [description]
 */
export var options =
  options ||
  (function() {
    var tabSettings = {},
      opt = {};

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

    opt.autoClose = {
      autoCloseTabs: false
    };

    //list of available actions to apply to a tab
    opt.tabActions = ["ignore", "download", "pocket", "bookmark", "close"];

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

    function setDefaultTabActions() {
      opt.tabActions.forEach(function(element) {
        tabSettings[element] = this.tabOptions[0];
      }, opt);
    }

    function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function createForm() {
      var optionsForm = document.getElementById("file-type-destinations");

      for (var i = 0; i < opt.numOfmimeTypes; i++) {
        var panel = document.createElement("div");
        panel.setAttribute("class", "panel panel-default row");

        var headerDiv = document.createElement("div");
        headerDiv.setAttribute("class", "panel-heading col-md-2");

        var header = document.createElement("h4");
        header.textContent = capitalize(opt.mimeTypes[i]);

        headerDiv.appendChild(header);
        panel.appendChild(headerDiv);

        var formDiv = document.createElement("div");
        formDiv.setAttribute("class", "panel-body col-md-10");

        for (var x = 0; x < opt.numOftabActions; x++) {
          var label = document.createElement("label");

          var input = document.createElement("input");
          input.type = "radio";
          input.id = opt.tabActions[x];
          input.name = opt.mimeTypes[i];
          input.value = opt.tabActions[x];

          var span = document.createElement("span");
          span.textContent = capitalize(opt.tabActions[x]);
          label.appendChild(input);
          label.appendChild(span);
          formDiv.appendChild(label);
        }
        panel.appendChild(formDiv);

        optionsForm.appendChild(panel);
      }
    }

    function bindUIActions() {
      document
        .getElementById("settings")
        .addEventListener("submit", opt.saveMimeSettings);
      document
        .getElementById("pocket-status")
        .addEventListener("click", PocketAPILayer.checkLink);
      document
        .getElementById("full-mime-types")
        .addEventListener("click", opt.saveFullMimeType);
      document
        .getElementById("simple")
        .addEventListener("click", opt.saveLayout);
      document
        .getElementById("advanced")
        .addEventListener("click", opt.saveLayout);
      document
        .getElementById("autoclose")
        .addEventListener("click", opt.saveAutoClose);
    }

    opt.init = function() {
      bindUIActions();
      setDefaultMimeTypes();
      createForm();
      this.restoreMimeSettings().then(opt.setMimeSettings);
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

    /**
     * Set form inputs to match layout enabled/disabled preference
     *
     * @param {object} layout - An object representing current layout setting
     */
    opt.setLayout = function(layout) {
      var simple = document.getElementById("simple");
      var advanced = document.getElementById("advanced");
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
      var autoCloseButton = document.getElementById("autoclose");

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
      var autoCloseButton = document.getElementById("autoclose");

      if (autoCloseButton.checked === true) {
        opt.autoClose.autoCloseTabs = true;
      } else {
        opt.autoClose.autoCloseTabs = false;
      }

      browserUtils
        .store(opt.autoClose)
        .then(function(value) {
          messageManager.updateStatusMessage(
            "Autoclose saved.",
            "short",
            "success"
          );
        })
        .catch(err => {
          messageManager.updateStatusMessage(
            "Error:" + err.message,
            "medium",
            "danger"
          );
          console.log(err.message);
        });
    };

    /**
     * Persist user's layout preferences to storage
     * @return {Promise} Promise represents result of storage action
     */
    opt.saveLayout = function() {
      var simpleLayout = document.getElementById("simple");
      var advancedLayout = document.getElementById("advanced");

      if (!simpleLayout.checked && !advancedLayout.checked) {
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

        browserUtils
          .store(layout)
          .then(function(value) {
            messageManager.updateStatusMessage(
              "Layouts saved.",
              "short",
              "success"
            );
          })
          .catch(err => {
            messageManager.updateStatusMessage(
              "Error:" + err.message,
              "medium",
              "danger"
            );
            console.log(err.message);
          });
      });
    };

    /**
     * Update form input to match user's mimeType preference
     * @param {object} fullMimeType Object representing user's mimeType preference
     */
    opt.setFullMimeType = function(fullMimeType) {
      var fullMimeTypeElement = document.getElementById("full-mime-types");
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
      var isChecked = document.getElementById("full-mime-types").checked;

      if (isChecked === true) {
        opt.fullMimeType.retrieveFullMimeType = true;
      } else {
        opt.fullMimeType.retrieveFullMimeType = false;
      }

      browserUtils
        .store(opt.fullMimeType)
        .then(
          messageManager.updateStatusMessage(
            "Full mime type saved.",
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

      browserUtils
        .store(opt.mimeSettings)
        .then(
          messageManager.updateStatusMessage(
            "Mime settings saved",
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

    return opt;
  })();
