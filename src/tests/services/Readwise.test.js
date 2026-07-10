import ReadwiseProvider from "../../js/services/Readwise";

describe("ReadwiseProvider", () => {
  const tab = { url: "https://example.com", title: "Example" };

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: "doc-1" }),
    });
    globalThis.browser = {
      storage: {
        local: {
          get: jest
            .fn()
            .mockResolvedValue({ credentials_readwise: { token: "tok-2" } }),
        },
      },
    };
  });

  it("posts JSON with a Token header", async () => {
    const provider = new ReadwiseProvider([tab]);

    await provider.doActionToTab(tab);

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("https://readwise.io/api/v3/save/");
    expect(options.headers.Authorization).toBe("Token tok-2");
    expect(JSON.parse(options.body)).toEqual({
      url: "https://example.com",
      title: "Example",
    });
  });

  it("maps 401 to a token hint", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({}),
    });
    const provider = new ReadwiseProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Readwise failed: Check your Readwise token in Options",
    );
  });
});
