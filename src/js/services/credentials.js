/**
 * Per-service credential storage and verification.
 *
 * Credentials are user-pasted tokens / Basic-Auth pairs stored in
 * `browser.storage.local` (never page localStorage) under keys like
 * `credentials_raindrop`. There are no distributable secrets — the lesson
 * from the removed Pocket `config.js` consumer key.
 *
 * Never log credential values; verification errors carry status codes only.
 */

const KEY_PREFIX = "credentials_";

/**
 * Supported credential-gated services.
 * @type {string[]}
 */
export const SERVICES = ["raindrop", "instapaper", "readwise", "webhook"];

/**
 * Storage key for a service's credentials.
 * @param  {string} service Service name, e.g. "raindrop"
 * @return {string} Storage key, e.g. "credentials_raindrop"
 */
function storageKey(service) {
  return KEY_PREFIX + service;
}

const credentials = {
  /**
   * Retrieve a service's stored credentials.
   * @param  {string} service Service name
   * @return {Promise<object>} Stored credential object (empty if unset)
   */
  async get(service) {
    const key = storageKey(service);
    const result = await browser.storage.local.get(key);
    return result[key] || {};
  },

  /**
   * Persist a service's credentials.
   * @param  {string} service Service name
   * @param  {object} creds   Credential object to store
   * @return {Promise} Resolves once stored
   */
  set(service, creds) {
    return browser.storage.local.set({ [storageKey(service)]: creds });
  },

  /**
   * Remove a service's credentials.
   * @param  {string} service Service name
   * @return {Promise} Resolves once removed
   */
  clear(service) {
    return browser.storage.local.remove(storageKey(service));
  },

  /**
   * Verify credentials against the service's API.
   *
   * Each helper makes a minimal live request and returns true only on the
   * documented success status. Rejections and unexpected statuses return
   * false so the caller keeps the service disabled.
   *
   * @param  {string} service Service name
   * @param  {object} creds   Credentials to verify
   * @return {Promise<boolean>} True when the credentials are valid
   */
  verify(service, creds) {
    switch (service) {
      case "raindrop":
        return verifyRaindrop(creds);
      case "instapaper":
        return verifyInstapaper(creds);
      case "readwise":
        return verifyReadwise(creds);
      case "webhook":
        return verifyWebhook(creds);
      default:
        return Promise.reject(new Error(`Unknown service "${service}"`));
    }
  },
};

/**
 * Build an HTTP Basic Authorization header value.
 * @param  {string} username Account username
 * @param  {string} password Account password (may be empty)
 * @return {string} "Basic <base64>" header value
 */
export function basicAuth(username, password) {
  return "Basic " + btoa(`${username}:${password || ""}`);
}

async function verifyRaindrop(creds) {
  const response = await fetch("https://api.raindrop.io/rest/v1/user", {
    method: "GET",
    headers: { Authorization: `Bearer ${creds.token}` },
  });
  return response.status === 200;
}

async function verifyInstapaper(creds) {
  const response = await fetch(
    "https://www.instapaper.com/api/authenticate",
    {
      method: "POST",
      headers: { Authorization: basicAuth(creds.username, creds.password) },
    },
  );
  return response.status === 200;
}

async function verifyReadwise(creds) {
  const response = await fetch("https://readwise.io/api/v2/auth/", {
    method: "GET",
    headers: { Authorization: `Token ${creds.token}` },
  });
  return response.status === 204;
}

// Webhook verification sends a real test POST using the exact save schema so
// `enabled` implies the endpoint is reachable, CORS-capable, and accepts the
// payload. It carries no extra fields (strict endpoints would false-fail) and
// may trigger downstream automations — the options copy warns about this.
async function verifyWebhook(creds) {
  const url = creds.url;
  if (typeof url !== "string" || !/^https:\/\//i.test(url)) {
    return false;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://pull-tabs.example/verify",
        title: "Pull Tabs connection test",
      }),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export default credentials;
