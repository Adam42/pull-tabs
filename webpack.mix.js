let mix = require("laravel-mix");

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for your application, as well as bundling up your JS files.
 |
 */

mix
  //Only show notification if the build fails
  .disableSuccessNotifications()
  //Create stylesheet
  .combine(
    ["node_modules/bootswatch/yeti/bootstrap.css", "src/css/styles.css"],
    "build/style.css"
  )
  //Copy Pocket Image to build
  .copy("node_modules/simple-icons/icons/pocket.svg", "build/img/pocket.svg")
  //Copy img dir to browser and chrome dist
  .copyDirectory("src/img/", "dist/browser/img/")
  .copyDirectory("src/img/", "dist/chrome/img/")
  //Copy HTML files
  .copy("src/about.html", "build/about.html")
  .copy("src/options.html", "build/options.html")
  .copy("src/pocket.html", "build/pocket.html")
  .copy("src/popup.html", "build/popup.html")
  //Create JS file for each page
  .js(["src/js/config.js", "src/js/about.js"], "build/about-page.js")
  .js(["src/js/options-init.js"], "build/options-page.js")
  .js(["src/js/popup-init.js", "src/js/auth.js"], "build/pocket-page.js")
  .js(["src/js/popup-init.js", "src/js/config.js"], "build/popup-page.js")
  //Create a dist for browser compatible web-extensions
  //aka Mozilla Firefox
  .copyDirectory("build", "dist/browser/")
  .combine(
    ["src/manifest-base.json", "src/manifest-browser.json"],
    "dist/browser/manifest.json"
  )
  //Create a build for browsers that need a browser
  //polyfill to
  .copyDirectory("build", "dist/chrome/")
  .combine(
    ["src/manifest-base.json", "src/manifest-chrome.json"],
    "dist/chrome/manifest.json"
  )
  //For the page JS files in the chrome dist
  //append the browser polyfill to translate
  //browser promises to chrome callbacks
  .combine(
    [
      "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
      "build/about-page.js"
    ],
    "dist/chrome/about-page.js"
  )
  .combine(
    [
      "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
      "build/options-page.js"
    ],
    "dist/chrome/options-page.js"
  )
  .combine(
    [
      "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
      "build/pocket-page.js"
    ],
    "dist/chrome/pocket-page.js"
  )
  .combine(
    [
      "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
      "build/popup-page.js"
    ],
    "dist/chrome/popup-page.js"
  );
// Full API
// mix.js(src, output);
// mix.react(src, output); <-- Identical to mix.js(), but registers React Babel compilation.
// mix.ts(src, output); <-- Requires tsconfig.json to exist in the same folder as webpack.mix.js
// mix.extract(vendorLibs);
// mix.sass(src, output);
// mix.standaloneSass('src', output); <-- Faster, but isolated from Webpack.
// mix.fastSass('src', output); <-- Alias for mix.standaloneSass().
// mix.less(src, output);
// mix.stylus(src, output);
// mix.postCss(src, output, [require('postcss-some-plugin')()]);
// mix.browserSync('my-site.dev');
// mix.combine(files, destination);
// mix.babel(files, destination); <-- Identical to mix.combine(), but also includes Babel compilation.
// mix.copy(from, to);
// mix.copyDirectory(fromDir, toDir);
// mix.minify(file);
// mix.sourceMaps(); // Enable sourcemaps
// mix.version(); // Enable versioning.
// mix.disableNotifications();
// mix.setPublicPath('path/to/public');
// mix.setResourceRoot('prefix/for/resource/locators');
// mix.autoload({}); <-- Will be passed to Webpack's ProvidePlugin.
// mix.webpackConfig({}); <-- Override webpack.config.js, without editing the file directly.
// mix.then(function () {}) <-- Will be triggered each time Webpack finishes building.
// mix.options({
//   extractVueStyles: false, // Extract .vue component styling to file, rather than inline.
//   processCssUrls: true, // Process/optimize relative stylesheet url()'s. Set to false, if you don't want them touched.
//   purifyCss: false, // Remove unused CSS selectors.
//   uglify: {}, // Uglify-specific options. https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
//   postCss: [] // Post-CSS options: https://github.com/postcss/postcss/blob/master/docs/plugins.md
// });
