/**
 * @jest-environment jsdom
 */
// form.js pulls in the whole popup module graph; sever it here.
jest.mock("../js/form.js", () => ({ form: {} }));

let browserUtils;

beforeAll(async () => {
  // init() no longer auto-runs at import (Phase 7.1); these tests exercise
  // findPulltabsBookmarkFolder directly.
  localStorage.setItem("pullTabsFolderId", "preset");
  window.browser = {
    bookmarks: {
      getTree: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "42" })
    },
    // saveBookmarkFolder now persists via browser.storage.local (Phase 7.1).
    storage: {
      local: {
        set: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue({})
      }
    }
  };
  ({ browserUtils } = await import("../js/browser.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
  window.browser.bookmarks.create.mockResolvedValue({ id: "42" });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("browserUtils.findPulltabsBookmarkFolder", () => {
  it("creates the Pulltabs folder when the target folder has no children", () => {
    const tree = [
      {
        children: [
          { id: "toolbar", children: [] },
          { id: "other", children: [] }
        ]
      }
    ];

    browserUtils.findPulltabsBookmarkFolder(tree);

    expect(window.browser.bookmarks.create).toHaveBeenCalledWith({
      parentId: "other",
      title: "Pulltabs"
    });
  });

  it("saves the existing Pulltabs folder id and does not create another", () => {
    const saveBookmarkFolder = jest
      .spyOn(browserUtils, "saveBookmarkFolder")
      .mockImplementation(() => {});
    const tree = [
      {
        children: [
          { id: "toolbar", children: [] },
          {
            id: "other",
            children: [
              { id: "unrelated", title: "Recipes" },
              { id: "existing", title: "Pulltabs" }
            ]
          }
        ]
      }
    ];

    browserUtils.findPulltabsBookmarkFolder(tree);

    expect(saveBookmarkFolder).toHaveBeenCalledWith("existing");
    expect(window.browser.bookmarks.create).not.toHaveBeenCalled();
  });

  it("falls back to the first root child when the second is missing", () => {
    const tree = [{ children: [{ id: "only", children: [] }] }];

    browserUtils.findPulltabsBookmarkFolder(tree);

    expect(window.browser.bookmarks.create).toHaveBeenCalledWith({
      parentId: "only",
      title: "Pulltabs"
    });
  });

  it("returns without throwing on a malformed or empty tree", () => {
    expect(() => {
      browserUtils.findPulltabsBookmarkFolder([]);
    }).not.toThrow();
    expect(() => {
      browserUtils.findPulltabsBookmarkFolder([{}]);
    }).not.toThrow();

    expect(window.browser.bookmarks.create).not.toHaveBeenCalled();
  });
});

describe("browserUtils.init", () => {
  it("resolves only after the discovered folder id is persisted", async () => {
    // No legacy keys → migration no-ops; storage reports the folder absent.
    localStorage.removeItem("pullTabsFolderId");
    localStorage.removeItem("initialSetup");
    window.browser.storage.local.get.mockResolvedValue({});
    window.browser.bookmarks.getTree.mockResolvedValue([
      {
        children: [
          { id: "toolbar", children: [] },
          { id: "other", children: [{ id: "existing", title: "Pulltabs" }] }
        ]
      }
    ]);

    // Park the persistence write until we release it.
    let resolveSet;
    window.browser.storage.local.set.mockReturnValue(
      new Promise(resolve => {
        resolveSet = resolve;
      })
    );

    let resolved = false;
    const done = browserUtils.init().then(() => {
      resolved = true;
    });

    // Drain microtasks: init should be parked on the pending set(), not resolved.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(window.browser.storage.local.set).toHaveBeenCalledWith({
      pullTabsFolderId: "existing"
    });
    expect(resolved).toBe(false);

    // Release the write → init resolves.
    resolveSet();
    await done;
    expect(resolved).toBe(true);
  });
});
