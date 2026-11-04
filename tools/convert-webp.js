/**
 * Converts every .jpg under assets/img to a .webp next to it.
 * Usage: node tools/convert-webp.js [--force]
 * Requires the "sharp" package (npm install sharp).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMG_DIR = path.join(__dirname, "..", "assets", "img");
const QUALITY = 82;
const force = process.argv.includes("--force");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.jpe?g$/i.test(entry.name)) files.push(full);
  }
  return files;
}

async function convert(file) {
  const out = file.replace(/\.jpe?g$/i, ".webp");
  if (!force && fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) {
    return "skip";
  }
  await sharp(file).webp({ quality: QUALITY }).toFile(out);
  return "ok";
}

(async () => {
  const files = walk(IMG_DIR);
  let done = 0;
  let skipped = 0;
  for (const file of files) {
    const result = await convert(file);
    if (result === "skip") skipped++;
    else done++;
  }
  console.log(`WebP generados: ${done}, omitidos: ${skipped}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
