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
  //For popup.html
  .js(["src/js/popup-init.js", "src/js/config.js"], "dist/popup-page.js")
  .js(["src/js/options-init.js"], "dist/options-page.js")
  .js(["src/js/popup-init.js", "src/js/auth.js"], "dist/pocket-page.js")
  .js(["src/js/config.js", "src/js/about.js"], "dist/about-page.js")
  .combine(
    ["node_modules/bootswatch/yeti/bootstrap.css", "src/css/styles.css"],
    "dist/style.css"
  )
  //Copy Images
  .copy("node_modules/simple-icons/icons/pocket.svg", "dist/img/pocket.svg")
  .copy("src/img/bookmark.svg", "dist/img/bookmark.svg")
  .copy("src/img/close.svg", "dist/img/close.svg")
  .copy("src/img/download.svg", "dist/img/download.svg")
  .copy("src/img/icon-19.png", "dist/img/icon-19.png")
  .copy("src/img/icon-38.png", "dist/img/icon-38.png")
  .copy("src/img/ignore.svg", "dist/img/ignore.svg")
  //Copy HTML files
  .copy("src/about.html", "dist/about.html")
  .copy("src/manifest.json", "dist/manifest.json")
  .copy("src/options.html", "dist/options.html")
  .copy("src/pocket.html", "dist/pocket.html")
  .copy("src/popup-init.html", "dist/popup-init.html")
  .copy("src/popup.html", "dist/popup.html");
//errors copying this file into the dist directory
//for now will place the polyfill into dist manually
//  .copy(
//    "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
//    "dist/browser-polyfill.min.js"
//  );

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
