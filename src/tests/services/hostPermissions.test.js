import {
  SERVICE_ORIGINS,
  hasHostPermission,
  requestHostPermission,
} from "../../js/services/hostPermissions.js";
import { SERVICES } from "../../js/services/credentials.js";
import manifest from "../../manifest-base.json";

describe("hostPermissions", () => {
  beforeEach(() => {
    globalThis.browser = {
      permissions: {
        request: jest.fn().mockResolvedValue(true),
        contains: jest.fn().mockResolvedValue(false),
      },
    };
  });

  it("covers every credential-gated service", () => {
    expect(Object.keys(SERVICE_ORIGINS).sort()).toEqual([...SERVICES].sort());
  });

  it("stays in sync with the manifest's optional_host_permissions", () => {
    const declared = manifest.optional_host_permissions;
    for (const origins of Object.values(SERVICE_ORIGINS)) {
      for (const origin of origins) {
        expect(declared).toContain(origin);
      }
    }
  });

  it("requests the service's origins", async () => {
    await requestHostPermission("instapaper");
    expect(browser.permissions.request).toHaveBeenCalledWith({
      origins: ["https://www.instapaper.com/*"],
    });
  });

  it("checks the service's origins without prompting", async () => {
    await expect(hasHostPermission("readwise")).resolves.toBe(false);
    expect(browser.permissions.contains).toHaveBeenCalledWith({
      origins: ["https://readwise.io/*"],
    });
    expect(browser.permissions.request).not.toHaveBeenCalled();
  });

  it("treats the webhook service (user-defined host) as always granted", async () => {
    await expect(requestHostPermission("webhook")).resolves.toBe(true);
    await expect(hasHostPermission("webhook")).resolves.toBe(true);
    expect(browser.permissions.request).not.toHaveBeenCalled();
    expect(browser.permissions.contains).not.toHaveBeenCalled();
  });
});
