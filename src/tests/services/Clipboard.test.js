/**
 * @jest-environment jsdom
 */
import ClipboardProvider from "../../js/services/Clipboard";

describe("ClipboardProvider", () => {
  const tabs = [
    { url: "https://a.com", title: "A" },
    { url: "https://b.com", title: "B" },
  ];

  beforeEach(() => {
    document.body.innerHTML = "";
    document.execCommand = jest.fn().mockReturnValue(true);
  });

  it("copies a single tab as one line", async () => {
    const provider = new ClipboardProvider([tabs[0]]);
    let copiedValue;
    document.execCommand.mockImplementation(() => {
      copiedValue = document.getElementById("temp-clipboard-text").value;
      return true;
    });

    await expect(provider.doActionToTab(tabs[0])).resolves.toBeUndefined();
    expect(copiedValue).toBe("A: https://a.com\n");
  });

  it("copies every tab as multiple lines in bulk", async () => {
    const provider = new ClipboardProvider(tabs);
    let copiedValue;
    document.execCommand.mockImplementation(() => {
      copiedValue = document.getElementById("temp-clipboard-text").value;
      return true;
    });

    await expect(provider.doActionToTabs()).resolves.toBeUndefined();
    expect(copiedValue).toBe("A: https://a.com\nB: https://b.com\n");
  });

  it("wraps an execCommand failure", async () => {
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
