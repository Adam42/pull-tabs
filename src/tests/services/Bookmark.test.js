import BookmarkProvider from "../../js/services/Bookmark";

describe("BookmarkProvider", () => {
  const tab = { url: "https://example.com", title: "Example" };

  beforeEach(() => {
    // Folder id now lives in browser.storage.local (Phase 7.1) and is read
    // via the storage wrapper (browser.storage.local.get).
    globalThis.browser = {
      bookmarks: {
        create: jest.fn().mockResolvedValue({ id: "bm-1" }),
      },
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({ pullTabsFolderId: "folder-1" }),
        },
      },
    };
  });

  it("resolves with the created bookmark on the happy path", async () => {
    const provider = new BookmarkProvider([tab]);

    await expect(provider.doActionToTab(tab)).resolves.toEqual({ id: "bm-1" });
    expect(globalThis.browser.bookmarks.create).toHaveBeenCalledWith({
      parentId: "folder-1",
      title: "Example",
      url: "https://example.com",
    });
  });

  it("wraps a browser.bookmarks.create rejection", async () => {
    globalThis.browser.bookmarks.create.mockRejectedValue(
      new Error("api down"),
    );
    const provider = new BookmarkProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Bookmark failed: api down",
    );
  });

  it("rejects with a wrapped validation error for an invalid tab", async () => {
    const provider = new BookmarkProvider([tab]);

    await expect(
      provider.doActionToTab({ url: "https://x.com" }),
    ).rejects.toThrow("Bookmark failed: Tab is missing a url or title");
  });
});
