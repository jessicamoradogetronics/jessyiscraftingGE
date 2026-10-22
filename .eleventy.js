const esStrings = require("./src/_data/i18n/es.json");
const enStrings = require("./src/_data/i18n/en.json");
const deStrings = require("./src/_data/i18n/de.json");

const dictionaries = { es: esStrings, en: enStrings, de: deStrings };

/** Looks up a dotted key (e.g. "nav.shop") inside a translation dictionary. */
function lookup(dict, key) {
  return key.split(".").reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), dict);
}

module.exports = function (eleventyConfig) {
  // Static passthrough copy.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");

  // Translate a UI string by dotted key for the given language, falling back to Spanish.
  eleventyConfig.addFilter("t", function (key, lang) {
    const dict = dictionaries[lang] || dictionaries.es;
    const value = lookup(dict, key);
    if (value !== undefined) return value;
    const fallback = lookup(dictionaries.es, key);
    return fallback !== undefined ? fallback : key;
  });

  // Pick the right language out of a per-locale record, e.g. { es, en, de }.
  eleventyConfig.addFilter("tr", function (record, lang) {
    if (!record) return "";
    return record[lang] || record.es || "";
  });

  eleventyConfig.addFilter("formatPrice", function (value) {
    if (typeof value !== "number") return value;
    return value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  });

  eleventyConfig.addFilter("jsonify", function (value) {
    return JSON.stringify(value);
  });

  eleventyConfig.addFilter("limit", function (arr, n) {
    return Array.isArray(arr) ? arr.slice(0, n) : arr;
  });

  // Swap the locale segment of a generated URL, e.g. /en/shop/ -> /de/shop/
  eleventyConfig.addFilter("swapLocale", function (url, fromCode, toCode) {
    if (!url) return url;
    return url.replace(new RegExp("/" + fromCode + "/"), "/" + toCode + "/");
  });

  // Extract a single attribute out of each item in an array of objects.
  eleventyConfig.addFilter("pluck", function (arr, attr) {
    return Array.isArray(arr) ? arr.map((item) => item[attr]) : arr;
  });

  // Filter an array of products down to a single category.
  // (Nunjucks' built-in selectattr does not support Jinja-style test arguments.)
  eleventyConfig.addFilter("byCategory", function (arr, category) {
    return Array.isArray(arr) ? arr.filter((item) => item.category === category) : arr;
  });

  eleventyConfig.addShortcode("currentYear", () => `${new Date().getFullYear()}`);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
