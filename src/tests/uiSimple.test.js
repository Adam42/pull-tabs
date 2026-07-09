/**
 * @jest-environment jsdom
 */
// Factory mocks keep the real modules from loading at all.
jest.mock("../js/browser.js", () => ({ browserUtils: {} }));
jest.mock("../js/popup.js", () => ({ popup: { tabs: [] } }));
jest.mock("../js/ui.js", () => ({
  __esModule: true,
  default: { doActionToTabForTabs: jest.fn(), autoCloseIfEnabled: jest.fn() }
}));
jest.mock("../js/services/ServiceFactory.js", () => ({
  __esModule: true,
  default: {
    // keys.js calls getActions() at module load and unshifts onto the result
    getActions: jest.fn(() => ["download", "bookmark"]),
    convertActionToProvider: jest.fn()
  }
}));

import { uiSimple } from "../js/uiSimple.js";
import { popup } from "../js/popup.js";
import ServiceFactory from "../js/services/ServiceFactory.js";

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe("uiSimple", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    popup.tabs = [];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("doActionToAllTabs", () => {
    beforeEach(() => {
      document.body.innerHTML =
        '<form id="simple-ui"><button id="download"><img /></button></form>';
      uiSimple.watchButtons();
    });

    it("resolves the action when the button's icon is clicked", () => {
      const processButton = jest
        .spyOn(uiSimple, "processButton")
        .mockImplementation(() => {});

      document
        .querySelector("img")
        .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(processButton).toHaveBeenCalledWith("download");
    });

    it("resolves the action when the button itself is clicked", () => {
      const processButton = jest
        .spyOn(uiSimple, "processButton")
        .mockImplementation(() => {});

      document
        .getElementById("download")
        .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      expect(processButton).toHaveBeenCalledWith("download");
    });

    it("ignores clicks outside any button", () => {
      const processButton = jest
        .spyOn(uiSimple, "processButton")
        .mockImplementation(() => {});

      expect(() => {
        document
          .getElementById("simple-ui")
          .dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
      }).not.toThrow();

      expect(processButton).not.toHaveBeenCalled();
    });
  });

  describe("processButton download status message", () => {
    const tab = { title: "Example", url: "https://example.com" };
    let resolveDownload;
    let rejectDownload;

    class FakeDownloadProvider {
      constructor(tabs) {
        this.tabs = tabs;
      }

      registerCallback(callback) {
        this.callback = callback;
      }

      doActionToTab() {
        this.pending = new Promise((resolve, reject) => {
          resolveDownload = resolve;
          rejectDownload = reject;
        });
        return this.pending;
      }
    }

    beforeEach(() => {
      popup.tabs = [tab];
      ServiceFactory.convertActionToProvider.mockReturnValue(
        FakeDownloadProvider
      );
    });

    it("shows 'Started downloading' only after the download promise resolves", async () => {
      const updateUI = jest
        .spyOn(uiSimple, "updateUI")
        .mockImplementation(() => {});

      uiSimple.processButton("download");

      expect(updateUI).not.toHaveBeenCalled();

      resolveDownload();
      await flushPromises();

      expect(updateUI).toHaveBeenCalledWith(tab, "Started downloading ", "info");
    });

    it("shows only 'Failed downloading' when the download promise rejects", async () => {
      const updateUI = jest
        .spyOn(uiSimple, "updateUI")
        .mockImplementation(() => {});
      jest.spyOn(console, "log").mockImplementation(() => {});

      uiSimple.processButton("download");

      rejectDownload(new Error("download failed"));
      await flushPromises();

      expect(updateUI).toHaveBeenCalledTimes(1);
      expect(updateUI).toHaveBeenCalledWith(
        tab,
        "Failed downloading ",
        "danger"
      );
    });
  });
});
