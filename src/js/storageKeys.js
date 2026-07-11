/**
 * Canonical storage-key constants.
 *
 * Dependency-free on purpose: this module imports nothing, so it can be shared
 * by page code, the service providers, and the background service worker
 * (which must not pull in the popup's DOM-bound module graph). `keys.js`
 * re-exports the raw strings from here.
 */

/**
 * `browser.storage.local` key holding the id of the "Pulltabs" bookmark
 * folder. Formerly stored in page `localStorage`.
 * @type {string}
 */
export const PULLTABS_FOLDER_ID = "pullTabsFolderId";

/**
 * `browser.storage.local` key marking that first-run setup has been shown.
 * Formerly stored in page `localStorage`.
 * @type {string}
 */
export const INITIAL_SETUP = "initialSetup";

/**
 * Prefix for the per-download tracking records keyed by download id
 * (`downloadTabItem-<id>`), holding the tab object for status reporting.
 * @type {string}
 */
export const DOWNLOAD_ITEM_PREFIX = "downloadTabItem-";

/**
 * Default value / query shape for the autoclose preference.
 * @type {{autoCloseTabs: boolean}}
 */
export const AUTO_CLOSE = { autoCloseTabs: false };

/**
 * `browser.storage.local` key holding the id of the active read-later
 * provider that the single "Save" action targets. Additive (0.21 redesign);
 * defaults to Instapaper when unset.
 * @type {string}
 */
export const READ_LATER_PROVIDER = "readLaterProvider";

/**
 * Default value for the active read-later provider.
 * @type {string}
 */
export const DEFAULT_PROVIDER = "instapaper";

/**
 * `browser.storage.local` key holding the action every tab is preset to when
 * the popup opens. Additive (0.21 redesign); defaults to "bookmark".
 * @type {string}
 */
export const DEFAULT_ACTION = "defaultAction";

/**
 * Default value for the preset per-tab action.
 * @type {string}
 */
export const DEFAULT_ACTION_VALUE = "bookmark";

/**
 * Visibility flag for the "Save" pseudo-action. Kept separate from any
 * provider's connection state: Save is shown whenever this is "enabled",
 * regardless of whether the active provider is connected. Additive (0.21
 * redesign); defaults to "enabled".
 * @type {string}
 */
export const SERVICE_SAVE = "service_save";
