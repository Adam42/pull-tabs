import RaindropProvider from "../../js/services/Raindrop";

const okResponse = (body = {}) => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue(body),
});

const errResponse = (status) => ({
  ok: false,
  status,
  json: jest.fn().mockResolvedValue({}),
});

describe("RaindropProvider", () => {
  const tab = { url: "https://example.com", title: "Example" };

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue(okResponse({ item: {} }));
    globalThis.browser = {
      storage: {
        local: {
          get: jest
            .fn()
            .mockResolvedValue({ credentials_raindrop: { token: "tok-1" } }),
        },
      },
    };
  });

  it("posts a single raindrop with a Bearer token and correct payload", async () => {
    const provider = new RaindropProvider([tab]);

    await provider.doActionToTab(tab);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.raindrop.io/rest/v1/raindrop",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer tok-1",
        }),
      }),
    );
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body).toEqual({
      link: "https://example.com",
      title: "Example",
      pleaseParse: {},
    });
  });

  it("maps 401 to a token hint", async () => {
    globalThis.fetch.mockResolvedValue(errResponse(401));
    const provider = new RaindropProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Raindrop failed: Check your Raindrop token in Options",
    );
  });

  it("maps 429 to a rate-limit hint", async () => {
    globalThis.fetch.mockResolvedValue(errResponse(429));
    const provider = new RaindropProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Raindrop failed: Raindrop rate limit — try again shortly",
    );
  });

  describe("doActionToTabs (bulk)", () => {
    const makeTabs = (n) =>
      Array.from({ length: n }, (_, i) => ({
        url: `https://example.com/${i}`,
        title: `Tab ${i}`,
      }));

    it("returns a {succeeded, failed} shape on all-success", async () => {
      const tabs = makeTabs(3);
      const provider = new RaindropProvider(tabs);

      const result = await provider.doActionToTabs();

      expect(result.succeeded).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.raindrop.io/rest/v1/raindrops",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("chunks at 100 and maps a failed chunk back to its own tabs", async () => {
      const tabs = makeTabs(150);
      const provider = new RaindropProvider(tabs);

      // First chunk (tabs 0-99) succeeds, second chunk (tabs 100-149) fails.
      globalThis.fetch
        .mockResolvedValueOnce(okResponse({}))
        .mockResolvedValueOnce(errResponse(500));

      const result = await provider.doActionToTabs();

      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(result.succeeded).toHaveLength(100);
      expect(result.failed).toHaveLength(50);
      expect(result.succeeded).toEqual(tabs.slice(0, 100));
      expect(result.failed).toEqual(tabs.slice(100));
    });
  });

  it("throws when no token is configured", async () => {
    globalThis.browser.storage.local.get.mockResolvedValue({});
    const provider = new RaindropProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Raindrop failed: Raindrop is not configured",
    );
  });
});
