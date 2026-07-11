import InstapaperProvider from "../../js/services/Instapaper";

describe("InstapaperProvider", () => {
  const tab = { url: "https://example.com", title: "Example" };

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({ status: 201 });
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({
            credentials_instapaper: { username: "me@x.com", password: "pw" },
          }),
        },
      },
    };
  });

  it("posts form params with a Basic auth header", async () => {
    const provider = new InstapaperProvider([tab]);

    await provider.doActionToTab(tab);

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("https://www.instapaper.com/api/add");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Basic " + btoa("me@x.com:pw"));
    expect(options.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    const params = new URLSearchParams(options.body);
    expect(params.get("url")).toBe("https://example.com");
    expect(params.get("title")).toBe("Example");
  });

  it("builds a Basic header with an empty password", async () => {
    globalThis.browser.storage.local.get.mockResolvedValue({
      credentials_instapaper: { username: "me@x.com", password: "" },
    });
    const provider = new InstapaperProvider([tab]);

    await provider.doActionToTab(tab);

    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe(
      "Basic " + btoa("me@x.com:"),
    );
  });

  it("resolves on 201", async () => {
    const provider = new InstapaperProvider([tab]);

    await expect(provider.doActionToTab(tab)).resolves.toBe(201);
  });

  it("maps 403 to a credentials hint", async () => {
    globalThis.fetch.mockResolvedValue({ status: 403 });
    const provider = new InstapaperProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Instapaper failed: Check your Instapaper credentials in Options",
    );
  });
});
