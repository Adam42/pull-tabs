// Isolate ui.js's load-time chain: keys.js calls ServiceFactory.getActions()
// at import, and the real providers.js would pull Download.js -> browser.js
// -> init(). Mock both before importing ui.js.
jest.mock("../../js/services/ServiceFactory.js", () => {
  const doActionToTab = jest.fn();

  class FakeProvider {
    constructor(tabs) {
      this.tabs = tabs;
      this.doActionToTab = doActionToTab;
    }
  }

  return {
    __esModule: true,
    default: {
      getActions: jest.fn(() => ["download", "bookmark", "close", "clipboard"]),
      convertActionToProvider: jest.fn(() => FakeProvider),
      mockDoActionToTab: doActionToTab,
    },
  };
});

jest.mock("../../js/message.js", () => ({
  messageManager: { updateStatusMessage: jest.fn() },
}));

import UI from "../../js/ui.js";
import ServiceFactory from "../../js/services/ServiceFactory.js";
import { messageManager } from "../../js/message.js";

const doActionToTab = ServiceFactory.mockDoActionToTab;

const makeView = () => ({
  updateUIWithSuccess: jest.fn(),
  updateUIWithFail: jest.fn(),
});

describe("UI.doActionToTabForTabs", () => {
  const tabs = [
    { id: 1, url: "https://a.com", title: "A" },
    { id: 2, url: "https://b.com", title: "B" },
    { id: 3, url: "https://c.com", title: "C" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.browser = {
      storage: {
        local: { get: jest.fn().mockResolvedValue({ autoCloseTabs: "false" }) },
      },
    };
  });

  it("summarizes mixed success/failure as a warning", async () => {
    doActionToTab
      .mockResolvedValueOnce()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("nope"));
    const view = makeView();

    await UI.doActionToTabForTabs(tabs, "bookmark", view);

    expect(messageManager.updateStatusMessage).toHaveBeenCalledWith(
      "2 bookmarked, 1 failed",
      "medium",
      "warning",
    );
    expect(view.updateUIWithSuccess).toHaveBeenCalledTimes(2);
    expect(view.updateUIWithFail).toHaveBeenCalledTimes(1);
  });

  it("uses the past-tense map for close (not 'closeed')", async () => {
    doActionToTab.mockResolvedValue();
    const view = makeView();

    await UI.doActionToTabForTabs(tabs, "close", view);

    expect(messageManager.updateStatusMessage).toHaveBeenCalledWith(
      "3 closed",
      "medium",
      "success",
    );
  });

  it("summarizes an all-success batch as a success", async () => {
    doActionToTab.mockResolvedValue();
    const view = makeView();

    await UI.doActionToTabForTabs(tabs, "bookmark", view);

    expect(messageManager.updateStatusMessage).toHaveBeenCalledWith(
      "3 bookmarked",
      "medium",
      "success",
    );
  });

  it("throws on a non-array tabs argument", async () => {
    await expect(
      UI.doActionToTabForTabs("nope", "bookmark", makeView()),
    ).rejects.toThrow(TypeError);
  });

  it("throws on an empty action string", async () => {
    await expect(UI.doActionToTabForTabs(tabs, "", makeView())).rejects.toThrow(
      TypeError,
    );
  });

  it("throws when the view is missing required callbacks", async () => {
    await expect(UI.doActionToTabForTabs(tabs, "bookmark", {})).rejects.toThrow(
      TypeError,
    );
  });
});
