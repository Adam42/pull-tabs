"use strict";
/*
 * Background service worker — owns download-completion tracking (Phase 7.2).
 *
 * Moving `downloads.onChanged` here means download completion + autoclose
 * survive the popup closing. This module imports ONLY storageKeys.js and uses
 * raw `browser.storage.local.*` directly, keeping the popup's DOM-bound module
 * graph (and any `window`/`localStorage` reference) out of the worker.
 */
import { AUTO_CLOSE, DOWNLOAD_ITEM_PREFIX } from "./storageKeys.js";

const TERMINAL_STATES = ["complete", "interrupted"];

//Downloads whose terminal event is currently being processed. The claim is
//taken synchronously at the top of handleTerminal — after processDownload has
//confirmed a record currently exists, but before any `await` — and being
//atomic across the single-threaded worker's async invocations it prevents a
//concurrent onChanged/reconcile pair from both processing the same id. (Loss on
//worker suspension is harmless: overlap only happens within a live worker
//window; post-suspension duplicates are caught by the record-absent guards.)
const inFlight = new Set();

/**
 * Process a download that has reached a terminal state exactly once: optionally
 * autoclose its tab, always clean up its tracking record, and always broadcast
 * the normalized status to any open popup.
 *
 * Claiming happens HERE (synchronously, before any await) rather than in
 * processDownload so that an onChanged which fires before Download.js has
 * written the record never holds a claim while reading a missing record — which
 * would block the post-store reconcile-download and orphan a fast download. The
 * record is then RE-READ under the claim: a stale caller whose pre-claim read
 * saw a record a prior handler has since removed is rejected, so the earlier
 * stale-read TOCTOU cannot double-process either. Never dropped, never doubled.
 *
 * @param {string} state "complete" | "interrupted"
 * @param {number|string} id The download id
 */
async function handleTerminal(state, id) {
  //Synchronous check-and-claim before any await — atomic within the worker.
  if (inFlight.has(id)) {
    return;
  }
  inFlight.add(id);

  const key = `${DOWNLOAD_ITEM_PREFIX}${id}`;

  try {
    //Re-read under the claim: reject a stale caller whose pre-claim read saw a
    //record that a concurrent handler has already processed and removed.
    const stored = await browser.storage.local.get(key);
    const tab = stored[key];
    if (typeof tab === "undefined") {
      return;
    }

    //Autoclose is isolated: a failure here must not stop cleanup/broadcast.
    //Track whether the tab was ACTUALLY removed so the popup receipt can render
    //"· tab closed" only when true (never inferred). Only a SUCCESSFUL download
    //("complete") may close the tab — an interrupted download must leave it
    //open (and broadcast closed:false), matching the receipt. The active-tab
    //guard and any failure also leave `closed` false.
    let closed = false;
    try {
      const pref = await browser.storage.local.get(AUTO_CLOSE);
      if (
        state === "complete" &&
        String(pref.autoCloseTabs) === "true" &&
        tab &&
        tab.active !== true
      ) {
        await browser.tabs.remove(tab.id);
        closed = true;
      }
    } catch (error) {
      console.warn("autoclose failed:", error && error.message);
    }

    //Always attempt to remove the tracking record, isolated so a rejection
    //can't skip the broadcast below. (A failed remove leaves the record for a
    //possible later retry; the claim + record-absent guards keep that from
    //double-processing.)
    try {
      await browser.storage.local.remove(key);
    } catch (error) {
      console.warn("record cleanup failed:", error && error.message);
    }

    //Always broadcast the normalized status to any open popup. A missing
    //receiving end (popup closed) is expected and swallowed.
    try {
      await browser.runtime.sendMessage({
        type: "download-status",
        state,
        tab,
        closed,
      });
    } catch (error) {
      const message = (error && error.message) || "";
      if (!/receiving end|message port|Could not establish/i.test(message)) {
        console.warn("download-status broadcast failed:", message);
      }
    }
  } finally {
    inFlight.delete(id);
  }
}

/**
 * Look up the tracked tab for a download id and, if we own it, hand it to
 * handleTerminal. The listener fires for EVERY browser download; a missing
 * record means the download is foreign OR not yet written (the post-store
 * reconcile will retry). We read WITHOUT claiming inFlight and no-op when
 * absent — claiming here would block that reconcile and orphan a fast download
 * whose record lands mid-read.
 *
 * @param {number|string} id    The download id from the delta/message
 * @param {string} state         The terminal state ("complete"|"interrupted")
 */
async function processDownload(id, state) {
  const key = `${DOWNLOAD_ITEM_PREFIX}${id}`;
  const stored = await browser.storage.local.get(key);

  if (typeof stored[key] === "undefined") {
    return;
  }

  await handleTerminal(state, id);
}

//Terminal-download listener. Wakes the worker; the async body is wrapped in an
//outer try/catch so a throw for one event can't disable the listener.
browser.downloads.onChanged.addListener(function (delta) {
  (async () => {
    try {
      const state = delta && delta.state && delta.state.current;
      if (!TERMINAL_STATES.includes(state)) {
        return;
      }
      await processDownload(delta.id, state);
    } catch (error) {
      console.warn("onChanged handler failed:", error && error.message);
    }
  })();
});

//Deterministic fast-download-race handler. Download.js sends this right after
//writing every download's record; the authoritative downloads.search runs HERE
//(in the durable worker, not the destructible popup) so the nudge survives the
//popup closing during the round trip. We derive the state and, only if terminal,
//process our own record if still present — non-terminal downloads no-op and are
//handled later by onChanged.
browser.runtime.onMessage.addListener(function (message) {
  if (!message || message.type !== "reconcile-download") {
    //Not ours: return undefined so other listeners keep their turn at the
    //message and this one doesn't claim the response channel.
    return;
  }
  //RETURN the reconciliation promise. In a Chrome MV3 service worker a fire-and-
  //forget IIFE (returning undefined) lets the worker be suspended as soon as the
  //message event's synchronous phase ends — before downloads.search /
  //processDownload run — so the reconcile could silently never complete. A
  //listener that returns a promise keeps the worker alive until it settles. The
  //whole body is wrapped so a throw resolves the channel rather than rejecting.
  return (async () => {
    try {
      //Re-derive the authoritative terminal state.
      const items = await browser.downloads.search({ id: message.id });
      const state = items && items[0] && items[0].state;
      if (!TERMINAL_STATES.includes(state)) {
        return;
      }

      //Re-read the record fresh (via processDownload) AFTER the search await —
      //never reuse a tab captured before it. If a concurrent onChanged already
      //processed and removed this record (clearing inFlight), processDownload
      //reads no record and no-ops, closing the TOCTOU across the await and
      //preserving the exactly-once autoclose/broadcast guarantee.
      await processDownload(message.id, state);
    } catch (error) {
      console.warn(
        "reconcile-download handler failed:",
        error && error.message,
      );
    }
  })();
});
