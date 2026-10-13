"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const cfg = fs.readFileSync(path.join(root, "host-config.js"), "utf8");
const html = fs.readFileSync(path.join(root, "diagnostics.html"), "utf8");
const match = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(match, "Missing diagnostics script");

function run(fw, network, cache) {
  const elements = new Map(), values = new Map();
  const window = { localStorage: {
    getItem: k => values.has(k) ? values.get(k) : null,
    setItem: (k,v) => values.set(k, String(v))
  }};
  const document = { getElementById: id => {
    if (!elements.has(id)) elements.set(id, { textContent:"", href:"" });
    return elements.get(id);
  }};
  const context = { window, document,
    navigator: { userAgent: "Mozilla/5.0 (PlayStation 4 "+fw+")", onLine: network },
    encodeURIComponent };
  vm.runInNewContext(cfg, context);
  if(cache) window.localStorage.setItem(window.TaysonHostConfig.families.lapse.cacheKey, cache);
  vm.runInNewContext(match[1], context);
  return { get: id => elements.get(id).textContent, href: id => elements.get(id).href };
}
test("13.52 remains experimental and manual", () => {
  const p=run("13.52",true);
  assert.equal(p.get("diag-tier"),"Experimental · manual launch");
  assert.match(p.get("diag-note"),/manual 13\.x test/);
  assert.equal(p.href("diag-repair"),"vendor/raw13g/index.html");
  assert.match(p.get("diag-network"),/unverified/);
});
test("12.02 shows configuration rather than asserting test results", () => {
  const p=run("12.02",false,"20261013-preview3-L12");
  assert.equal(p.get("diag-tier"),"Auto-run configured · not hardware-certified");
  assert.match(p.get("diag-cache"),/Stored build \(unverified\)/);
  assert.equal(p.get("diag-network"),"Browser reports offline");
});
test("firmware outside exact routes is unsupported", () => {
  const p=run("13.51",true);
  assert.equal(p.get("diag-tier"),"Unsupported");
  assert.equal(p.get("diag-family"),"None");
});
test("preview3 cached entrypoints use one coherent version", () => {
  const version="20261013-preview3";
  for(const file of ["cache.appcache","slopkit.manifest","css.manifest","lapse.manifest","poops.manifest","psfree.manifest"]) {
    const src=fs.readFileSync(path.join(root,file),"utf8");
    assert.match(src,/diagnostics\.html/);
    assert.ok(src.includes("host-config.js?v="+version),file);
    assert.ok(src.includes("router.js?v="+version),file);
  }
  for(const file of ["index.html","diagnostics.html","recovery.html","self-test.html","run_css.html","run_lapse.html","run_poops.html","run_psfree.html","cache_css.html","cache_lapse.html","cache_poops.html","cache_psfree.html"]){
    const src=fs.readFileSync(path.join(root,file),"utf8");
    assert.ok(src.includes("host-config.js?v="+version),file);
  }
});