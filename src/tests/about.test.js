/**
 * @jest-environment jsdom
 */
// about.js binds on DOMContentLoaded and calls watchOptionsLink.init(); stub it
// so the module import doesn't require the real options-routing behavior.
jest.mock("../js/watchOptionsLink.js", () => ({
  watchOptionsLink: { init: jest.fn() },
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// Import once: about.js registers a single module-level DOMContentLoaded
// listener. Each test rebuilds #about-credits and re-fires DOMContentLoaded so
// the delegated click handler binds to the fresh container.
import "../js/about.js";

describe("about credit links", () => {
  let created;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="about-credits">
        <p>text <a href="https://example.com/one">one</a></p>
        <a href="https://example.com/two"><span id="nested">nested child</span></a>
      </div>
    `;
    created = [];
    globalThis.browser = {
      tabs: { create: jest.fn((opts) => created.push(opts)) },
    };
    document.dispatchEvent(new Event("DOMContentLoaded"));
  });

  it("opens a plain link click in a background tab and prevents navigation", () => {
    const anchor = document.querySelector('a[href="https://example.com/one"]');
    const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
    anchor.dispatchEvent(evt);

    expect(evt.defaultPrevented).toBe(true);
    expect(created).toEqual([
      { url: "https://example.com/one", active: false },
    ]);
  });

  it("resolves the anchor when the click lands on a nested child", () => {
    document
      .getElementById("nested")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    expect(created).toEqual([
      { url: "https://example.com/two", active: false },
    ]);
  });

  it("ignores clicks that are not on a link", async () => {
    document
      .getElementById("about-credits")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flush();

    expect(globalThis.browser.tabs.create).not.toHaveBeenCalled();
  });
});
