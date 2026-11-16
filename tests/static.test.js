// Guards against deploy-breaking mistakes: stale precache list, missing local assets, remote scripts.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const assets = [...sw.matchAll(/"\.\/([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
assets.forEach((a) => assert(fs.existsSync(path.join(root, a)), "sw.js precaches missing file: " + a));

["index.html", "calculators.html"].forEach((page) => {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  for (const m of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)) {
    const url = m[1];
    assert(!/^(https?:)?\/\//.test(url), page + " references remote resource (CSP/offline): " + url);
    if (!url.startsWith("#") && !url.endsWith(".html")) assert(fs.existsSync(path.join(root, url)), page + " references missing file: " + url);
  }
  assert(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), page + " has inline <script> (blocked by CSP script-src 'self')");
});
["js/scores.js", "js/calculators.js", "css/pico.min.css", "calculators.html"].forEach((f) =>
  assert(assets.includes(f), "sw.js precache is missing " + f));

const headers = fs.readFileSync(path.join(root, "_headers"), "utf8");
assert(/Content-Security-Policy/.test(headers) && /frame-ancestors 'none'/.test(headers), "_headers must define CSP");

console.log("Static checks passed (" + assets.length + " precached assets)");
