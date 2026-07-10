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
        // Present so tests can assert the popup NEVER searches — the
        // authoritative downloads.search now runs in the background worker.
        search: jest.fn().mockResolvedValue([{ id: 99, state: "in_progress" }]),
      },
      runtime: {
        sendMessage: jest.fn().mockResolvedValue(),
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

  it("dispatches a reconcile-download nudge for the id right after storing, without searching in the popup", async () => {
    // The popup no longer runs downloads.search itself; it hands the
    // authoritative terminal check to the durable background by sending a single
    // reconcile-download message for the download. sendMessage is issued
    // synchronously as part of downloadTab (before the start promise resolves),
    // so the nudge reaches the runtime before the popup can close — the fix for
    // the fast-download popup-close lost-nudge gap. Asserted WITHOUT awaiting
    // provider.reconciliation to prove the dispatch already happened.
    const provider = new DownloadProvider([tab]);

    await provider.doActionToTab(tab);

    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "reconcile-download",
      id: 99,
    });
    // The popup does not search; the background owns downloads.search and
    // no-ops for non-terminal items.
    expect(globalThis.browser.downloads.search).not.toHaveBeenCalled();
  });

  it("nudges regardless of the download's current state (background decides terminality)", async () => {
    // Even for an in-progress download the popup sends the nudge; the background
    // searches and no-ops when non-terminal. This replaces the old popup-side
    // conditional-send and guarantees the durable background always gets a
    // chance to reconcile a record onChanged may have missed.
    const provider = new DownloadProvider([tab]);

    await provider.doActionToTab(tab);
    await provider.reconciliation;

    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "reconcile-download",
      id: 99,
    });
  });

  it("resolves the start promise without waiting on the reconcile round trip", async () => {
    // Regression (Codex review): the download-start promise must resolve on the
    // storage write and NEVER wait on the background's handling of the nudge.
    // The popup renders "Started downloading" in the .then() of doActionToTab;
    // if that were gated on the reconcile response, the terminal
    // "download-status" broadcast could land first and a fast-completed download
    // would show "Completed" then a stale "Started" line (and re-add the
    // advanced in-progress label). Hold the sendMessage reply pending forever;
    // doActionToTab must still resolve, and the nudge must already be dispatched.
    globalThis.browser.runtime.sendMessage.mockReturnValue(new Promise(() => {}));
    const provider = new DownloadProvider([tab]);

    await expect(provider.doActionToTab(tab)).resolves.toBeUndefined();

    // Dispatched (so it survives popup close) but did not block the start.
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "reconcile-download",
      id: 99,
    });
  });

  it("never fails the download when the reconcile nudge rejects", async () => {
    // sendMessage rejects (e.g. no receiving end on Firefox / no registered
    // worker); it must be swallowed and never surface as "Download failed".
    globalThis.browser.runtime.sendMessage.mockRejectedValue(
      new Error("no receiving end"),
    );
    const provider = new DownloadProvider([tab]);

    await expect(provider.doActionToTab(tab)).resolves.toBeUndefined();
    await expect(provider.reconciliation).resolves.toBeUndefined();
    expect(globalThis.browser.storage.local.set).toHaveBeenCalledWith({
      "downloadTabItem-99": tab,
    });
  });
});
