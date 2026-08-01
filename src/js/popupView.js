"use strict";
/**
 * Merged tab-list + receipt controller (0.21 "quiet paper" redesign).
 *
 * Replaces the old Simple/Advanced split (uiSimple/uiAdvanced/form) with ONE
 * model: every open tab is a row; you set all rows at once via the chip toolbar
 * or override any single row via its segmented picker, then run the whole pile
 * with one sticky-footer CTA. After the pull the same list becomes the
 * "receipt" — each row shows queued → pulling → result, with inline retry —
 * so there are no stacked status banners (this view never touches message.js or
 * a `#status` element).
 *
 * Dispatch is owned here (not `UI.doActionToTabForTabs`): rows are grouped by
 * their RESOLVED action and each group is handled with the right shape —
 * per-tab loop, Raindrop `{succeeded, failed}`, or Clipboard fulfill-all /
 * reject-all. Autoclose goes through the awaitable `closeTabIfEnabled` so the
 * receipt only says "tab closed" when a tab actually closed; downloads finalize
 * from the background broadcast (`downloadStatus.onStatus`, carrying `closed`).
 */
import ServiceFactory from "./services/ServiceFactory.js";
import storage from "./storage.js";
import { keys } from "./keys.js";
import {
  AUTO_CLOSE,
  DEFAULT_ACTION,
  DEFAULT_ACTION_VALUE,
  SERVICE_SAVE,
} from "./storageKeys.js";
import {
  UI_ACTIONS,
  getActiveProvider,
  iconForAction,
  resolveAction,
} from "./saveAction.js";
import { closeTabIfEnabled } from "./closeTab.js";
import { downloadStatus } from "./downloadStatus.js";
import { pastTense } from "./actionLabels.js";

/** Fallback priority when the stored default action is hidden or unavailable. */
const FALLBACK_ORDER = ["bookmark", "download", "clipboard", "close", "save"];

// Small DOM builder — keeps everything textContent-based (no innerHTML).
function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    // eslint-disable-next-line guard-for-in -- props is a plain literal
    for (const key in props) {
      if (key === "class") {
        node.className = props[key];
      } else if (key === "text") {
        node.textContent = props[key];
      } else if (key === "onClick") {
        node.addEventListener("click", props[key]);
      } else if (typeof props[key] !== "undefined" && props[key] !== null) {
        node.setAttribute(key, props[key]);
      }
    }
  }
  (children || []).forEach((child) => {
    if (child === null || typeof child === "undefined") {
      return;
    }
    node.appendChild(
      typeof child === "string" ? document.createTextNode(child) : child,
    );
  });
  return node;
}

// An action glyph as an <img>, optionally inverted for an "on" background.
function iconImg(name, size, invert) {
  const img = el("img", {
    src: "img/" + name + ".svg",
    alt: "",
    width: size,
    height: size,
  });
  img.style.height = size + "px";
  img.style.width = size + "px";
  if (invert) {
    img.style.filter = "brightness(0) invert(1)";
  }
  return img;
}

// A favicon tile for a tab: the real favicon when present, else a plain chip.
function faviconTile(tab) {
  if (tab.favIconUrl && /^https?:|^data:/.test(tab.favIconUrl)) {
    const img = el("img", { src: tab.favIconUrl, alt: "" });
    img.addEventListener("error", () => {
      img.style.display = "none";
    });
    return el("span", { class: "fav fav-real" }, [img]);
  }
  return el("span", { class: "fav" });
}

