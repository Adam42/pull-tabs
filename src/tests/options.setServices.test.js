/**
 * @jest-environment jsdom
 */
// browser.js self-runs init() at import (bookmark-folder lookup); stub it so
// importing the options.js module chain doesn't hit the real browser API.
jest.mock("../js/browser.js", () => ({ browserUtils: {} }));

import { options } from "../js/options.js";
import { CREDENTIAL_GATED, keys } from "../js/keys.js";

const LAYOUT_MARKUP = `
  <div id="overlay"></div>
  <input type="checkbox" id="preference-input-simple">
  <input type="checkbox" id="preference-input-advanced">
  <input type="checkbox" id="preference-input-autoclose">
  <form id="preference-services"><div id="list-of-services"></div></form>
  <div id="status"></div>
`;

describe("options — credential-gated services in the generic list", () => {
  beforeEach(() => {
    document.body.innerHTML = LAYOUT_MARKUP;
    // Every storage.retrieve resolves to the full default services map; the
    // layout/autoclose reads tolerate the extra keys.
    globalThis.browser = {
      storage: {
        local: {
          get: jest
            .fn()
            .mockResolvedValue({ ...keys.preferences.services }),
          set: jest.fn().mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
        },
      },
    };
  });

  it("does not render a generic checkbox for gated services", () => {
    options.init();

    CREDENTIAL_GATED.forEach((service) => {
      expect(document.getElementById("service_" + service)).toBeNull();
    });
    // Built-in services still get a checkbox.
    expect(document.getElementById("service_bookmark")).not.toBeNull();
    expect(document.getElementById("service_close")).not.toBeNull();
  });

  it("setServices completes without throwing on missing gated inputs", async () => {
    options.init();

    await expect(
      options.restoreServices().then(options.setServices),
    ).resolves.not.toThrow();
  });
});
