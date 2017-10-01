"use strict";
import { popup } from "./popup.js";
/**
 * Common form functionality
 * @constructor
 */
export var form = form || {
  options: "",

  init: function(values) {
    this.options = values;
  },

  createForm: function(tabs) {
    popup.getOptions(function(options) {
      popup.assembleForm(tabs, options);
      return;
    });

    popup.watchSubmit(tabs);
    return;
  },

  createCheckbox: function(tab, type, checked) {
    var input = document.createElement("input");
    input.type = "checkbox";
    input.id = "tab-" + tab.index;
    input.name = "tabs" + tab.index;
    input.title = tab.title.toString() + type;
    input.value = tab.url.toString();
    input.checked = checked;

    return input;
  },

  /**
   * Creates radio input form fields and selects the radio button
   * if it's action matches the user's preferred action
   *
   * @param  {object} tab         A browser tab object
   * @param  {string} action       An action user can perform on the tab
   * @param  {string} preferrence - User's preferred action
   * @return {element}             An HTML label element wrapped around a radio input element
   */
  createRadioInput: function(tab, action, preferrence) {
    action = action.toString();
    preferrence = preferrence.toString();

    var checked = "";

    if (action === preferrence) {
      checked = "checked";
    }
    var input = document.createElement("input");
    input.type = "radio";
    input.id = "tab-pref-" + tab.index;
    input.name = "tab-pref-" + tab.index;
    input.value = action;
    input.checked = checked;

    var label = document.createElement("label");
    label.setAttribute("class", "preferences");

    var actionSpan = document.createElement("span");
    actionSpan.textContent = action;

    label.appendChild(actionSpan);
    label.appendChild(input);

    return label;
  },

  createLabel: function(tab, type, active) {
    var label = document.createElement("label");
    label.setAttribute("class", "list-group-item " + active);
    label.setAttribute("id", "label-tab-" + tab.index);
    var title = document.createElement("p");
    title.textContent = "Title: " + tab.title.toString();
    label.appendChild(title);
    //if Full Mime Type add mimetype
    //@to-do Pull the setting from Options page
    //label.innerHTML = label.innerHTML + "<p> Type: " + type + "</p>";

    //Dead code without enabling mime type option in user preferences
    if (type.split("/").shift() === "image") {
      var image = document.createElement("img");
      image.classList.add("img-thumbnail");
      image.style = "width: 150px; height: 150px;";
      image.src = tab.url.toString();
      label.appendChild(image);
    }

    return label;
  },

  toggleLabels: function(label) {
    label.addEventListener("click", function() {
      var input = label.getElementsByTagName("input")[0];
      if (label.classList.contains("active")) {
        if (!input.checked) {
          label.classList.remove("active");
        }
      }
      if (!label.classList.contains("active")) {
        if (input.checked) {
          label.classList.add("active");
        }
      }
    });
  },

  setLabelStatus: function(tab, status) {
    var label = document.getElementById("label-tab-" + tab.labelTabId);
    label.setAttribute("class", label.className + " " + status);
  },

  updateStatus: function(tab, text) {
    var label = document.getElementById("status");
    var link = document.createElement("a");
    var status = document.createElement("p");
    var message = document.createTextNode(text);

    link.title = tab.title.toString();
    link.href = tab.url.toString();
    link.textContent = tab.title.toString();

    status.appendChild(message);
    status.appendChild(link);
    label.appendChild(status);
    label.removeAttribute("class", "hidden");
  },

  assembleForm: function(tabs, options) {
    var resources = document.getElementById("resources");

    tabs.forEach(function(tab) {
      popup.getContentType(tab.url, function(response) {
        this.mType = response;
      });

      var type = this.mType
        .split("/")
        .shift()
        .toLowerCase();

      var pref = options[type] ? options[type] : "ignore";

      var checked = "";
      var active = "";

      if (pref === "download" || pref === "pocket") {
        checked = "checked";
        active = "active";
      }

      var input = popup.createCheckbox(tab, type, checked);

      if (pref === "download") {
      }
      var radioDown = popup.createRadioInput(tab, "download", pref);
      var radioPocket = popup.createRadioInput(tab, "pocket", pref);
      var radioIgnore = popup.createRadioInput(tab, "ignore", pref);

      var label = popup.createLabel(tab, type, active);

      label.appendChild(input);
      label.appendChild(radioDown);
      label.appendChild(radioPocket);
      label.appendChild(radioIgnore);

      resources.appendChild(label);
    });
  },

  getSelectedGroup: function() {
    var group = document.getElementById();
  },

  /**
     * For each tab we look for a form input
     * via it's tab ID and for each action type
     * push it to a stack of those actions
     *
     * @param  {array} tabs Collection of tab objects
     * @return {array}      Tabs with arrays of actions added
     */
  getSelectedTabs: function(tabs) {
    var inputs = tabs.length;
    var downloadURLs = [];
    var pocketURLs = [];
    var bookmarkURLs = [];
    var closeURLs = [];
    var ignoreURLs = [];
    var results = [];

    var i;

    for (i = 0; i < inputs; i++) {
      var input = document.getElementById("tab-" + i);
      if (input.checked) {
        var radios = document.getElementsByName("tab-pref-" + i);
        var x;
        tabs[i].labelTabId = i;
        for (x = 0; x < radios.length; x++) {
          if (radios[x].checked) {
            var action = radios[x].value;
            switch (action) {
              case "download":
                downloadURLs.push(tabs[i]);
                break;
              case "pocket":
                pocketURLs.push(tabs[i]);
                break;
              case "bookmark":
                bookmarkURLs.push(tabs[i]);
                break;
              case "close":
                closeURLs.push(tabs[i]);
                break;
              default:
                ignoreURLs.push(tabs[i]);
                break;
            }
          }
        }
      } else {
        ignoreURLs.push(tabs[i]);
      }
    }

    tabs.downloads = downloadURLs;
    tabs.pockets = pocketURLs;
    tabs.closes = closeURLs;
    tabs.bookmarks = bookmarkURLs;
    tabs.ignores = ignoreURLs;

    return tabs;
  },

  /**
     * Highlight labels when an tab input is clicked
     *
     * @return {[type]} [description]
     */
  watchMutateCheck: function() {
    var form = document.querySelector("#resources");

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var node = document.querySelector(
          "#" + mutation.addedNodes[0].id + " > input"
        );
        var label = document.querySelector("#label-" + node.id);
        label.addEventListener("click", function() {
          if (label.classList.contains("active")) {
            if (!node.checked) {
              label.classList.remove("active");
            }
          }
          if (!label.classList.contains("active")) {
            if (node.checked) {
              label.classList.add("active");
            }
          }
        });
      });
    });

    var config = { attributes: true, childList: true, characterData: true };

    observer.observe(form, config);
  }
};
