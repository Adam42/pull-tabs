/**
 * @jest-environment jsdom
 */
// browser.js self-runs init() at import; stub it so importing the options.js
// module chain doesn't hit the real browser API.
jest.mock("../js/browser.js", () => ({ browserUtils: {} }));

import { options } from "../js/options.js";

const MARKUP = `
  <div id="overlay"></div>
  <input id="raindrop-token" value="revoked-token">
  <span id="status-raindrop" class="connected-service-status connected"></span>
  <div id="status"></div>
`;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("options.verifyService — failure disables an enabled service", () => {
  let setMock;

  beforeEach(() => {
    document.body.innerHTML = MARKUP;
    setMock = jest.fn().mockResolvedValue();
    globalThis.browser = {
      storage: {
        local: { get: jest.fn().mockResolvedValue({}), set: setMock },
      },
      permissions: {
        request: jest.fn().mockResolvedValue(true),
        contains: jest.fn().mockResolvedValue(true),
      },
    };
  });

  it("persists service_raindrop=disabled when verify returns false", async () => {
    // Raindrop verify() calls fetch and treats non-200 as invalid.
    globalThis.fetch = jest.fn().mockResolvedValue({ status: 401 });

    options.verifyService("raindrop");
    await flushPromises();

    expect(globalThis.fetch).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith({ service_raindrop: "disabled" });
    expect(setMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ service_raindrop: "enabled" }),
    );

    const status = document.getElementById("status-raindrop");
    expect(status.textContent).toBe("Verification failed");
    expect(status.className).toContain("error");
  });

  it("persists service_raindrop=disabled when verify rejects", async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));

    options.verifyService("raindrop");
    await flushPromises();

    expect(setMock).toHaveBeenCalledWith({ service_raindrop: "disabled" });
  });

  it("requests the optional host permission before the verify fetch", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ status: 200 });

    options.verifyService("raindrop");
    await flushPromises();

    expect(globalThis.browser.permissions.request).toHaveBeenCalledWith({
      origins: ["https://api.raindrop.io/*"],
    });
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ service_raindrop: "enabled" }),
    );
  });

  it("disables the service without fetching when the permission is declined", async () => {
    globalThis.browser.permissions.request.mockResolvedValue(false);
    globalThis.fetch = jest.fn();

    options.verifyService("raindrop");
    await flushPromises();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith({ service_raindrop: "disabled" });

    const status = document.getElementById("status-raindrop");
    expect(status.className).toContain("error");
  });
});