// Strip a URL down to a compact host+path for the row's mono subtitle.
function shortUrl(url) {
  return String(url || "").replace(/^https?:\/\//, "");
}

// Turn a thrown provider error into a short, human receipt reason.
function reasonFrom(error) {
  const message = (error && error.message) || "failed";
  if (
    /401|unauthor|not authorized|invalid.*(token|credential)/i.test(message)
  ) {
    return "not authorized";
  }
  if (/missing.*(token|credential|url|username)/i.test(message)) {
    return "not connected";
  }
  // Trim the provider prefix ("Raindrop failed: …") for brevity.
  return message.replace(/^[A-Za-z]+ failed:\s*/, "");
}

export var popupView = popupView || {
  /** @type {{tab: object, checked: boolean, action: string, resolved: ?string, state: ?string, reason: ?string, gone: boolean}[]} */
  rows: [],
  /** UI actions currently visible as set-all chips (save + enabled built-ins). */
  chipActions: [],
  /** Row-picker actions: chipActions plus the always-present "ignore". */
  rowActions: [],
  /** The resolved active read-later provider (for the Save glyph). */
  activeProvider: "instapaper",
  /** Whether autoclose is enabled (for footer flag + "tabs closed" wording). */
  autoclose: false,

  /**
   * Build the merged view from the current window's tabs.
   * @param  {object[]} tabs Collection of browser tab objects
   * @return {Promise} Resolves once the initial list is rendered
   */
  render: async function (tabs) {
    const [services, defaults, autoPref, provider] = await Promise.all([
      storage.retrieve(keys.preferences.services),
      storage.retrieve({ [DEFAULT_ACTION]: DEFAULT_ACTION_VALUE }),
      storage.retrieve(AUTO_CLOSE),
      getActiveProvider(),
    ]);

    this.activeProvider = provider;
    this.autoclose = String(autoPref.autoCloseTabs) === "true";

    // Visible chip actions: Save uses its own flag; built-ins use service_<id>.
    this.chipActions = UI_ACTIONS.filter((a) => {
      const key = a.id === "save" ? SERVICE_SAVE : "service_" + a.id;
      return String(services[key]) === "enabled";
    });
    this.rowActions = this.chipActions.concat([
      { id: "ignore", label: "Ignore", icon: "ignore" },
    ]);

    const preset = this.resolveDefaultAction(defaults[DEFAULT_ACTION]);
    this.rows = tabs.map((tab) => ({
      tab,
      checked: true,
      action: preset,
      resolved: null,
      state: null,
      reason: null,
      gone: false,
    }));

    // Receive terminal download status from the background worker.
    downloadStatus.onStatus = this.onDownloadStatus.bind(this);

    this.paint();
  },

  /**
   * Pick the action every row is preset to when the popup opens: the stored
   * default when it is a visible chip action, else the first available action
   * in FALLBACK_ORDER, else "ignore".
   * @param  {string} stored The stored `defaultAction` value
   * @return {string} A concrete UI action id
   */
  resolveDefaultAction: function (stored) {
    const visible = new Set(this.chipActions.map((a) => a.id));
    if (visible.has(stored)) {
      return stored;
    }
    const fallback = FALLBACK_ORDER.find((id) => visible.has(id));
    return fallback || "ignore";
  },

  // The rows that a pull would act on: checked and not set to Ignore.
  activeRows: function () {
    return this.rows.filter((r) => r.checked && r.action !== "ignore");
  },

  // True while any row is still queued or in-flight.
  isPulling: function () {
    return this.rows.some((r) => r.state === "queued" || r.state === "pending");
  },

  // True once a pull has started (any row carries a receipt state).
  hasResults: function () {
    return this.rows.some((r) => r.state !== null);
  },

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------

  paint: function () {
    const count = document.getElementById("tab-count");
    if (count) {
      // Header shows tabs still open: rows whose tab autoclose (or the close
      // action) has actually removed drop out of the count.
      count.textContent = String(this.rows.filter((r) => !r.gone).length);
    }

    const body = document.getElementById("popup-body");
    const foot = document.getElementById("popup-foot");
    if (!body || !foot) {
      return;
    }
    body.textContent = "";
    foot.textContent = "";

    body.appendChild(this.buildSectionHeader());
    if (this.hasResults()) {
      body.appendChild(this.buildReceiptSummary());
    } else {
      body.appendChild(this.buildToolbar());
    }
    body.appendChild(this.buildCard());

    foot.appendChild(
      this.hasResults() ? this.buildResultFoot() : this.buildSetupFoot(),
    );
  },

  buildSectionHeader: function () {
    const active = this.activeRows().length;
    const total = this.rows.length;
    let kicker;
    let title;
    if (this.hasResults()) {
      title = "Pulling tabs";
      const processed = this.rows.filter(
        (r) => r.state === "successful" || r.state === "failed",
      ).length;
      const pulled = this.rows.filter((r) => r.state !== null).length;
      kicker = this.isPulling()
        ? processed + "/" + pulled + " processed"
        : "finished";
    } else {
      title = "Open tabs";
      kicker = active + "/" + total + " selected";
    }
    return el("div", { class: "section-header" }, [
      el("h3", { text: title }),
      el("span", { class: "kicker", text: kicker }),
    ]);
  },

  buildToolbar: function () {
    const allSame =
      this.rows.length &&
      this.rows.every((r) => r.action === this.rows[0].action)
        ? this.rows[0].action
        : null;

    const chips = this.chipActions.map((a) => {
      const on = allSame === a.id;
      const icon = iconImg(iconForAction(a.id, this.activeProvider), 15, on);
      return el(
        "button",
        {
          type: "button",
          class: "rf-chip" + (on ? " on" : ""),
          "data-action": a.id,
          title: "Set every tab to " + a.label,
          onClick: () => this.setAllAction(a.id),
        },
        [icon, el("span", { text: a.label })],
      );
    });

    return el("div", { class: "rf-toolbar" }, [
      el("span", { class: "label", text: "Set all →" }),
      el("div", { class: "rf-chips" }, chips),
    ]);
  },

  buildCard: function () {
    const card = el("div", { class: "rf-card" });
    this.rows.forEach((row) => card.appendChild(this.buildRow(row)));
    return card;
  },

  buildRow: function (row) {
    const state = row.state;
    let cls = "rf-row";
    if (state === "successful") {
      cls += " done";
    } else if (state === "failed") {
      cls += " fail";
    } else if (state === "pending") {
      cls += " pending";
    } else if (state === "queued") {
      cls += " queued";
    } else if (!row.checked) {
      cls += " off";
    }
    if (row.gone) {
      cls += " gone";
    }

    const children = [];

    if (this.hasResults()) {
      // Receipt row: fixed resolved-action glyph, no checkbox.
      const glyph = row.resolved || row.action;
      children.push(iconImg(glyph === "ignore" ? "ignore" : glyph, 17, false));
    } else {
      children.push(this.buildCheck(row));
    }

    children.push(faviconTile(row.tab));
    children.push(
      el("div", { class: "rf-row-text" }, [
        el("div", { class: "rf-title", text: row.tab.title || row.tab.url }),
        el("div", { class: "rf-url", text: shortUrl(row.tab.url) }),
      ]),
    );

    children.push(
      this.hasResults() ? this.buildResultCell(row) : this.buildSeg(row),
    );

    return el("div", { class: cls }, children);
  },

  buildCheck: function (row) {
    const input = el("input", { type: "checkbox" });
    input.checked = row.checked;
    input.addEventListener("change", () => {
      row.checked = input.checked;
      row.state = null;
      this.paint();
    });
    return el("label", { class: "check" }, [
      input,
      el("span", { class: "box" }),
    ]);
  },

  buildSeg: function (row) {
    const buttons = this.rowActions.map((a) => {
      const on = row.action === a.id;
      const icon = iconImg(iconForAction(a.id, this.activeProvider), 15, on);
      return el(
        "button",
        {
          type: "button",
          class: on ? "on" : "",
          title: a.label,
          "data-action": a.id,
          onClick: () => {
            row.action = a.id;
            row.state = null;
            this.paint();
          },
        },
        [icon],
      );
    });
    return el("div", { class: "rf-seg" }, buttons);
  },

  buildResultCell: function (row) {
    if (row.state === "pending") {
      return el("span", { class: "rf-reswrap" }, [
        el("span", { class: "rf-spin" }),
        (() => {
          const s = el("span", { class: "rf-result", text: "pulling…" });
          s.style.color = "var(--info)";
          return s;
        })(),
      ]);
    }
    if (row.state === "queued") {
      const s = el("span", { class: "rf-result", text: "queued" });
      s.style.color = "var(--ink-3)";
      return s;
    }
    if (row.state === "successful") {
      let text = "✓ " + pastTense(row.resolved || row.action);
      if (row.gone && row.resolved !== "close") {
        text += " · tab closed";
      }
      return el("span", { class: "rf-result", text: text });
    }
    if (row.state === "failed") {
      const info = el("span", {}, [
        el("span", { class: "rf-result", text: "✕ failed" }),
        el("span", { class: "rf-reason", text: row.reason || "failed" }),
      ]);
      info.style.textAlign = "right";
      return el("span", { class: "rf-reswrap" }, [
        info,
        el("button", {
          type: "button",
          class: "btn btn-sm",
          text: "Retry",
          onClick: () => this.retryRow(row),
        }),
      ]);
    }
    // Skipped (unchecked / ignored but somehow rendered).
    const s = el("span", { class: "rf-result", text: "skipped" });
    s.style.color = "var(--ink-3)";
    return s;
  },

  buildReceiptSummary: function () {
    const pulled = this.rows.filter((r) => r.state !== null);
    const done = pulled.filter((r) => r.state === "successful").length;
    const failed = pulled.filter((r) => r.state === "failed").length;
    const total = pulled.length;
    const working = this.isPulling();

    let cls = "rf-summary";
    const children = [];
    if (working) {
      children.push(el("span", { class: "rf-spin" }));
      children.push(
        el("span", {
          text:
            "Pulling " +
            total +
            " tabs — " +
            (done + failed) +
            " of " +
            total +
            " done",
        }),
      );
    } else if (failed > 0) {
      cls += " bad";
      children.push(el("span", { text: "✕" }));
      children.push(
        el("span", {
          text: done + " of " + total + " pulled — " + failed + " failed.",
        }),
      );
      children.push(
        el("span", {
          class: "meta",
          text: "retry below, or reconnect the service in Options",
        }),
      );
    } else {
      cls += " ok";
      children.push(el("span", { text: "✓" }));
      const closedAny = this.rows.some((r) => r.gone);
      children.push(
        el("span", {
          text:
            "All " +
            total +
            " tabs pulled" +
            (this.autoclose && closedAny ? " — tabs closed" : "") +
            ".",
        }),
      );
    }
    return el("div", { class: cls }, children);
  },

  buildSetupFoot: function () {
    const active = this.activeRows();
    const allSame =
      this.rows.length &&
      this.rows.every((r) => r.action === this.rows[0].action)
        ? this.rows[0].action
        : null;
    const label = allSame ? this.actionLabel(allSame) : "mixed actions";
    const meta = el("span", {
      class: "meta",
      text: active.length + " tabs → " + label,
    });

    const right = el("div", { class: "rf-footright" });
    if (this.autoclose) {
      right.appendChild(el("span", { class: "meta", text: "AUTOCLOSE ON" }));
    }
    const cta = el("button", {
      type: "button",
      class: "btn btn-primary",
      text: "Pull " + active.length + " tab" + (active.length === 1 ? "" : "s"),
      onClick: () => this.startPull(),
    });
    if (active.length === 0) {
      cta.setAttribute("disabled", "disabled");
    }
    right.appendChild(cta);

    return this.footBar(meta, right);
  },

  buildResultFoot: function () {
    const pulled = this.rows.filter((r) => r.state !== null);
    const done = pulled.filter((r) => r.state === "successful").length;
    const failed = pulled.filter((r) => r.state === "failed").length;
    const working = this.isPulling();

    let metaText = "done";
    if (working) {
      metaText = "working — leave this window open";
    } else if (failed) {
      metaText = done + " done · " + failed + " failed";
    }
    const meta = el("span", { class: "meta", text: metaText });

    const right = el("div", { class: "rf-footright" });
    if (failed > 0 && !working) {
      right.appendChild(
        el("button", {
          type: "button",
          class: "btn btn-primary",
          text: "Retry " + failed + " failed",
          onClick: () => this.retryAll(),
        }),
      );
    }
    return this.footBar(meta, right);
  },

  footBar: function (left, right) {
    // #popup-foot already carries .rf-foot (a space-between flex row); a
    // fragment drops both children in as direct flex children.
    const frag = document.createDocumentFragment();
    frag.appendChild(left);
    frag.appendChild(right);
    return frag;
  },

  actionLabel: function (id) {
    const entry = this.rowActions.find((a) => a.id === id);
    return entry ? entry.label : id;
  },

  setAllAction: function (id) {
    this.rows.forEach((r) => {
      r.action = id;
      r.state = null;
    });
    this.paint();
  },

  // ------------------------------------------------------------------
  // Pull dispatch
  // ------------------------------------------------------------------

  startPull: async function () {
    const rows = this.activeRows();
    if (rows.length === 0) {
      return;
    }
    rows.forEach((r) => {
      r.state = "queued";
      r.reason = null;
      r.gone = false;
    });
    this.paint();
    await this.pullRows(rows);
  },

  retryAll: async function () {
    const rows = this.rows.filter((r) => r.state === "failed");
    rows.forEach((r) => {
      r.state = "queued";
      r.reason = null;
      r.gone = false;
    });
    this.paint();
    await this.pullRows(rows);
  },

  retryRow: async function (row) {
    row.state = "queued";
    row.reason = null;
    row.gone = false;
    this.paint();
    await this.pullRows([row]);
  },

  /**
   * Resolve each row's action, group by resolved provider, and dispatch each
   * group with the shape that provider needs. Download rows finish later via
   * the background broadcast, so they stay `pending` when this returns.
   * @param  {object[]} rows Row models to run
   * @return {Promise} Resolves once every non-download group has settled
   */
  // The pull is deliberately SEQUENTIAL: rows and groups settle one at a time
  // so the receipt updates progressively and provider APIs aren't hammered in
  // parallel. The awaits below are therefore intentionally inside loops.
  /* eslint-disable no-await-in-loop */
  pullRows: async function (rows) {
    for (const row of rows) {
      row.resolved = await resolveAction(row.action);
    }

    const groups = new Map();
    rows.forEach((row) => {
      if (!groups.has(row.resolved)) {
        groups.set(row.resolved, []);
      }
      groups.get(row.resolved).push(row);
    });

    for (const [resolved, groupRows] of groups) {
      if (resolved === "clipboard") {
        await this.pullClipboard(groupRows);
      } else if (resolved === "raindrop") {
        await this.pullRaindrop(groupRows);
      } else if (resolved === "download") {
        await this.pullDownload(groupRows);
      } else {
        await this.pullPerTab(resolved, groupRows);
      }
    }
    this.paint();
  },

  serviceFor: function (resolved, rows) {
    const Service = ServiceFactory.convertActionToProvider(resolved);
    return new Service(rows.map((r) => r.tab));
  },

  pullPerTab: async function (resolved, rows) {
    const service = this.serviceFor(resolved, rows);
    for (const row of rows) {
      row.state = "pending";
      this.paint();
      try {
        await service.doActionToTab(row.tab);
        if (resolved === "close") {
          // The action itself closed the tab.
          row.state = "successful";
          row.gone = true;
        } else {
          const closed = await closeTabIfEnabled(row.tab);
          row.state = "successful";
          row.gone = closed;
        }
      } catch (error) {
        row.state = "failed";
        row.reason = reasonFrom(error);
      }
      this.paint();
    }
  },

  pullClipboard: async function (rows) {
    const service = this.serviceFor("clipboard", rows);
    rows.forEach((r) => {
      r.state = "pending";
    });
    this.paint();
    try {
      // Clipboard resolves undefined on success and rejects on failure — the
      // whole group succeeds or fails together.
      await service.doActionToTabs();
      for (const row of rows) {
        const closed = await closeTabIfEnabled(row.tab);
        row.state = "successful";
        row.gone = closed;
      }
    } catch (error) {
      rows.forEach((r) => {
        r.state = "failed";
        r.reason = reasonFrom(error);
      });
    }
    this.paint();
  },

  pullRaindrop: async function (rows) {
    const service = this.serviceFor("raindrop", rows);
    rows.forEach((r) => {
      r.state = "pending";
    });
    this.paint();
    try {
      const result = await service.doActionToTabs();
      const succeeded = new Set((result.succeeded || []).map((t) => t.id));
      for (const row of rows) {
        if (succeeded.has(row.tab.id)) {
          const closed = await closeTabIfEnabled(row.tab);
          row.state = "successful";
          row.gone = closed;
        } else {
          row.state = "failed";
          row.reason = "not saved";
        }
      }
    } catch (error) {
      rows.forEach((r) => {
        r.state = "failed";
        r.reason = reasonFrom(error);
      });
    }
    this.paint();
  },

  pullDownload: async function (rows) {
    const service = this.serviceFor("download", rows);
    for (const row of rows) {
      row.state = "pending";
      this.paint();
      try {
        // Resolves once the download STARTS; the background worker reports the
        // terminal state (and whether it closed the tab) via onDownloadStatus.
        await service.doActionToTab(row.tab);
      } catch (error) {
        row.state = "failed";
        row.reason = reasonFrom(error);
        this.paint();
      }
    }
  },
  /* eslint-enable no-await-in-loop */

  /**
   * Finalize a download row from the background broadcast. `closed` is the
   * ground truth from the worker — the receipt never infers autoclose.
   * @param  {object} tab   The tab the download belonged to
   * @param  {string} state "complete" | "interrupted"
   * @param  {boolean} closed Whether the worker actually removed the tab
   */
  onDownloadStatus: function (tab, state, closed) {
    const row = this.rows.find(
      (r) =>
        r.resolved === "download" &&
        r.state === "pending" &&
        r.tab.id === tab.id,
    );
    if (!row) {
      return;
    }
    if (state === "complete") {
      row.state = "successful";
      row.gone = closed === true;
    } else {
      row.state = "failed";
      row.reason = "download interrupted";
    }
    this.paint();
  },
};
