/**
 * @jest-environment jsdom
 */
import { downloadStatus } from "../js/downloadStatus.js";

describe("downloadStatus.handle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    downloadStatus.onStatus = null;
  });

  it("forwards a completed download to the registered view callback", () => {
    const onStatus = jest.fn();
    downloadStatus.onStatus = onStatus;
    const tab = { id: 3, title: "T", url: "https://x" };

    downloadStatus.handle({
      type: "download-status",
      state: "complete",
      tab,
      closed: true,
    });

    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith(tab, "complete", true);
  });

  it("passes closed:false through for an interrupted download", () => {
    const onStatus = jest.fn();
    downloadStatus.onStatus = onStatus;
    const tab = { id: 4, title: "T", url: "https://x" };

    downloadStatus.handle({
      type: "download-status",
      state: "interrupted",
      tab,
      closed: false,
    });

    expect(onStatus).toHaveBeenCalledWith(tab, "interrupted", false);
  });

  it("normalizes a missing closed flag to false", () => {
    const onStatus = jest.fn();
    downloadStatus.onStatus = onStatus;
    const tab = { id: 5, title: "T", url: "https://x" };

    downloadStatus.handle({ type: "download-status", state: "complete", tab });

    expect(onStatus).toHaveBeenCalledWith(tab, "complete", false);
  });

  it("does not throw when no view callback is registered", () => {
    const tab = { id: 6, title: "T", url: "https://x" };

    expect(() =>
      downloadStatus.handle({
        type: "download-status",
        state: "complete",
        tab,
      }),
    ).not.toThrow();
  });

  it("ignores a broadcast with no tab", () => {
    const onStatus = jest.fn();
    downloadStatus.onStatus = onStatus;

    downloadStatus.handle({ type: "download-status", state: "complete" });

    expect(onStatus).not.toHaveBeenCalled();
  });
});

describe("downloadStatus.init", () => {
  it("registers exactly one listener even when called twice", async () => {
    // Regression (Codex review): init() must be idempotent so a re-entered
    // render can't stack duplicate subscribers (which would render every
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

  it("routes only download-status messages to handle()", async () => {
    jest.resetModules();
    let listener;
    globalThis.browser = {
      runtime: {
        onMessage: {
          addListener: jest.fn((cb) => {
            listener = cb;
          }),
        },
      },
    };

    const { downloadStatus: fresh } = await import("../js/downloadStatus.js");
    fresh.init();
    const onStatus = jest.fn();
    fresh.onStatus = onStatus;

    listener({ type: "something-else", tab: { id: 1 } });
    expect(onStatus).not.toHaveBeenCalled();

    listener({ type: "download-status", state: "complete", tab: { id: 1 } });
    expect(onStatus).toHaveBeenCalledTimes(1);
  });
});
