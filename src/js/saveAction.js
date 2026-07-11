"use strict";
/**
 * The "Save" pseudo-action (0.21 "quiet paper" redesign).
 *
 * The popup surfaces a single "Save" action; the actual work is done by
 * whichever read-later provider the user selected on the Options page (stored
 * under `readLaterProvider`, default Instapaper). `ServiceFactory`/`providers.js`
 * stay keyed by concrete provider names — resolution to a concrete name happens
 * HERE, before dispatch and before any human wording, so `actionLabels` always
 * receives a concrete provider name and stays synchronous/unchanged.
 */
import storage from "./storage.js";
import { DEFAULT_PROVIDER, READ_LATER_PROVIDER } from "./storageKeys.js";

/**
 * The fixed UI action catalog for the set-all chips and per-row pickers, in
 * display order. Independent of provider connection state. `save` is the
 * read-later pseudo-action; the rest are concrete built-in providers.
 *
 * `ignore` is intentionally absent: it is a per-row-only picker entry (never a
 * set-all chip, never disable-able) added via ROW_ACTIONS below.
 * @type {{id: string, label: string, icon: string}[]}
 */
export const UI_ACTIONS = [
  { id: "save", label: "Save", icon: "instapaper" },
  { id: "bookmark", label: "Bookmark", icon: "bookmark" },
  { id: "download", label: "Download", icon: "download" },
  { id: "clipboard", label: "Clipboard", icon: "clipboard" },
  { id: "close", label: "Close", icon: "close" },
];

/**
 * The per-row picker catalog: the UI actions plus Ignore, which keeps a row
 * checked but excludes it from the pull.
 * @type {{id: string, label: string, icon: string}[]}
 */
export const ROW_ACTIONS = [
  ...UI_ACTIONS,
  { id: "ignore", label: "Ignore", icon: "ignore" },
];

/**
 * Read-later providers selectable as the Save target, in Options display
 * order. Mirrors CREDENTIAL_GATED in keys.js.
 * @type {{id: string, name: string, desc: string}[]}
 */
export const READ_LATER_PROVIDERS = [
  {
    id: "instapaper",
    name: "Instapaper",
    desc: "Save each tab to your Instapaper reading queue.",
  },
  {
    id: "raindrop",
    name: "Raindrop.io",
    desc: "File each tab as a bookmark in a Raindrop collection.",
  },
  {
    id: "readwise",
    name: "Readwise Reader",
    desc: "Send each tab to your Reader inbox.",
  },
  {
    id: "webhook",
    name: "Custom webhook",
    desc: "POST each tab’s URL and title to an endpoint you control.",
  },
];

/**
 * Read the active read-later provider id, falling back to the default when
 * unset.
 * @return {Promise<string>} A concrete provider name (e.g. "instapaper")
 */
export async function getActiveProvider() {
  const stored = await storage.retrieve(READ_LATER_PROVIDER);
  return stored[READ_LATER_PROVIDER] || DEFAULT_PROVIDER;
}

/**
 * Persist the active read-later provider id.
 * @param  {string} provider Concrete provider name
 * @return {Promise} Resolves once stored
 */
export function setActiveProvider(provider) {
  return storage.store({ [READ_LATER_PROVIDER]: provider });
}

/**
 * Resolve a UI action to the concrete provider name a ServiceProvider is keyed
 * by. `save` resolves to the active read-later provider; every other action is
 * already concrete and returned unchanged.
 * @param  {string} action A UI action id (e.g. "save", "bookmark")
 * @return {Promise<string>} The concrete provider name
 */
export function resolveAction(action) {
  if (action === "save") {
    return getActiveProvider();
  }
  return Promise.resolve(action);
}

/**
 * The glyph name to show for a UI action. For `save`, use the active
 * provider's own mark; otherwise the action's fixed icon.
 * @param  {string} action        UI action id
 * @param  {string} activeProvider The resolved active read-later provider
 * @return {string} An icon name resolvable to img/<name>.svg
 */
export function iconForAction(action, activeProvider) {
  if (action === "save") {
    return activeProvider || DEFAULT_PROVIDER;
  }
  const entry = ROW_ACTIONS.find((a) => a.id === action);
  return entry ? entry.icon : action;
}
