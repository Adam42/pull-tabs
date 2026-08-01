// Mirror doActionToTabForTabs.test.js: mock ServiceFactory + message.js so
// importing ui.js doesn't pull the real provider chain at load time.
jest.mock("../js/services/ServiceFactory.js", () => {
  const doActionToTabs = jest.fn();

  class FakeProvider {
    constructor(tabs) {
      this.tabs = tabs;
      this.doActionToTabs = doActionToTabs;
      // autoCloseIfEnabled instantiates the "close" provider and calls this.
      this.doActionToTab = jest.fn().mockResolvedValue();
    }
  }

  return {
    __esModule: true,
    default: {
      getActions: jest.fn(() => ["raindrop"]),
      convertActionToProvider: jest.fn(() => FakeProvider),
      mockDoActionToTabs: doActionToTabs,
    },
  };
});

jest.mock("../js/message.js", () => ({
  messageManager: { updateStatusMessage: jest.fn() },
}));

import UI from "../js/ui.js";
import ServiceFactory from "../js/services/ServiceFactory.js";
import { messageManager } from "../js/message.js";

const doActionToTabs = ServiceFactory.mockDoActionToTabs;

const makeView = () => ({
  updateUIWithSuccess: jest.fn(),
  updateUIWithFail: jest.fn(),
});

describe("UI.doBulkActionForTabs", () => {
  const tabs = [
    { id: 1, url: "https://a.com", title: "A" },
    { id: 2, url: "https://b.com", title: "B" },
    { id: 3, url: "https://c.com", title: "C" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.browser = {
      storage: {
        local: { get: jest.fn().mockResolvedValue({ autoCloseTabs: "true" }) },
      },
    };
  });

  it("reports all-success and autocloses every saved tab", async () => {
    doActionToTabs.mockResolvedValue({ succeeded: tabs, failed: [] });
    const view = makeView();

    await UI.doBulkActionForTabs(tabs, "raindrop", view);

    expect(view.updateUIWithSuccess).toHaveBeenCalledTimes(3);
    expect(view.updateUIWithFail).not.toHaveBeenCalled();
    expect(globalThis.browser.storage.local.get).toHaveBeenCalledTimes(3);
    expect(messageManager.updateStatusMessage).toHaveBeenCalledWith(
      "3 saved to Raindrop",
      "medium",
      "success",
    );
  });

  it("splits a mixed {succeeded, failed} result and autocloses only saved tabs", async () => {
    doActionToTabs.mockResolvedValue({
      succeeded: [tabs[0], tabs[1]],
      failed: [tabs[2]],
    });
    const view = makeView();

    await UI.doBulkActionForTabs(tabs, "raindrop", view);

    expect(view.updateUIWithSuccess).toHaveBeenCalledTimes(2);
    expect(view.updateUIWithFail).toHaveBeenCalledTimes(1);
    expect(view.updateUIWithFail).toHaveBeenCalledWith(tabs[2], "raindrop");
    // Autoclose queried only for the two saved tabs.
    expect(globalThis.browser.storage.local.get).toHaveBeenCalledTimes(2);
    expect(messageManager.updateStatusMessage).toHaveBeenCalledWith(
      "2 saved to Raindrop, 1 failed",
      "medium",
      "warning",
    );
  });

  it("treats a thrown provider error as every tab failing", async () => {
    doActionToTabs.mockRejectedValue(new Error("not configured"));
    const view = makeView();

    await UI.doBulkActionForTabs(tabs, "raindrop", view);

    expect(view.updateUIWithSuccess).not.toHaveBeenCalled();
    expect(view.updateUIWithFail).toHaveBeenCalledTimes(3);
    expect(messageManager.updateStatusMessage).toHaveBeenCalledWith(
      "0 saved to Raindrop, 3 failed",
      "medium",
      "warning",
    );
  });

  it("throws on an invalid view", async () => {
    await expect(UI.doBulkActionForTabs(tabs, "raindrop", {})).rejects.toThrow(
      TypeError,
    );
  });
});
