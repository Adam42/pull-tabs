import { messageManager } from "./message.js";
import storage from "./storage.js";
import { keys } from "./keys.js";

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
    return storage.retrieve(keys.preferences.layout);
  }

  displayLayout() {}
}
