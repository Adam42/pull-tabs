/**
 * @jest-environment jsdom
 */
import ClipboardProvider from "../../js/services/Clipboard";

describe("ClipboardProvider", () => {
  const tabs = [
    { url: "https://a.com", title: "A" },
    { url: "https://b.com", title: "B" },
  ];

  let writeText;

  beforeEach(() => {
    document.body.innerHTML = "";
    // Primary path (Phase 7.3): the async Clipboard API.
    writeText = jest.fn().mockResolvedValue();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    // Fallback path: legacy execCommand.
    document.execCommand = jest.fn().mockReturnValue(true);
  });

  it("copies a single tab as one line via writeText", async () => {
    const provider = new ClipboardProvider([tabs[0]]);

    await expect(provider.doActionToTab(tabs[0])).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith("A: https://a.com\n");
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it("copies every tab as multiple lines in bulk via writeText", async () => {
    const provider = new ClipboardProvider(tabs);

    await expect(provider.doActionToTabs()).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith(
      "A: https://a.com\nB: https://b.com\n",
    );
  });

  it("falls back to execCommand when writeText rejects", async () => {
    writeText.mockRejectedValue(new Error("not allowed"));
    let copiedValue;
    document.execCommand.mockImplementation(() => {
      copiedValue = document.getElementById("temp-clipboard-text").value;
      return true;
    });
    const provider = new ClipboardProvider([tabs[0]]);

    await expect(provider.doActionToTab(tabs[0])).resolves.toBeUndefined();
    expect(copiedValue).toBe("A: https://a.com\n");
  });

  it("wraps an execCommand failure in the fallback path", async () => {
    writeText.mockRejectedValue(new Error("not allowed"));
    document.execCommand.mockImplementation(() => {
      throw new Error("blocked");
    });
    const provider = new ClipboardProvider([tabs[0]]);

    await expect(provider.doActionToTab(tabs[0])).rejects.toThrow(
      "Clipboard failed: could not copy tabs to clipboard",
    );
  });

  it("wraps a validation error for an invalid tab in the bulk array", async () => {
    const provider = new ClipboardProvider([{ url: "https://a.com" }]);

    await expect(provider.doActionToTabs()).rejects.toThrow(
      "Clipboard failed: Tab is missing a url or title",
    );
  });
});
