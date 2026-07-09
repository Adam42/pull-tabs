// Mock browser.js before importing the provider so its init() side-effect
// (getTree/bookmark lookup) never runs.
jest.mock("../../js/browser.js", () => ({
  browserUtils: { isFile: jest.fn(), isFirefox: false },
}));

import DownloadProvider from "../../js/services/Download";
import { browserUtils } from "../../js/browser.js";

describe("DownloadProvider", () => {
  const tab = { url: "https://example.com/report.pdf", title: "Report" };

  beforeEach(() => {
    jest.clearAllMocks();
    browserUtils.isFile.mockReturnValue(true);
    globalThis.browser = {
      downloads: {
        download: jest.fn().mockResolvedValue(99),
      },
      storage: {
        local: {
          set: jest.fn().mockResolvedValue(),
        },
      },
    };
  });

  it("stores the download record keyed by download id on success", async () => {
    const provider = new DownloadProvider([tab]);

    await provider.doActionToTab(tab);

    expect(globalThis.browser.downloads.download).toHaveBeenCalledWith({
      url: "https://example.com/report.pdf",
      method: "GET",
    });
    expect(globalThis.browser.storage.local.set).toHaveBeenCalledWith({
      "downloadTabItem-99": tab,
    });
  });

  it("names non-file URLs as .html downloads", async () => {
    browserUtils.isFile.mockReturnValue(false);
    const htmlTab = { url: "https://example.com/page", title: "Page" };
    const provider = new DownloadProvider([htmlTab]);

    await provider.doActionToTab(htmlTab);

    expect(globalThis.browser.downloads.download).toHaveBeenCalledWith({
      url: "https://example.com/page",
      filename: "Page.html",
      method: "GET",
    });
  });

  it("refuses to download internal browser pages", async () => {
    const provider = new DownloadProvider([tab]);
    const aboutTab = { url: "about:config", title: "Config" };

    await expect(provider.doActionToTab(aboutTab)).rejects.toThrow(
      "Download failed: cannot download internal browser pages",
    );
    expect(globalThis.browser.downloads.download).not.toHaveBeenCalled();
  });

  it("wraps a browser.downloads.download rejection", async () => {
    globalThis.browser.downloads.download.mockRejectedValue(
      new Error("disk full"),
    );
    const provider = new DownloadProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Download failed: disk full",
    );
  });
});
