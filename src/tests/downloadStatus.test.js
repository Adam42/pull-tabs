/**
 * @jest-environment jsdom
 */
// Keep the popup module graph out of this unit test.
jest.mock("../js/uiSimple.js", () => ({ uiSimple: { updateUI: jest.fn() } }));
jest.mock("../js/form.js", () => ({
  form: { removeLabelStatus: jest.fn(), setLabelStatus: jest.fn() },
}));

import { downloadStatus } from "../js/downloadStatus.js";
import { uiSimple } from "../js/uiSimple.js";
import { form } from "../js/form.js";

describe("downloadStatus.handle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("renders exactly one text line for a completed download", () => {
    const tab = { title: "T", url: "https://x", labelTabId: null };

    downloadStatus.handle({ type: "download-status", state: "complete", tab });

    expect(uiSimple.updateUI).toHaveBeenCalledTimes(1);
    expect(uiSimple.updateUI).toHaveBeenCalledWith(
      tab,
      "Completed downloading ",
      "success",
    );
    expect(form.setLabelStatus).not.toHaveBeenCalled();
  });

  it("renders an error line for an interrupted download", () => {
    const tab = { title: "T", url: "https://x" };

    downloadStatus.handle({
      type: "download-status",
      state: "interrupted",
      tab,
    });

    expect(uiSimple.updateUI).toHaveBeenCalledWith(
      tab,
      "Error: failed downloading ",
      "danger",
    );
  });

  it("updates the advanced label only when its element exists", () => {
    const tab = { title: "T", url: "https://x", labelTabId: 3 };

    // No matching element → text line only.
    downloadStatus.handle({ type: "download-status", state: "complete", tab });
    expect(form.setLabelStatus).not.toHaveBeenCalled();

    // With the element present → label is additionally updated.
    const el = document.createElement("label");
    el.id = "label-tab-3";
    document.body.appendChild(el);
    downloadStatus.handle({ type: "download-status", state: "complete", tab });

    expect(form.removeLabelStatus).toHaveBeenCalledWith(
      tab,
      "list-group-item-info",
    );
    expect(form.setLabelStatus).toHaveBeenCalledWith(tab, "successful");
  });

  it("does not throw when the tab has no label element", () => {
    const tab = { title: "T", url: "https://x" };

    expect(() =>
      downloadStatus.handle({
        type: "download-status",
        state: "complete",
        tab,
      }),
    ).not.toThrow();
  });
});

describe("downloadStatus.init", () => {
  it("registers exactly one listener even when called twice", async () => {
    // Regression (Codex review): init() must be idempotent so a re-entered
    // displayLayout can't stack duplicate subscribers (which would render every
    // download-status message multiple times). Import a fresh module so the
    // module-level `initialized` flag starts clean.
    jest.resetModules();
    const addListener = jest.fn();
    globalThis.browser = { runtime: { onMessage: { addListener } } };

    const { downloadStatus: fresh } = await import("../js/downloadStatus.js");
    fresh.init();
    fresh.init();

    expect(addListener).toHaveBeenCalledTimes(1);
  });
});
