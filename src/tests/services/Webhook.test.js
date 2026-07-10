import WebhookProvider from "../../js/services/Webhook";

describe("WebhookProvider", () => {
  const tab = { url: "https://example.com", title: "Example" };

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({
            credentials_webhook: { url: "https://hook.example/in" },
          }),
        },
      },
    };
  });

  it("posts the exact {url, title} save schema", async () => {
    const provider = new WebhookProvider([tab]);

    await provider.doActionToTab(tab);

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("https://hook.example/in");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      url: "https://example.com",
      title: "Example",
    });
  });

  it("fails with the status code on a non-2xx response", async () => {
    globalThis.fetch.mockResolvedValue({ ok: false, status: 500 });
    const provider = new WebhookProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Webhook failed: Webhook returned status 500",
    );
  });

  it("fails when fetch rejects (CORS/network)", async () => {
    globalThis.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const provider = new WebhookProvider([tab]);

    await expect(provider.doActionToTab(tab)).rejects.toThrow(
      "Webhook failed: Failed to fetch",
    );
  });
});
