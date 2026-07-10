import { gerund, pastTense } from "../js/actionLabels";

describe("actionLabels", () => {
  describe("pastTense", () => {
    it("maps read-later actions to natural phrases", () => {
      expect(pastTense("raindrop")).toBe("saved to Raindrop");
      expect(pastTense("readwise")).toBe("saved to Readwise");
      expect(pastTense("instapaper")).toBe("saved to Instapaper");
      expect(pastTense("webhook")).toBe("sent");
    });

    it("keeps the built-in action wording", () => {
      expect(pastTense("close")).toBe("closed");
      expect(pastTense("clipboard")).toBe("copied");
    });

    it("falls back to <action>ed for unknown actions", () => {
      expect(pastTense("frobnicate")).toBe("frobnicateed");
    });
  });

  describe("gerund", () => {
    it("maps read-later actions to natural phrases", () => {
      expect(gerund("raindrop")).toBe("saving to Raindrop");
      expect(gerund("webhook")).toBe("sending");
    });

    it("keeps the built-in action wording", () => {
      expect(gerund("download")).toBe("downloading");
    });

    it("falls back to <action>ing for unknown actions", () => {
      expect(gerund("frobnicate")).toBe("frobnicateing");
    });
  });
});
