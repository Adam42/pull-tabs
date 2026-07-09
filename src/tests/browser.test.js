/**
 * @jest-environment jsdom
 */
// form.js pulls in the whole popup module graph; sever it here.
jest.mock("../js/form.js", () => ({ form: {} }));

let browserUtils;

beforeAll(async () => {
  // Makes browserUtils.init() (runs at import time) skip getTree()
  localStorage.setItem("pullTabsFolderId", "preset");
  // Belt-and-braces if init() runs anyway
  window.browser = {
    bookmarks: {
      getTree: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "42" })
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
