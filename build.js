"use strict";
/*
 * Pull Tabs build script (Phase 6).
 *
 * Replaces the old laravel-mix/webpack chain with a small esbuild-driven
 * script. Produces two unpacked extensions:
 *   dist/browser/  Firefox (native promise-based browser.* API)
 *   dist/chrome/   Chrome  (browser.* provided by webextension-polyfill,
 *                           prepended to every bundle)
 *
 * Run:  node build.js            one-shot build (also used for releases)
 *       node build.js --watch    rebuild on source changes
 *
 * Releases stay un-minified per Mozilla source-review policy.
 */

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const root = __dirname;
const pkg = require("./package.json");

const BUILD = path.join(root, "build");
const DISTS = {
  browser: path.join(root, "dist", "browser"),
  chrome: path.join(root, "dist", "chrome"),
};

const POLYFILL = path.join(
  root,
  "node_modules",
  "webextension-polyfill",
  "dist",
  "browser-polyfill.min.js",
);

// Entry source → output bundle name. This is an EXPLICIT named list, never a
// build/*.js glob, so a stale intermediate file can never reach a dist.
const ENTRIES = [
  { in: "src/js/about.js", out: "about-page.js" },
  { in: "src/js/options-init.js", out: "options-page.js" },
  { in: "src/js/popup-init.js", out: "popup-page.js" },
  { in: "src/js/background.js", out: "background-page.js" },
];

const HTML = ["about.html", "options.html", "popup.html"];

const CSS_SOURCES = [
  path.join(root, "node_modules", "bootswatch", "yeti", "bootstrap.css"),
  path.join(root, "src", "css", "styles.css"),
];

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

// Step 3 — distribute the named JS bundles. Firefox gets the bundle as-is;
// Chrome gets the webextension-polyfill prepended (reproducing the old
// laravel-mix `.combine([polyfill, bundle])`). Iterating the known-output
// list (not the build/ directory) means a stale file can never be copied.
function distributeJs() {
  const polyfill = fs.readFileSync(POLYFILL, "utf8");
  for (const entry of ENTRIES) {
    const bundle = fs.readFileSync(path.join(BUILD, entry.out), "utf8");
    fs.writeFileSync(path.join(DISTS.browser, entry.out), bundle);
    fs.writeFileSync(
      path.join(DISTS.chrome, entry.out),
      polyfill + "\n" + bundle,
    );
  }
}

// Step 4 — concat bootswatch (Bootstrap 3, yeti) + our styles into style.css.
function buildCss() {
  const css = CSS_SOURCES.map((file) => fs.readFileSync(file, "utf8")).join(
    "\n",
  );
  fs.writeFileSync(path.join(DISTS.browser, "style.css"), css);
  fs.writeFileSync(path.join(DISTS.chrome, "style.css"), css);
}

// Step 5 — copy the entry HTML pages to both dists.
function copyHtml() {
  for (const file of HTML) {
    const contents = fs.readFileSync(path.join(root, "src", file));
    fs.writeFileSync(path.join(DISTS.browser, file), contents);
    fs.writeFileSync(path.join(DISTS.chrome, file), contents);
  }
}

// Step 6 — copy the image directory (recursive) to both dists.
function copyImages() {
  const src = path.join(root, "src", "img");
  for (const dist of Object.values(DISTS)) {
    fs.cpSync(src, path.join(dist, "img"), { recursive: true });
  }
}

// Step 7 — merge the standalone manifest fragments and inject the version.
// Shallow merge: `action`/`background` are wholly browser-specific, so a
// last-write-wins spread is correct. Version is single-sourced from
// package.json — it lives in no manifest file.
function buildManifests() {
  const base = JSON.parse(
    fs.readFileSync(path.join(root, "src", "manifest-base.json"), "utf8"),
  );
  const overrides = {
    browser: "manifest-browser.json",
    chrome: "manifest-chrome.json",
  };
  for (const [name, dist] of Object.entries(DISTS)) {
    const override = JSON.parse(
      fs.readFileSync(path.join(root, "src", overrides[name]), "utf8"),
    );
    const manifest = { ...base, ...override, version: pkg.version };
    fs.writeFileSync(
      path.join(dist, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
  }
}

// Steps 4–7: everything that isn't the JS bundle.
function buildAssets() {
  buildCss();
  copyHtml();
  copyImages();
  buildManifests();
}

const esbuildOptions = {
  entryPoints: ENTRIES.map((e) => ({
    in: e.in,
    out: e.out.replace(/\.js$/, ""),
  })),
  outdir: BUILD,
  bundle: true,
  format: "iife",
  minify: false,
  sourcemap: false,
  target: ["chrome100", "firefox100"],
  logLevel: "info",
};

function cleanAll() {
  cleanDir(BUILD);
  cleanDir(DISTS.browser);
  cleanDir(DISTS.chrome);
}

async function build() {
  cleanAll();
  await esbuild.build(esbuildOptions);
  distributeJs();
  buildAssets();
  console.log("build complete");
}

async function watch() {
  cleanAll();

  const ctx = await esbuild.context({
    ...esbuildOptions,
    plugins: [
      {
        name: "pull-tabs-distribute",
        setup(pluginBuild) {
          // Re-run the explicit-named distribute (incl. the Chrome polyfill
          // prepend) after every rebuild so watched Chrome builds never lose
          // browser.* or pick up stale files.
          pluginBuild.onEnd((result) => {
            if (result.errors.length > 0) {
              return;
            }
            distributeJs();
          });
        },
      },
    ],
  });
  await ctx.watch();

  // esbuild only watches the JS module graph. Watch the non-JS asset locations
  // for HTML/CSS/img/manifest edits and re-run the asset steps.
  //
  // NON-recursive fs.watch on each directory on purpose: recursive fs.watch is
  // unsupported on Linux under Node 18 (esbuild's minimum), where it throws
  // ERR_FEATURE_UNAVAILABLE_ON_PLATFORM. The asset sources all live directly in
  // these dirs — src/*.html + src/manifest-*.json, src/css/*, src/img/* — so
  // per-directory non-recursive watchers cover them cross-platform. (src/js is
  // deliberately not watched here; esbuild owns the JS graph.)
  buildAssets();
  const rebuildAssets = (evtType, file) => {
    // Ignore JS files: esbuild owns those. Guards a stray top-level src/*.js.
    if (file && file.endsWith(".js")) {
      return;
    }
    try {
      buildAssets();
    } catch (err) {
      console.error("asset rebuild failed:", err.message);
    }
  };
  const assetDirs = [
    path.join(root, "src"),
    path.join(root, "src", "css"),
    path.join(root, "src", "img"),
  ];
  for (const dir of assetDirs) {
    if (fs.existsSync(dir)) {
      fs.watch(dir, rebuildAssets);
    }
  }

  console.log("watching for changes…");
}

const isWatch = process.argv.includes("--watch");
(isWatch ? watch() : build()).catch((err) => {
  console.error(err);
  process.exit(1);
});
