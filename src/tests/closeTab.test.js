/**
 * @jest-environment jsdom
 */
import { closeTabIfEnabled } from "../js/closeTab.js";
import { AUTO_CLOSE } from "../js/storageKeys.js";

function mockBrowser({ autoClose, removeImpl } = {}) {
  globalThis.browser = {
    storage: {
      local: {
        get: jest.fn((query) => {
          // closeTabIfEnabled reads the AUTO_CLOSE default-shaped query.
          if (query === AUTO_CLOSE || (query && "autoCloseTabs" in query)) {
            return Promise.resolve({ autoCloseTabs: autoClose });
          }
          return Promise.resolve({});
        }),
      },
    },
    tabs: {
      remove: removeImpl || jest.fn().mockResolvedValue(),
    },
  };
}

describe("closeTabIfEnabled", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("removes an inactive tab and returns true when autoclose is on", async () => {
    mockBrowser({ autoClose: "true" });
    const tab = { id: 9, active: false };

    await expect(closeTabIfEnabled(tab)).resolves.toBe(true);
    expect(globalThis.browser.tabs.remove).toHaveBeenCalledWith(9);
  });

  it("does nothing and returns false when autoclose is off", async () => {
    mockBrowser({ autoClose: false });
    const tab = { id: 9, active: false };

    await expect(closeTabIfEnabled(tab)).resolves.toBe(false);
    expect(globalThis.browser.tabs.remove).not.toHaveBeenCalled();
  });

  it("never closes the active tab", async () => {
    mockBrowser({ autoClose: "true" });
    const tab = { id: 9, active: true };

    await expect(closeTabIfEnabled(tab)).resolves.toBe(false);
    expect(globalThis.browser.tabs.remove).not.toHaveBeenCalled();
  });

  it("catches a remove failure and returns false", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mockBrowser({
      autoClose: "true",
      removeImpl: jest.fn().mockRejectedValue(new Error("gone")),
    });
    const tab = { id: 9, active: false };

    await expect(closeTabIfEnabled(tab)).resolves.toBe(false);
  });
});
