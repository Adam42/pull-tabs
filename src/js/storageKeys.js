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
