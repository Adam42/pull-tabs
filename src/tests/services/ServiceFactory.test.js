import ServiceFactory from "../../js/services/ServiceFactory";
import { Providers } from "../../js/services/providers";

// Mock the Providers to ensure controlled test environment
jest.mock("../../js/services/providers", () => ({
  Providers: {
    BookmarkProvider: jest.fn(),
  },
}));

describe("ServiceFactory", () => {
  describe("convertActionToProvider", () => {
    it("should return the correct provider class for a valid action", () => {
      const action = "bookmark";
      console.log(Providers);
      const expectedProvider = Providers.BookmarkProvider;

      const provider = ServiceFactory.convertActionToProvider(action);

      expect(provider).toBe(expectedProvider);
    });

    it("should throw an error if the action is not a string", () => {
      expect(() => {
        ServiceFactory.convertActionToProvider(123);
      }).toThrow(TypeError);
    });

    it("should throw an error if no provider is found for the given action", () => {
      const invalidAction = "invalid";

      expect(() => {
        ServiceFactory.convertActionToProvider(invalidAction);
      }).toThrow(`Provider for action "${invalidAction}" not found.`);
    });
  });
});
