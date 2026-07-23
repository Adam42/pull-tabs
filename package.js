"use strict";
/*
 * Pull Tabs release packager.
 *
 * Runs a fresh build, then writes three store-ready archives to releases/:
 *   pull-tabs-chrome-v<version>.zip    dist/chrome contents (manifest at
 *                                      zip root, as the Chrome Web Store
 *                                      requires)
 *   pull-tabs-firefox-v<version>.zip   dist/browser contents, same layout,
 *                                      for addons.mozilla.org
 *   pull-tabs-source-v<version>.zip    the source AMO reviewers need to
 *                                      reproduce the bundles: src/, build.js,
 *                                      package.json, package-lock.json,
 *                                      README.md. Zipped from the working
 *                                      tree (not git HEAD) so it always
 *                                      matches the dist zips built alongside.
 *
 * Run:  npm run package   (node package.js)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = __dirname;
const pkg = require("./package.json");
const RELEASES = path.join(root, "releases");

function zip(outFile, cwd, targets, excludes) {
  fs.rmSync(outFile, { force: true });
  const args = ["-r", "-X", outFile, ...targets];
  for (const pattern of excludes || []) {
    args.push("-x", pattern);
  }
  execFileSync("zip", args, { cwd, stdio: ["ignore", "ignore", "inherit"] });
  const kb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`  ${path.relative(root, outFile)}  (${kb}kb)`);
}

console.log("building…");
execFileSync(process.execPath, [path.join(root, "build.js")], {
  stdio: "inherit",
});

fs.mkdirSync(RELEASES, { recursive: true });
const v = `v${pkg.version}`;
console.log(`packaging ${v}…`);

// Store zips must contain the manifest at the zip root, so zip from inside
// each dist directory rather than archiving the directory itself.
zip(path.join(RELEASES, `pull-tabs-chrome-${v}.zip`), path.join(root, "dist", "chrome"), ["."], ["*.DS_Store"]);
zip(path.join(RELEASES, `pull-tabs-firefox-${v}.zip`), path.join(root, "dist", "browser"), ["."], ["*.DS_Store"]);

// AMO source-review archive: everything needed to rebuild the Firefox zip
// byte-for-byte (see README "Install" / CLAUDE.md build docs).
zip(
  path.join(RELEASES, `pull-tabs-source-${v}.zip`),
  root,
  ["src", "build.js", "package.json", "package-lock.json", "README.md"],
  ["*.DS_Store"],
);

console.log("package complete");
