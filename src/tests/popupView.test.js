/**
 * @jest-environment jsdom
 */
// Keep autoclose deterministic and out of the browser API for dispatch tests.
jest.mock("../js/closeTab.js", () => ({
  closeTabIfEnabled: jest.fn().mockResolvedValue(false),
}));

import { popupView } from "../js/popupView.js";
import { closeTabIfEnabled } from "../js/closeTab.js";
import { keys } from "../js/keys.js";

function makeRows(tabs, resolved) {
  return tabs.map((tab) => ({
    tab,
    checked: true,
    action: resolved,
    resolved,
    state: "queued",
    reason: null,
    gone: false,
  }));
}

describe("popupView per-provider bulk mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    popupView.autoclose = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Clipboard fulfillment marks every row in the group successful", async () => {
    const rows = makeRows([{ id: 1 }, { id: 2 }], "clipboard");
    jest.spyOn(popupView, "serviceFor").mockReturnValue({
      doActionToTabs: jest.fn().mockResolvedValue(undefined),
    });

    await popupView.pullClipboard(rows);

    expect(rows.map((r) => r.state)).toEqual(["successful", "successful"]);
  });

  it("Clipboard rejection marks every row in the group failed", async () => {
    const rows = makeRows([{ id: 1 }, { id: 2 }], "clipboard");
    jest.spyOn(popupView, "serviceFor").mockReturnValue({
      doActionToTabs: jest.fn().mockRejectedValue(new Error("copy failed")),
    });

    await popupView.pullClipboard(rows);

    expect(rows.map((r) => r.state)).toEqual(["failed", "failed"]);
  });

  it("Raindrop maps succeeded/failed to individual rows", async () => {
    const t1 = { id: 1 };
    const t2 = { id: 2 };
    const rows = makeRows([t1, t2], "raindrop");
    jest.spyOn(popupView, "serviceFor").mockReturnValue({
      doActionToTabs: jest
        .fn()
        .mockResolvedValue({ succeeded: [t1], failed: [t2] }),
    });

    await popupView.pullRaindrop(rows);

    expect(rows[0].state).toBe("successful");
    expect(rows[1].state).toBe("failed");
    expect(rows[1].reason).toBe("not saved");
  });

  it("close rows mark gone via the action itself, not closeTabIfEnabled", async () => {
    const rows = makeRows([{ id: 1 }], "close");
    jest.spyOn(popupView, "serviceFor").mockReturnValue({
      doActionToTab: jest.fn().mockResolvedValue(),
    });

    await popupView.pullPerTab("close", rows);

    expect(rows[0].state).toBe("successful");
    expect(rows[0].gone).toBe(true);
    expect(closeTabIfEnabled).not.toHaveBeenCalled();
  });

  it("non-close per-tab rows gate gone on closeTabIfEnabled", async () => {
    closeTabIfEnabled.mockResolvedValueOnce(true);
    const rows = makeRows([{ id: 1 }], "bookmark");
    jest.spyOn(popupView, "serviceFor").mockReturnValue({
      doActionToTab: jest.fn().mockResolvedValue(),
    });

    await popupView.pullPerTab("bookmark", rows);

    expect(rows[0].state).toBe("successful");
    expect(rows[0].gone).toBe(true);
    expect(closeTabIfEnabled).toHaveBeenCalledWith(rows[0].tab);
  });

  it("a thrown provider error fails only that row", async () => {
    const rows = makeRows([{ id: 1 }, { id: 2 }], "bookmark");
    const doActionToTab = jest
      .fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("Bookmark failed: 401 not authorized"));
    jest.spyOn(popupView, "serviceFor").mockReturnValue({ doActionToTab });

    await popupView.pullPerTab("bookmark", rows);

    expect(rows[0].state).toBe("successful");
    expect(rows[1].state).toBe("failed");
    expect(rows[1].reason).toBe("not authorized");
  });
});

describe("popupView download finalization", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    popupView.rows = [
      {
        tab: { id: 7 },
        checked: true,
        action: "download",
        resolved: "download",
        state: "pending",
        reason: null,
        gone: false,
      },
    ];
  });

  it("marks a completed download gone only when the worker closed the tab", () => {
    popupView.onDownloadStatus({ id: 7 }, "complete", true);
    expect(popupView.rows[0].state).toBe("successful");
    expect(popupView.rows[0].gone).toBe(true);
  });

  it("does not infer gone when closed is false", () => {
    popupView.onDownloadStatus({ id: 7 }, "complete", false);
    expect(popupView.rows[0].state).toBe("successful");
    expect(popupView.rows[0].gone).toBe(false);
  });

  it("fails the row on an interrupted download", () => {
    popupView.onDownloadStatus({ id: 7 }, "interrupted", false);
    expect(popupView.rows[0].state).toBe("failed");
    expect(popupView.rows[0].reason).toBe("download interrupted");
  });
});

describe("popupView.render", () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="tab-count"></div>' +
      '<div id="popup-body"></div>' +
      '<div id="popup-foot" class="rf-foot"></div>';
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn((query) => {
            if (query !== null && typeof query === "object") {
              return Promise.resolve({
                ...query,
                ...keys.preferences.services,
              });
            }
            // String keys (readLaterProvider) → unset, defaults apply.
            return Promise.resolve({});
          }),
        },
      },
    };
  });

  it("builds a row per tab and renders Save + built-in chips without ignore", async () => {
    await popupView.render([
      { id: 1, title: "A", url: "https://a.example" },
      { id: 2, title: "B", url: "https://b.example" },
    ]);

    expect(document.getElementById("tab-count").textContent).toBe("2");
    expect(document.querySelectorAll("#popup-body .rf-row").length).toBe(2);

    const chipActions = Array.from(
      document.querySelectorAll("#popup-body .rf-chip"),
    ).map((c) => c.getAttribute("data-action"));
    expect(chipActions).toEqual([
      "save",
      "bookmark",
      "download",
      "clipboard",
      "close",
    ]);
    expect(chipActions).not.toContain("ignore");

    // The per-row segmented picker does offer ignore.
    const segActions = Array.from(
      document.querySelectorAll("#popup-body .rf-row .rf-seg button"),
    ).map((b) => b.getAttribute("data-action"));
    expect(segActions).toContain("ignore");
  });

  it("drops closed tabs from the header count on repaint", async () => {
    await popupView.render([
      { id: 1, title: "A", url: "https://a.example" },
      { id: 2, title: "B", url: "https://b.example" },
    ]);
    expect(document.getElementById("tab-count").textContent).toBe("2");

    // Autoclose (or the close action) actually removed the first tab.
    popupView.rows[0].state = "successful";
    popupView.rows[0].gone = true;
    popupView.paint();

    expect(document.getElementById("tab-count").textContent).toBe("1");
  });
});
