/**
 * @jest-environment jsdom
 */
// browser.js self-runs a bookmark-folder lookup at import; stub it so importing
// the options.js module chain doesn't hit the real browser API.
jest.mock("../js/browser.js", () => ({ browserUtils: {} }));

import { options } from "../js/options.js";
import { CREDENTIAL_GATED, keys } from "../js/keys.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// The merged Options page: a provider picker, per-provider credential blocks
// (ids preserved from the old Connected-services markup), the autoclose switch
// on preference-input-autoclose (R5-1), a default-action select, and the
// Action-visibility chips container.
const MARKUP = `
  <div id="overlay"></div>
  <div id="status" class="hidden"></div>
  <div class="card" id="provider-picker"></div>
  <div id="provider-details">
    <div class="op-cred-block hidden" id="cred-instapaper">
      <input id="instapaper-username" />
      <input id="instapaper-password" />
      <button id="verify-instapaper"></button>
      <button id="disconnect-instapaper"></button>
      <span id="status-instapaper"></span>
    </div>
    <div class="op-cred-block hidden" id="cred-raindrop">
      <input id="raindrop-token" />
      <button id="verify-raindrop"></button>
      <button id="disconnect-raindrop"></button>
      <span id="status-raindrop"></span>
    </div>
    <div class="op-cred-block hidden" id="cred-readwise">
      <input id="readwise-token" />
      <button id="verify-readwise"></button>
      <button id="disconnect-readwise"></button>
      <span id="status-readwise"></span>
    </div>
    <div class="op-cred-block hidden" id="cred-webhook">
      <input id="webhook-url" />
      <button id="verify-webhook"></button>
      <button id="disconnect-webhook"></button>
      <span id="status-webhook"></span>
    </div>
  </div>
  <input type="checkbox" id="preference-input-autoclose" />
  <select id="preference-input-default-action"></select>
  <form id="preference-services"><div class="rf-chips" id="list-of-services"></div></form>
  <span id="autoclose-flag"></span>
`;

describe("options — merged read-later + action chips page", () => {
  beforeEach(() => {
    document.body.innerHTML = MARKUP;
    // Every object-shaped retrieve resolves to the default services map merged
    // over its query; string-key reads (credentials, readLaterProvider) resolve
    // empty so defaults apply.
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn((query) => {
            if (query !== null && typeof query === "object") {
              return Promise.resolve({
                ...query,
                ...keys.preferences.services,
              });
            }
            return Promise.resolve({});
          }),
          set: jest.fn().mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
        },
      },
      permissions: {
        request: jest.fn().mockResolvedValue(true),
        contains: jest.fn().mockResolvedValue(true),
      },
    };
  });

  it("renders Action chips for Save + the four built-ins only", async () => {
    options.init();
    await flush();

    const chips = Array.from(
      document.querySelectorAll("#list-of-services .rf-chip"),
    ).map((c) => c.getAttribute("data-action"));

    expect(chips).toEqual([
      "save",
      "bookmark",
      "download",
      "clipboard",
      "close",
    ]);
    // ignore / service_ignore is never a chip.
    expect(chips).not.toContain("ignore");
    // Read-later connection flags are not Action chips.
    CREDENTIAL_GATED.forEach((service) => {
      expect(chips).not.toContain(service);
    });
  });

  it("renders the four read-later providers in the picker", async () => {
    options.init();
    await flush();

    const rows = document.querySelectorAll("#provider-picker .op-provider");
    expect(rows.length).toBe(4);
    // Instapaper is the default active provider → its credential block shows.
    expect(
      document.getElementById("cred-instapaper").classList.contains("hidden"),
    ).toBe(false);
    expect(
      document.getElementById("cred-raindrop").classList.contains("hidden"),
    ).toBe(true);
  });

  it("populates the default-action select with Save + the built-ins", async () => {
    options.init();
    await flush();

    const values = Array.from(
      document.getElementById("preference-input-default-action").options,
    ).map((o) => o.value);
    expect(values).toEqual([
      "save",
      "bookmark",
      "download",
      "clipboard",
      "close",
    ]);
  });

  it("initializes without throwing", async () => {
    expect(() => options.init()).not.toThrow();
    await expect(flush()).resolves.not.toThrow();
  });

  it("disables a default-on chip on the first click with empty storage", async () => {
    // Fresh profile: nothing persisted. get(query) returns the query's default
    // for every unset key, exactly like browser.storage.local.get.
    const store = {};
    const setSpy = jest.fn().mockResolvedValue();
    globalThis.browser.storage.local.get = jest.fn((query) => {
      if (query !== null && typeof query === "object") {
        const out = {};
        for (const k of Object.keys(query)) {
          out[k] = k in store ? store[k] : query[k];
        }
        return Promise.resolve(out);
      }
      return Promise.resolve({});
    });
    globalThis.browser.storage.local.set = setSpy;

    options.init();
    await flush();

    // service_bookmark defaults enabled, so the chip renders "on".
    const chip = document.querySelector(
      '#list-of-services .rf-chip[data-action="bookmark"]',
    );
    expect(chip.classList.contains("on")).toBe(true);

    chip.click();
    await flush();

    // First click must turn it OFF, not re-enable it.
    expect(setSpy).toHaveBeenCalledWith({ service_bookmark: "disabled" });
  });
});
