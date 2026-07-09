import ServiceProvider from "../../js/services/ServiceProvider";

class ConcreteProvider extends ServiceProvider {}

describe("ServiceProvider", () => {
  describe("abstract-class guard", () => {
    it("throws when instantiated directly", () => {
      expect(() => new ServiceProvider([])).toThrow(TypeError);
    });

    it("allows subclasses to be instantiated with an array", () => {
      expect(() => new ConcreteProvider([])).not.toThrow();
    });

    it("throws when tabs is not an array", () => {
      expect(() => new ConcreteProvider("nope")).toThrow(TypeError);
    });
  });

  describe("validateTab", () => {
    it("accepts a tab with a url and title", () => {
      expect(() =>
        ServiceProvider.validateTab({ url: "https://a.com", title: "A" }),
      ).not.toThrow();
    });

    it("throws when the tab is missing a url", () => {
      expect(() => ServiceProvider.validateTab({ title: "A" })).toThrow(
        "Tab is missing a url or title",
      );
    });

    it("throws when the tab is missing a title", () => {
      expect(() =>
        ServiceProvider.validateTab({ url: "https://a.com" }),
      ).toThrow("Tab is missing a url or title");
    });

    it("throws when the tab is null or undefined", () => {
      expect(() => ServiceProvider.validateTab(null)).toThrow(TypeError);
      expect(() => ServiceProvider.validateTab()).toThrow(TypeError);
    });
  });
});
