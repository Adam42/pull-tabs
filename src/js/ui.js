import { messageManager } from "./message.js";
import storage from "./storage.js";

export default class UI {
  constructor(state) {
    this.state = state || {
      message: "",
      status: "successful",
      duration: "short"
    };
  }

  //returns a Promise
  static getLayout() {
    var key = {
      simple: "true",
      advanced: "false"
    };

    return storage.retrieve(key);
  }

  displayLayout() {}
}
