import { messageManager } from "./message.js";
import Preferences from "./preferences.js";

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
    return Preferences.get("layout");
  }

  displayLayout() {}
}
