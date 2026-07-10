import credentials from "../../js/services/credentials";

describe("credentials", () => {
  beforeEach(() => {
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
        },
      },
    };
    globalThis.fetch = jest.fn();
  });

  describe("round-trip", () => {
    it("stores under the prefixed key", async () => {
      await credentials.set("raindrop", { token: "abc" });

      expect(globalThis.browser.storage.local.set).toHaveBeenCalledWith({
        credentials_raindrop: { token: "abc" },
      });
    });

    it("reads back the stored object", async () => {
      globalThis.browser.storage.local.get.mockResolvedValue({
        credentials_readwise: { token: "xyz" },
      });

      await expect(credentials.get("readwise")).resolves.toEqual({
        token: "xyz",
      });
    });

    it("returns an empty object when unset", async () => {
      await expect(credentials.get("webhook")).resolves.toEqual({});
    });

    it("removes under the prefixed key", async () => {
      await credentials.clear("instapaper");

      expect(globalThis.browser.storage.local.remove).toHaveBeenCalledWith(
        "credentials_instapaper",
      );
    });
  });

  describe("verify", () => {
    it("raindrop: true on 200, false otherwise", async () => {
      globalThis.fetch.mockResolvedValue({ status: 200 });
      await expect(
        credentials.verify("raindrop", { token: "t" }),
      ).resolves.toBe(true);

      globalThis.fetch.mockResolvedValue({ status: 401 });
      await expect(
        credentials.verify("raindrop", { token: "t" }),
      ).resolves.toBe(false);
    });

    it("instapaper: true on 200 with a Basic header", async () => {
      globalThis.fetch.mockResolvedValue({ status: 200 });

      await expect(
        credentials.verify("instapaper", { username: "u", password: "p" }),
      ).resolves.toBe(true);
      expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe(
        "Basic " + btoa("u:p"),
      );
    });

    it("readwise: true only on 204", async () => {
      globalThis.fetch.mockResolvedValue({ status: 204 });
      await expect(
        credentials.verify("readwise", { token: "t" }),
      ).resolves.toBe(true);

      globalThis.fetch.mockResolvedValue({ status: 200 });
      await expect(
        credentials.verify("readwise", { token: "t" }),
      ).resolves.toBe(false);
    });

    describe("webhook", () => {
      it("sends the {url, title} save schema and nothing else", async () => {
        globalThis.fetch.mockResolvedValue({ ok: true, status: 200 });

        await expect(
          credentials.verify("webhook", { url: "https://hook.example" }),
        ).resolves.toBe(true);

        const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
        expect(Object.keys(body).sort()).toEqual(["title", "url"]);
      });

      it("rejects a non-HTTPS URL without a network call", async () => {
        await expect(
          credentials.verify("webhook", { url: "http://insecure" }),
        ).resolves.toBe(false);
        expect(globalThis.fetch).not.toHaveBeenCalled();
      });

      it("stays false when fetch rejects (CORS)", async () => {
        globalThis.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(
          credentials.verify("webhook", { url: "https://hook.example" }),
        ).resolves.toBe(false);
      });

      it("stays false on a non-2xx response", async () => {
        globalThis.fetch.mockResolvedValue({ ok: false, status: 404 });

        await expect(
          credentials.verify("webhook", { url: "https://hook.example" }),
        ).resolves.toBe(false);
      });
    });
  });
});
