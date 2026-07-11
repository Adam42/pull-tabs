/**
 * @jest-environment jsdom
 */
import {
  READ_LATER_PROVIDERS,
  ROW_ACTIONS,
  UI_ACTIONS,
  getActiveProvider,
  iconForAction,
  resolveAction,
  setActiveProvider,
} from "../js/saveAction.js";
import { DEFAULT_PROVIDER, READ_LATER_PROVIDER } from "../js/storageKeys.js";

describe("saveAction catalog", () => {
  it("exposes Save + four built-ins as set-all actions, no ignore", () => {
    expect(UI_ACTIONS.map((a) => a.id)).toEqual([
      "save",
      "bookmark",
      "download",
      "clipboard",
      "close",
    ]);
    expect(UI_ACTIONS.map((a) => a.id)).not.toContain("ignore");
  });

  it("adds ignore only to the per-row catalog", () => {
    expect(ROW_ACTIONS.map((a) => a.id)).toContain("ignore");
    // Ignore is last so it never precedes a real action.
    expect(ROW_ACTIONS[ROW_ACTIONS.length - 1].id).toBe("ignore");
  });

  it("lists the four read-later providers as Save targets", () => {
    expect(READ_LATER_PROVIDERS.map((p) => p.id)).toEqual([
      "instapaper",
      "raindrop",
      "readwise",
      "webhook",
    ]);
  });
});

describe("saveAction active provider + resolution", () => {
  let store;

  beforeEach(() => {
    store = {};
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn((key) =>
            Promise.resolve(key in store ? { [key]: store[key] } : {}),
          ),
          set: jest.fn((obj) => {
            Object.assign(store, obj);
            return Promise.resolve();
          }),
        },
      },
    };
  });

  it("defaults the active provider to Instapaper when unset", async () => {
    await expect(getActiveProvider()).resolves.toBe(DEFAULT_PROVIDER);
  });

  it("round-trips a chosen active provider", async () => {
    await setActiveProvider("readwise");
    expect(store[READ_LATER_PROVIDER]).toBe("readwise");
    await expect(getActiveProvider()).resolves.toBe("readwise");
  });

  it("resolves 'save' to the active provider", async () => {
    await setActiveProvider("raindrop");
    await expect(resolveAction("save")).resolves.toBe("raindrop");
  });

  it("returns non-save actions unchanged", async () => {
    await expect(resolveAction("bookmark")).resolves.toBe("bookmark");
    await expect(resolveAction("close")).resolves.toBe("close");
  });
});

describe("iconForAction", () => {
  it("uses the active provider's glyph for Save", () => {
    expect(iconForAction("save", "readwise")).toBe("readwise");
    expect(iconForAction("save", undefined)).toBe(DEFAULT_PROVIDER);
  });

  it("uses the fixed glyph for built-in actions", () => {
    expect(iconForAction("bookmark", "readwise")).toBe("bookmark");
    expect(iconForAction("ignore", "readwise")).toBe("ignore");
  });
});
