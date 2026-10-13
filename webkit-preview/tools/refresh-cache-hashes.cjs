"use strict";
// Rebuild SHA-256 comments in the nested preview manifest from actual bytes.
// AppCache uses a changed manifest for invalidation; comments are not SRI.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const manifest = path.resolve(__dirname, "../vendor/raw13g/cache.appcache");
let section = "CACHE";
const content = fs.readFileSync(manifest, "utf8").replace(/\r\n/g, "\n");
const updated = content.split("\n").map((line) => {
  const text = line.trim();
  if (["CACHE:", "NETWORK:", "FALLBACK:"].includes(text)) {
    section = text.slice(0, -1);
    return line;
  }
  if (section !== "CACHE" || !text || text.startsWith("#") || text === "CACHE MANIFEST") return line;
  const url = text.split(/\s+/)[0];
  const file = path.resolve(path.dirname(manifest), url.split("?")[0]);
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  return url + " #" + hash;
}).join("\n");
if (process.argv.includes("--check")) {
  if (updated !== content) {
    console.error("Stale preview cache hashes: run node webkit-preview/tools/refresh-cache-hashes.cjs");
    process.exitCode = 1;
  } else console.log("Preview cache hashes are current.");
} else {
  fs.writeFileSync(manifest, updated);
  console.log("Preview cache hashes updated.");
}
