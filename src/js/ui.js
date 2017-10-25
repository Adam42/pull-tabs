import { messageManager } from "./message.js";
import { browserUtils } from "./browser.js";

export default class UI {
  constructor(state) {
    this.state = state || {
      message: "",
      status: "successful",
      duration: "short"
    };
  }

  //returns a Promise
  getLayout() {
    var key = {
      simple: "true",
      advanced: "false"
    };
    var msgID = messageManager.updateStatusMessage(
      "Loading layout",
      "dependent",
      "info"
    );

    return browserUtils.retrieve(key).then(function(value) {
      messageManager.removeStatusMessage(msgID);
      return value;
    });
  }

  displayLayout() {}
}
