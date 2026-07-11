import { DOWNLOAD_ITEM_PREFIX } from "../js/storageKeys.js";

const key = (id) => `${DOWNLOAD_ITEM_PREFIX}${id}`;

// Let all pending microtasks/timeouts settle (the listeners run fire-and-forget
// async bodies that are not awaited by addListener).
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("background download tracking", () => {
  let onChanged;
  let onMessage;
  let store;

  async function loadBackground() {
    jest.resetModules();
    store = {};

    globalThis.browser = {
      downloads: {
        onChanged: {
          addListener: jest.fn((cb) => {
            onChanged = cb;
          }),
        },
        search: jest.fn().mockResolvedValue([{ id: 7, state: "complete" }]),
      },
      runtime: {
        onMessage: {
          addListener: jest.fn((cb) => {
            onMessage = cb;
          }),
        },
        sendMessage: jest.fn().mockResolvedValue(),
      },
      tabs: {
        remove: jest.fn().mockResolvedValue(),
      },
      storage: {
        local: {
          get: jest.fn((query) => {
            // Object query (e.g. AUTO_CLOSE default) → merge stored over defaults.
            if (query !== null && typeof query === "object") {
              const out = {};
              for (const k of Object.keys(query)) {
                out[k] = k in store ? store[k] : query[k];
              }
              return Promise.resolve(out);
            }
            // String key.
            return Promise.resolve(
              query in store ? { [query]: store[query] } : {},
            );
          }),
          set: jest.fn((obj) => {
            Object.assign(store, obj);
            return Promise.resolve();
          }),
          remove: jest.fn((k) => {
            delete store[k];
            return Promise.resolve();
          }),
        },
      },
    };

    await import("../js/background.js");
  }

  beforeEach(async () => {
    await loadBackground();
  });

  it("autocloses, cleans up, and broadcasts on a completed own-download", async () => {
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";

    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    expect(globalThis.browser.tabs.remove).toHaveBeenCalledWith(55);
    expect(store[key(7)]).toBeUndefined();
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "complete",
      tab,
      closed: true,
    });
  });

  it("does not autoclose when the preference is disabled", async () => {
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;

    onChanged({ id: 7, state: { current: "interrupted" } });
    await flush();

    expect(globalThis.browser.tabs.remove).not.toHaveBeenCalled();
    expect(store[key(7)]).toBeUndefined();
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "interrupted",
      tab,
      closed: false,
    });
  });

  it("never autocloses the active tab even when enabled", async () => {
    const tab = { id: 55, active: true, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";

    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    expect(globalThis.browser.tabs.remove).not.toHaveBeenCalled();
    // The active tab is never removed, so the broadcast reports closed:false
    // even though autoclose is enabled.
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "complete",
      tab,
      closed: false,
    });
  });

  it("never autocloses an interrupted download even when autoclose is enabled", async () => {
    // An interrupted download must leave the tab open (the receipt shows it
    // failed); only a successful "complete" download may autoclose.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";

    onChanged({ id: 7, state: { current: "interrupted" } });
    await flush();

    expect(globalThis.browser.tabs.remove).not.toHaveBeenCalled();
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "interrupted",
      tab,
      closed: false,
    });
  });

  it("ignores foreign downloads with no record", async () => {
    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    expect(globalThis.browser.storage.local.remove).not.toHaveBeenCalled();
    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("ignores non-terminal deltas", async () => {
    store[key(7)] = { id: 55, active: false };

    onChanged({ id: 7, state: { current: "in_progress" } });
    await flush();

    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();
    expect(store[key(7)]).toBeDefined();
  });

  it("still cleans up and broadcasts when tabs.remove rejects", async () => {
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";
    globalThis.browser.tabs.remove.mockRejectedValue(new Error("gone"));

    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    expect(store[key(7)]).toBeUndefined();
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalled();
  });

  it("still broadcasts and stays usable when record cleanup rejects", async () => {
    // Regression (Codex review): record removal must be isolated so a rejecting
    // storage.local.remove can never skip the terminal broadcast or disable the
    // listener.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    globalThis.browser.storage.local.remove.mockRejectedValueOnce(
      new Error("storage gone"),
    );

    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    // Broadcast still fired despite the cleanup failure. Autoclose was off,
    // so closed is false.
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "complete",
      tab,
      closed: false,
    });

    // Listener remains usable: a subsequent download processes normally.
    const tab2 = { id: 66, active: false, title: "T2", url: "https://y" };
    store[key(8)] = tab2;
    onChanged({ id: 8, state: { current: "interrupted" } });
    await flush();

    expect(store[key(8)]).toBeUndefined();
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "interrupted",
      tab: tab2,
      closed: false,
    });
  });

  it("fires exactly once for a concurrent onChanged + reconcile of the same id", async () => {
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";

    // Both events for the same download in flight while the worker is alive.
    onChanged({ id: 7, state: { current: "complete" } });
    onMessage({ type: "reconcile-download", id: 7 });
    await flush();

    expect(globalThis.browser.tabs.remove).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not double-handle when reconcile's search resolves after onChanged completes", async () => {
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";

    // Park reconcile's search() until we release it.
    let resolveSearch;
    globalThis.browser.downloads.search.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );

    // Reconcile starts and blocks on search.
    onMessage({ type: "reconcile-download", id: 7 });
    await flush();

    // onChanged fully processes: autocloses, removes the record, clears inFlight.
    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    expect(globalThis.browser.tabs.remove).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(store[key(7)]).toBeUndefined();

    // Now release reconcile's search: the record is gone, so it must no-op.
    resolveSearch([{ id: 7, state: "complete" }]);
    await flush();

    expect(globalThis.browser.tabs.remove).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("does not drop a fast download when onChanged fires before the record and reconcile arrives mid-read", async () => {
    // Regression (Codex review): onChanged can fire before Download.js has
    // written the record. If processDownload claimed inFlight before reading,
    // that claim would be held across the missing-record read and the post-store
    // reconcile-download — arriving mid-read — would return on the busy claim and
    // the download would be orphaned (no cleanup/autoclose/broadcast). Reading
    // WITHOUT claiming when absent keeps reconcile free to handle it.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store.autoCloseTabs = "true";
    // Record deliberately NOT written yet — the fast download beat the store.

    // Park string-key record reads; resolve them against the LIVE store at the
    // moment we release each, so timing controls what they see.
    const pendingReads = [];
    globalThis.browser.storage.local.get.mockImplementation((query) => {
      if (query !== null && typeof query === "object") {
        const out = {};
        for (const k of Object.keys(query)) {
          out[k] = k in store ? store[k] : query[k];
        }
        return Promise.resolve(out);
      }
      return new Promise((resolve) => {
        pendingReads.push(() =>
          resolve(query in store ? { [query]: store[query] } : {}),
        );
      });
    });

    // onChanged fires before the record exists → issues a record read (pending)
    // and takes NO inFlight claim.
    onChanged({ id: 7, state: { current: "complete" } });
    await flush();
    expect(pendingReads.length).toBe(1);

    // reconcile arrives while that read is still pending. Because onChanged holds
    // no claim, reconcile proceeds and issues its OWN record read — the crux of
    // the fix (a pre-read claim would have dropped it here, leaving length 1).
    onMessage({ type: "reconcile-download", id: 7 });
    await flush();
    expect(pendingReads.length).toBe(2);

    // onChanged's read resolves while the record still doesn't exist → no-op.
    pendingReads[0]();
    await flush();
    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();

    // Download.js has now written the record; reconcile's read resolves present
    // and drives the single terminal handling (claim + reread + process).
    store[key(7)] = tab;
    pendingReads[1]();
    await flush();
    pendingReads[2](); // handleTerminal's reread, now pending
    await flush();

    expect(globalThis.browser.tabs.remove).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "complete",
      tab,
      closed: true,
    });
    expect(store[key(7)]).toBeUndefined();
  });

  it("fires once even if a second stale record read resolves after the first handler removed it", async () => {
    // Regression (Codex review): a stale caller whose pre-claim presence read
    // saw the record must not double-process after another handler removed it.
    // The claim is taken (synchronously) in handleTerminal and the record is
    // RE-READ under it. Even after the first handler fully completes and frees
    // the claim, a stale second caller (whose presence read snapshotted the
    // record before removal) is rejected by that reread. Park each record read,
    // capturing the store snapshot at ISSUE time so a stale read is faithful.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    store.autoCloseTabs = "true";

    const recordReads = [];
    globalThis.browser.storage.local.get.mockImplementation((query) => {
      // AUTO_CLOSE default-object query → serve the live store over defaults.
      if (query !== null && typeof query === "object") {
        const out = {};
        for (const k of Object.keys(query)) {
          out[k] = k in store ? store[k] : query[k];
        }
        return Promise.resolve(out);
      }
      // String key (the tracking record): park it, capturing the record
      // snapshot from the moment the read was issued (i.e. potentially stale).
      const snapshot = query in store ? { [query]: store[query] } : {};
      return new Promise((resolve) => {
        recordReads.push(() => resolve(snapshot));
      });
    });

    // Two terminal events for the same id fire while the record still exists;
    // each issues its (unclaimed) presence read with a present snapshot.
    onChanged({ id: 7, state: { current: "complete" } });
    onChanged({ id: 7, state: { current: "complete" } });
    await flush();
    // recordReads: [presence#1, presence#2]

    // Resolve presence#1 → handleTerminal claims and issues its reread.
    recordReads[0]();
    await flush();
    // recordReads: [presence#1, presence#2, reread#1]

    // Resolve reread#1 → handler #1 fully completes: autocloses, removes the
    // record, broadcasts, and RELEASES the claim.
    recordReads[2]();
    await flush();
    expect(store[key(7)]).toBeUndefined();
    expect(globalThis.browser.tabs.remove).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);

    // Resolve presence#2 (stale: still present) → handler #2 claims the now-free
    // id and issues its own reread.
    recordReads[1]();
    await flush();
    // recordReads: [..., reread#2]

    // Resolve reread#2 → record is gone → handler #2 no-ops. No double.
    recordReads[3]();
    await flush();

    expect(globalThis.browser.tabs.remove).toHaveBeenCalledTimes(1);
    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("reconcile listener returns a promise that settles only after processing", async () => {
    // Regression (Codex review): a fire-and-forget IIFE returns undefined, so a
    // Chrome MV3 worker can be suspended before search/processDownload run. The
    // listener must RETURN its processing promise to stay alive to completion.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    globalThis.browser.downloads.search.mockResolvedValue([
      { id: 7, state: "complete" },
    ]);

    const result = onMessage({ type: "reconcile-download", id: 7 });
    // A thenable is returned (keeps the worker alive)...
    expect(result && typeof result.then).toBe("function");
    // ...and the terminal broadcast happens only once it settles.
    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();

    await result;

    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "complete",
      tab,
      closed: false,
    });
    expect(store[key(7)]).toBeUndefined();
  });

  it("reconcile no-ops when the download is not yet terminal", async () => {
    // The provider now nudges for EVERY started download; the background is the
    // authority and must no-op (no cleanup/broadcast) while still in progress.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(7)] = tab;
    globalThis.browser.downloads.search.mockResolvedValue([
      { id: 7, state: "in_progress" },
    ]);

    await onMessage({ type: "reconcile-download", id: 7 });

    expect(globalThis.browser.runtime.sendMessage).not.toHaveBeenCalled();
    expect(store[key(7)]).toBeDefined();
  });

  it("reconcile listener ignores unrelated messages without claiming the channel", () => {
    const result = onMessage({ type: "something-else" });
    // Returning undefined lets other listeners own the response channel.
    expect(result).toBeUndefined();
    expect(globalThis.browser.downloads.search).not.toHaveBeenCalled();
  });

  it("keeps the listener alive after a handler error", async () => {
    // First event: get throws once.
    globalThis.browser.storage.local.get.mockRejectedValueOnce(
      new Error("boom"),
    );
    onChanged({ id: 7, state: { current: "complete" } });
    await flush();

    // Second event still processed normally.
    const tab = { id: 55, active: false, title: "T", url: "https://x" };
    store[key(8)] = tab;
    globalThis.browser.downloads.search.mockResolvedValue([
      { id: 8, state: "complete" },
    ]);
    onChanged({ id: 8, state: { current: "complete" } });
    await flush();

    expect(globalThis.browser.runtime.sendMessage).toHaveBeenCalledWith({
      type: "download-status",
      state: "complete",
      tab,
      closed: false,
    });
  });
});
