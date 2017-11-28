"use strict";
/**
 * Accepts an HTML element to add a text message to
 * or searches for a "status" element and appends to that element
 *
 * @type {[type]}
 */
export var messageManager = messageManager || {
  /**
     * Updates a status element with a message and displays
     * it for a specified duration
     *
     * @param  {string|object} message  Either the text of the message or an element object
     * @param  {string} duration - short,medium,long, dependent or re-stack
     * @param  {string} type     The type of message, e.g. primary,success,info,warning,danger
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
        setTimeout(this.removeStatusMessage, 2000, statusMessage.id);
        break;

      case "medium":
        setTimeout(this.removeStatusMessage, 4000, statusMessage.id);
        break;

      case "long":
        setTimeout(this.removeStatusMessage, 8000, statusMessage.id);
        break;

      case "dependent":
        return statusMessage.id;

      case "restack":
        break;

      default:
        setTimeout(this.removeStatusMessage, 3000, statusMessage.id);
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
  }
};
