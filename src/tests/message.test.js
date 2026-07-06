/**
 * @jest-environment jsdom
 */
import { messageManager } from "../js/message.js";

describe("messageManager.removeStatusMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="status" class="hidden"></div>';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not throw when the message was already removed", () => {
    const id = messageManager.updateStatusMessage("hi", "dependent", "info");

    messageManager.removeStatusMessage(id);

    expect(() => {
      messageManager.removeStatusMessage(id);
    }).not.toThrow();
  });

  it("re-hides the parent when the last message is removed", () => {
    const status = document.getElementById("status");
    const id = messageManager.updateStatusMessage("hi", "dependent", "info");

    expect(status.classList.contains("hidden")).toBe(false);

    messageManager.removeStatusMessage(id);

    expect(status.children.length).toBe(0);
    expect(status.classList.contains("hidden")).toBe(true);
  });

  it("keeps the parent visible while other messages remain", () => {
    const status = document.getElementById("status");
    const first = messageManager.updateStatusMessage("one", "dependent", "info");
    messageManager.updateStatusMessage("two", "dependent", "info");

    messageManager.removeStatusMessage(first);

    expect(status.children.length).toBe(1);
    expect(status.classList.contains("hidden")).toBe(false);
  });

  it("does not throw for a null id", () => {
    expect(() => {
      messageManager.removeStatusMessage(null);
    }).not.toThrow();
  });

  it("does not throw for an unknown id", () => {
    expect(() => {
      messageManager.removeStatusMessage("status-message-99");
    }).not.toThrow();
  });
});
