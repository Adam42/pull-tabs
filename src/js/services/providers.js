import BookmarkProvider from "./Bookmark.js";
import ClipboardProvider from "./Clipboard.js";
import CloseProvider from "./Close.js";
import DownloadProvider from "./Download.js";

/**
 * Immutable registry mapping provider class names to their classes.
 * Adding an entry here surfaces the provider in both UIs and the options page.
 * @typedef {Object<string, typeof ServiceProvider>} ProviderRegistry
 * @type {ProviderRegistry}
 */
export const Providers = Object.freeze({
  DownloadProvider,
  BookmarkProvider,
  CloseProvider,
  ClipboardProvider,
});
