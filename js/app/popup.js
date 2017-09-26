"use strict";
var pullTabs = pullTabs || {};

/**
 * Main functionality of pullTabs extension
 * exposed to user via a popup window
 * @constructor
 */
pullTabs.App = pullTabs.App || {
  tabs: "",

  prefs: "",

  layout: "",

  mimeTypesMap: {},

  linksWatched: false,

  init: function() {
    //Force user to go to options page on initial load
    if (localStorage.initialSetup !== "no") {
      localStorage.initialSetup = "yes";
      pullTabs.App.doInitialSetup();
      return;
    }

    //If we don't have any tabs yet then retrieve them
    if (!pullTabs.App.tabs) {
      var msgID = pullTabs.App.updateStatusMessage(
        "Gathering your tabs",
        "dependent",
        "info"
      );
      pullTabs.Browser
        .getTabs()
        .then(function(tabs) {
          pullTabs.App.tabs = tabs;
          pullTabs.App.removeStatusMessage(msgID);
          return tabs;
        })
        .then(function(tabs) {
          pullTabs.App.setNumTabs(tabs);
        })
        .then(
          pullTabs.App.getLayout().then(function(layout) {
            pullTabs.App.setLayout(layout);
            pullTabs.App.displayLayout();
          })
        )
        .catch(function(e) {
          console.log(e);
        });

      return;
    }
  },

  /**
     * Updates a status element with a message and displays
     * it for a specified duration
     *
     * @param  {string|object} message  Either the text of the message or an element object
     * @param  {string} duration - short,medium,long, dependent or re-stack
     * @param  {string} type     The type of message, e.g. success, danger or info
     * @return {void|number}      A dependent message returns a numeric ID, others void.
     */
  updateStatusMessage: function(message, duration, type) {
    var status = document.getElementById("status");
    var statusMessage = document.createElement("p");
    var elementIDName = "status-message-";

    var alertType = "alert-" + type;
    statusMessage.classList.add("alert", alertType);
    status.classList.remove("hidden");
    status.style.top = 0;
    statusMessage.textContent = message;

    //test if it's a DOM element instead of just a string
    if (typeof message === "object" && message instanceof HTMLElement) {
      statusMessage.textContent = "";
      statusMessage.appendChild(message);
    }

    statusMessage.id = elementIDName + status.children.length;

    //if there are children then get the id of the last child
    //and bump it to avoid colliding with an older message
    //that hasn't yet been removed
    if (status.children.length > 0) {
      var lastChildID = status.lastChild.id;
      lastChildID = lastChildID.replace(elementIDName, "");
      lastChildID = parseInt(lastChildID) + 1;
      statusMessage.id = elementIDName + lastChildID;
    }

    status.appendChild(statusMessage);

    switch (duration) {
      case "short":
        setTimeout(pullTabs.App.removeStatusMessage, 2000, statusMessage.id);
        break;

      case "medium":
        setTimeout(pullTabs.App.removeStatusMessage, 4000, statusMessage.id);
        break;

      case "long":
        setTimeout(pullTabs.App.removeStatusMessage, 8000, statusMessage.id);
        break;

      case "dependent":
        return statusMessage.id;

      case "restack":
        break;

      default:
        setTimeout(pullTabs.App.removeStatusMessage, 3000, statusMessage.id);
        break;
    }
  },

  /**
     * Remove a previously created status message from DOM via it's ID
     * @param  {Number} id The ID of the element being removed
     * @return {void}    [description]
     */
  removeStatusMessage: function(id) {
    if (typeof id === null) {
      id = "status-message-0";
    }
    var status = document.getElementById(id);
    var parent = status.parentNode;
    status.remove();

    if (parent.children.length <= 0) {
      parent.classList.add("hidden");
    }
  },

  doInitialSetup: function() {
    if (document.getElementById("setup") === null) {
      var optionsLink = document.createElement("a");
      //Browser is not instantiated at this point
      //optionsLink.href = Browser.extensionGetURL('options.html');
      optionsLink.href = chrome.extension.getURL("options.html");
      optionsLink.id = "initial-load";
      optionsLink.textContent = " Setup PullTabs with your preferences.";

      var setupMessage = document.createElement("p");
      setupMessage.classList.add("alert", "alert-info");
      setupMessage.textContent =
        "This appears to be your first time using PullTabs. Please visit the options page to define your preferences and setup any external services you wish to use.";
      setupMessage.id = "setup";
      setupMessage.appendChild(optionsLink);

      var parent = document.getElementById("simple").parentNode;
      var simple = document.getElementById("simple");

      parent.insertBefore(setupMessage, simple);

      setupMessage.addEventListener("click", function(e) {
        e.preventDefault();
        localStorage.initialSetup = "no";
        chrome.runtime.openOptionsPage();
      });
    }
  },

  /**
     * Determine which layouts are enabled and perform initial setup for those layouts
     * @return {void} [description]
     */
  displayLayout: function() {
    if (pullTabs.App.layout.simple) {
      pullTabs.App.watchButtons();

      if (!pullTabs.App.linksWatched) {
        pullTabs.App.watchLinks();
      }
    } else {
      var simple = document.getElementById("simple");
      simple.classList.add("hidden");
    }

    if (pullTabs.App.layout.advanced) {
      pullTabs.App.displayAdvancedLayout();
    }
  },

  addMimeTypeToTabs: function() {
    return pullTabs.App.tabs.map(function(tab) {
      //          var tabObj = pullTabs.App.tabs.filter(function( tabObj ) {
      //            return tabObj.id == tab.id;
      //         })['0'];

      pullTabs.App
        .getContentType(tab.url)
        .then(function(mimeType) {
          var id = "tab" + tab.id.toString();
          pullTabs.App.setMimeTypesMap(id, mimeType);
          //                pullTabs.App.mimeTypesMap[id] = mimeType;
          //                tabObj.mimeType = mimeType;
        })
        .catch(function(e) {
          console.log(e);
        });
    });
  },

  setMimeTypesMap: function(id, mimeType) {
    pullTabs.App.mimeTypesMap[id] = mimeType;
  },

  displayAdvancedLayout: function() {
    var advanced = document.getElementById("advanced");
    advanced.classList.remove("hidden");
    this.getOptions()
      .then(function(value) {
        pullTabs.App.setOptions(value);
      })
      .then(
        pullTabs.App
          .getFullMimeType()
          .then(function(fullMimeType) {
            if (fullMimeType.retrieveFullMimeType) {
              Promise.all(pullTabs.App.addMimeTypeToTabs).then(function() {
                pullTabs.App.assembleForm(
                  pullTabs.App.tabs,
                  pullTabs.App.pref,
                  pullTabs.App.mimeTypesMap
                );
              });
            } else {
              pullTabs.App.assembleForm(
                pullTabs.App.tabs,
                pullTabs.App.pref,
                pullTabs.App.mimeTypesMap
              );
            }
          })
          .then(function() {
            pullTabs.App.watchSubmit(pullTabs.App.tabs);

            var numFormTabs = document
              .getElementById("resources")
              .getElementsByClassName("list-group-item");

            pullTabs.App.watchCheckBoxes(numFormTabs);
            pullTabs.App.watchMutateCheck();
            pullTabs.App.setActions();
            pullTabs.App.watchLinks();
          })
      );
  },

  watchCheckBoxes: function(numFormTabs) {
    var i;
    for (i = 0; i < numFormTabs.length; i++) {
      pullTabs.Form.toggleLabels(numFormTabs[i]);
    }
  },

  /**
     * Retrieve the URLs represented in tabs collection
     * @param  {array} tabs Collection of tab objects
     * @return {array}      Collection of URLs from user's tabs
     */
  getUrls: function(tabs) {
    var urls = [];

    tabs.forEach(function(tab) {
      urls.push(tab.url);
    });

    return urls;
  },

  setTabs: function(tabs) {
    this.tabs = tabs;
  },

  setNumTabs: function(tabs) {
    var numTabs = document.getElementById("numTabs");
    numTabs.innerHTML =
      "This window has " + tabs.length + " tabs. Do this action to all tabs:";
  },

  getFullMimeType: function() {
    return pullTabs.Browser.retrieve(pullTabs.Options.fullMimeType);
  },

  assembleForm: function(tabs, prefs, mimeTypes) {
    tabs.forEach(function(tab) {
      if (mimeTypes.length > 0) {
        //            var mT = mimeTypes.filter(function(item) { return item.name === 'tab-2196'; });
      }

      pullTabs.App.displayDefaultAdvancedLayout(tab);

      /*
            if(fullMimeType){
                pullTabs.App.getContentType().then(function ( value ) {
                    console.log(value);
                }).catch(function(e){
                    console.log(e);
                });
                //tab.url, function(response){
                 //   this.mType = response;
               // });
            }

/*            if(typeof(this.mType) !== 'undefined'){
                fullType = this.mType.split(";").shift();
                type = this.mType.split("/").shift().toLowerCase();
                pref = prefs[type] ? prefs[type] : 'ignore';

            }
            else{
  */
    });
  },

  displayDefaultAdvancedLayout: function(tab) {
    var resources = document.getElementById("resources");
    var fullType = "unknown";
    var pref = "ignore";
    var checked = "";
    var active = "";

    if (pref !== "ignore") {
      checked = "checked";
      active = "active";
    }
    var Form = pullTabs.Form;
    var input = Form.createCheckbox(tab, fullType, checked);

    var radioDown = Form.createRadioInput(tab, "download", pref);
    var radioPocket = Form.createRadioInput(tab, "pocket", pref);
    var radioBookmark = Form.createRadioInput(tab, "bookmark", pref);
    var radioClose = Form.createRadioInput(tab, "close", pref);

    var label = Form.createLabel(tab, fullType, active);

    label.appendChild(input);
    label.appendChild(radioDown);
    label.appendChild(radioPocket);
    label.appendChild(radioBookmark);
    label.appendChild(radioClose);

    resources.appendChild(label);
  },

  getTabStatus: function() {
    this.tabs = pullTabs.Form.getSelectedTabs(this.tabs);

    if (this.tabs.downloads.length > 0) {
      pullTabs.Browser.downloadUrls(this.tabs.downloads);
    }

    if (this.tabs.pockets.length > 0) {
      pullTabs.Pocket.saveTabsToPocket(this.tabs.pockets);
    }

    if (this.tabs.closes.length > 0) {
      pullTabs.Browser.closeTabs(this.tabs.closes);
    }

    if (this.tabs.bookmarks.length > 0) {
      pullTabs.Browser.bookmarkTabs(this.tabs.bookmarks);
    }

    return;
  },

  /**
     * Retrieve content type of a tab/URL
     * @param  {string} url - URL of a tab
     * @return {string}     the content type of the resource
     */
  getContentType: function(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        if (xhr.status === 200) {
          var contentType = xhr.getResponseHeader("Content-Type");

          //strip off everything but the first part of the Content-Type
          //unless it is null which is often due to internal tabs
          //like for instance a chrome-extension:// tab
          if (contentType !== null) {
            resolve(
              contentType
                .split(";")
                .shift()
                .split("/")
                .shift()
                .toLowerCase()
            );
          } else {
            resolve("unknown");
            //                            reject("Content-Type unavailable");
          }
        }
        reject(Error(xhr.statusText));
      };

      xhr.onerror = function() {
        reject(Error(xhr.statusText));
      };

      xhr.open("HEAD", url);
      xhr.send();
    });
  },

  /*  getExtension: function(url){
        return url.split('.').pop();
    },
*/

  setLayout: function(layout) {
    pullTabs.App.layout = layout;
  },

  //returns a Promise
  getLayout: function() {
    var key = {
      simple: "true",
      advanced: "false"
    };
    var msgID = pullTabs.App.updateStatusMessage(
      "Loading layout",
      "dependent",
      "info"
    );

    return pullTabs.Browser.retrieve(key).then(function(value) {
      pullTabs.App.removeStatusMessage(msgID);
      return value;
    });
  },

  doError: function(error) {
    console.log("Error: ");
    console.log(error);
    return;
  },

  getOptions: function(callback) {
    var key = {
      application: "download",
      image: "download",
      message: "ignore",
      model: "ignore",
      multipart: "ignore",
      text: "download",
      video: "download",
      unknown: "ignore"
    };

    return pullTabs.Browser.retrieve(key, callback);
  },

  setOptions: function(items) {
    pullTabs.App.prefs = items;
  },

  /**
   * Sets up event listeners to watch for clicks
   * on check/uncheck all buttons
   *
   * @event click
   */
  setActions: function() {
    var checkAllButton = document.getElementById("check-all-button");
    checkAllButton.addEventListener("click", function() {
      pullTabs.App.setAllActive();
    });

    var uncheckAllButton = document.getElementById("uncheck-all-button");
    uncheckAllButton.addEventListener("click", function() {
      pullTabs.App.setAllInactive();
    });
  },

  /**
   * Update all checkboxes in the list form and their labels to be active
   *
   * @todo  Extract out the form element so any form can be used
   */
  setAllActive: function() {
    var labels = document.querySelectorAll("#resources > label");
    var numLabels = labels.length;
    var i;

    var checkBoxes = document
      .getElementById("list")
      .querySelectorAll("input[type=checkbox]");

    checkBoxes.forEach(function(checkBox) {
      checkBox.checked = true;
    });

    for (i = 0; i < numLabels; i++) {
      if (!labels[i].classList.contains("active")) {
        labels[i].classList.add("active");
      }
    }
  },

  /**
   * Update all checbox inputs in the list form and their labels to inactive
   *
   * @todo  Extract out the form element so any form can be used
   */
  setAllInactive: function() {
    var labels = document.querySelectorAll("#resources > label");
    var numLabels = labels.length;
    var i;

    var checkBoxes = document
      .getElementById("list")
      .querySelectorAll("input[type=checkbox]");

    checkBoxes.forEach(function(checkBox) {
      checkBox.checked = false;
    });

    for (i = 0; i < numLabels; i++) {
      if (labels[i].classList.contains("active")) {
        labels[i].classList.remove("active");
      }
    }
  },

  //Unused? Should it be used in setAllActive/Inactive above?
  updateBackground: function(node, label) {
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
  },

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

    var setup = { attributes: true, childList: true, characterData: true };
    observer.observe(form, setup);
  },

  process: function(evt) {
    evt.preventDefault();
    pullTabs.App.getTabStatus();
  },

  processGroup: function(evt) {
    evt.preventDefault();
    var destination = document.getElementById("default");
  },

  doAction: function(evt) {
    evt.preventDefault();
    pullTabs.App.processButton(this.id);
  },

  processButton: function(action) {
    switch (action) {
      case "download":
        pullTabs.Browser.downloadUrls(pullTabs.App.tabs);
        break;

      case "pocket":
        pullTabs.Pocket.saveTabsToPocket(pullTabs.App.tabs);
        break;

      case "bookmark":
        pullTabs.Browser.bookmarkTabs(pullTabs.App.tabs);
        break;

      case "close":
        pullTabs.Browser.closeTabs(pullTabs.App.tabs);
        break;

      default:
        break;
    }
  },

  watchButtons: function() {
    var download = document.getElementById("download");
    download.addEventListener("click", this.doAction);

    var pocket = document.getElementById("pocket");
    pocket.addEventListener("click", this.doAction);

    var bookmark = document.getElementById("bookmark");
    bookmark.addEventListener("click", this.doAction);

    var close = document.getElementById("close");
    close.addEventListener("click", this.doAction);

    var ignore = document.getElementById("ignore");
    ignore.addEventListener("click", this.doAction);
  },

  watchSubmit: function() {
    var group = document.getElementById("default");
    group.addEventListener("submit", this.processGroup);

    var checked = document.getElementById("list");
    checked.addEventListener("submit", this.process);
  },

  showMainContent: function() {
    var mainContent = document.getElementById("main");
    var aboutContent = document.getElementById("about-credits");

    mainContent.classList.remove("bounce");

    if (!aboutContent.classList.contains("hidden")) {
      aboutContent.classList.add("hidden");
    }

    return;
  },

  swapMainContent: function() {
    var mainContent = document.getElementById("main");
    var aboutContent = document.getElementById("about-credits");

    if (mainContent.classList.contains("bounce")) {
      mainContent.classList.remove("bounce");

      if (!aboutContent.classList.contains("hidden")) {
        aboutContent.classList.add("hidden");
      }

      return;
    }
    if (!mainContent.classList.contains("bounce")) {
      mainContent.classList.add("bounce");

      if (aboutContent.classList.contains("hidden")) {
        aboutContent.classList.remove("hidden");
      }

      return;
    }
  },

  swapContent: function(link, content) {
    if (!content) {
      pullTabs.App.getContent(link, pullTabs.App.swapContent);
      return;
    }

    if (content) {
      var container = document.getElementById("content");
      container.innerHTML = content;
      return;
    }
  },

  getContent: function(link, callback) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", link.href, false);
      xhr.onload = function(e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            callback(link, xhr.response);
          } else {
            console.error(xhr.statusText);
            return;
          }
        }
      };

      xhr.onerror = function(e) {
        console.error(xhr.statusText);
        return;
      };

      xhr.send();
    } catch (e) {
      console.log("getContent Error: ");
      console.log(e);
    }
  },

  watchLinks: function() {
    var aboutLink = document.getElementById("about");
    aboutLink.addEventListener("click", function() {
      pullTabs.App.swapMainContent();
      return;
    });

    var homeLink = document.getElementById("home");
    homeLink.addEventListener("click", function() {
      pullTabs.App.showMainContent();
      return;
    });

    var creditLinks = document
      .getElementById("about-credits")
      .getElementsByTagName("a");
    var i;
    var len = creditLinks.length;

    for (i = 0; i < len; i++) {
      creditLinks[i].addEventListener("click", function(e) {
        var tabKey = {
          url: e.target.href,
          active: false
        };

        pullTabs.Browser.createTab(tabKey);
      });
    }

    pullTabs.App.linksWatched = true;

    /*
        var navLinks = document.getElementById("main-nav");
        var links = navLinks.children;
        var numLinks = links.length;
        var i;

        for (i=0; i < numLinks; i++) {
            var link = links[i];
            //links[i].addEventListener('click', function(){pullTabs.App.swapContent(link);});
            //link = document.getElementById();
            link.addEventListener('click', function(){
                pullTabs.App.swapContent(link);
                return;
            });
        }*/
  }
};

document.addEventListener("DOMContentLoaded", function() {
  pullTabs.App.init();
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (var key in changes) {
    if (changes.hasOwnProperty("key")) {
      var storageChange = changes[key];
      console.log(
        'Storage key "%s" in namespace "%s" changed. ' +
          'Old value was "%s", new value is "%s".',
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue
      );
    }
  }
});
