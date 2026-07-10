/**
 * Human-readable wording for each action, shared by ui.js and both views.
 *
 * The naive `action + "ed"` / `action + "ing"` produced "raindroping" and
 * "readwiseed" once read-later providers were added, so per-tab and summary
 * wording is centralized here instead.
 */

/**
 * Past-tense phrase for an action, keyed by action name.
 * Falls back to `<action>ed` for any action not listed.
 * @type {Object<string, string>}
 */
const PAST_TENSE = {
  bookmark: "bookmarked",
  close: "closed",
  download: "downloaded",
  clipboard: "copied",
  raindrop: "saved to Raindrop",
  instapaper: "saved to Instapaper",
  readwise: "saved to Readwise",
  webhook: "sent",
};

/**
 * Present-participle (gerund) phrase for an action, keyed by action name.
 * Falls back to `<action>ing` for any action not listed.
 * @type {Object<string, string>}
 */
const GERUND = {
  bookmark: "bookmarking",
  close: "closing",
  download: "downloading",
  clipboard: "copying",
  raindrop: "saving to Raindrop",
  instapaper: "saving to Instapaper",
  readwise: "saving to Readwise",
  webhook: "sending",
};

/**
 * Convert an action name to its past-tense phrase.
 * @param  {string} action An action a ServiceProvider makes available
 * @return {string} Past-tense wording, e.g. "saved to Raindrop"
 */
export function pastTense(action) {
  return PAST_TENSE[action] || `${action}ed`;
}

/**
 * Convert an action name to its present-participle (gerund) phrase.
 * @param  {string} action An action a ServiceProvider makes available
 * @return {string} Gerund wording, e.g. "saving to Raindrop"
 */
export function gerund(action) {
  return GERUND[action] || `${action}ing`;
}
