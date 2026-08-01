/**
 * Optional host permissions for the credential-gated read-later services.
 *
 * The manifest lists these origins under `optional_host_permissions`, so a
 * fresh install grants no site access at all. The Options page requests the
 * active service's origin inside the Connect click — `permissions.request`
 * only works from a user gesture — meaning users who never configure a
 * read-later service never see or grant any host access, and adding a future
 * provider can't disable the extension pending re-approval on update.
 *
 * The webhook service targets a user-defined host, so no origin can be listed
 * for it; it relies on the endpoint sending CORS headers instead (see
 * Webhook.js).
 */

/**
 * Match-pattern origins each gated service needs for its API fetches.
 * Must stay a subset of `optional_host_permissions` in manifest-base.json.
 * @type {Object<string, string[]>}
 */
export const SERVICE_ORIGINS = Object.freeze({
  raindrop: ["https://api.raindrop.io/*"],
  instapaper: ["https://www.instapaper.com/*"],
  readwise: ["https://readwise.io/*"],
  webhook: [],
});

/**
 * Ask the browser to grant a service's host permission. Must be called from
 * within a user gesture (e.g. a click handler, before any other async work).
 * @param  {string} service Gated service name, e.g. "raindrop"
 * @return {Promise<boolean>} True when granted (or nothing to grant)
 */
export function requestHostPermission(service) {
  const origins = SERVICE_ORIGINS[service] || [];
  if (origins.length === 0) {
    return Promise.resolve(true);
  }
  return browser.permissions.request({ origins });
}

/**
 * Check whether a service's host permission is currently granted. Unlike
 * request(), this may be called at any time (no gesture required).
 * @param  {string} service Gated service name
 * @return {Promise<boolean>} True when granted (or nothing to grant)
 */
export function hasHostPermission(service) {
  const origins = SERVICE_ORIGINS[service] || [];
  if (origins.length === 0) {
    return Promise.resolve(true);
  }
  return browser.permissions.contains({ origins });
}
