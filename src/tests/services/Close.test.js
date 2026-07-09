import CloseProvider from "../../js/services/Close";

describe("CloseProvider", () => {
  const tab = { id: 7, url: "https://example.com", title: "Example" };

  beforeEach(() => {
    globalThis.browser = {
      tabs: {
        remove: jest.fn().mockResolvedValue(),
      },
    };
  });

  it("removes a non-active tab", async () => {
    const provider = new CloseProvider([tab]);

    await expect(provider.doActionToTab(tab)).resolves.toBeUndefined();
    expect(globalThis.browser.tabs.remove).toHaveBeenCalledWith(7);
  });

  it("refuses to close the active tab with a single prefix", async () => {
    const provider = new CloseProvider([tab]);
    const activeTab = { ...tab, active: true };

    await expect(provider.doActionToTab(activeTab)).rejects.toThrow(
      "Close failed: refusing to close the active tab",
    );
    expect(globalThis.browser.tabs.remove).not.toHaveBeenCalled();
  });

  it("wraps a browser.tabs.remove rejection", async () => {
    globalThis.browser.tabs.remove.mockRejectedValue(new Error("no such tab"));
    const provider = new CloseProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Close failed: no such tab",
    );
  });
});
