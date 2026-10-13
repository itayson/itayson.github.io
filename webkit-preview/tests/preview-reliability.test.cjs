"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const moduleSource = read("vendor/raw13g/reload-budget.js");
const budgetModule = import("data:text/javascript;base64," + Buffer.from(moduleSource).toString("base64"));
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: k => values.has(k) ? values.get(k) : null,
    setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
}

test("reload budget persists across page instances and stops after four reloads", async () => {
  const { createReloadBudget } = await budgetModule;
  const s = storage();
  for (let i = 1; i <= 4; i++) {
    const b = createReloadBudget(() => s, "fw-route", null);
    assert.deepEqual(b.reserve(), { allowed: true, count: i });
    assert.equal(b.reserve().reason, "already-scheduled");
  }
  const exhausted = createReloadBudget(() => s, "fw-route", null);
  assert.equal(exhausted.reserve().reason, "limit");
  exhausted.clear();
  assert.equal(createReloadBudget(() => s, "fw-route", null).reserve().allowed, true);
  assert.equal(createReloadBudget(() => s, "other-route", null).count(), 0);
});

test("retry query accepts zero/lower limits, caps large values and defaults malformed input", async () => {
  const { createReloadBudget } = await budgetModule;
  for (const [input, limit] of [["0", 0], ["2", 2], ["9999999999999999999999", 4], ["-1", 4], ["2abc", 4], ["NaN", 4], [null, 4], ["", 4]]) {
    const b = createReloadBudget(() => storage(), "key", input);
    assert.equal(b.limit, limit, String(input));
  }
  assert.equal(createReloadBudget(() => storage(), "key", "0").reserve().reason, "limit");
});

test("storage exceptions, dropped writes and corrupt counters never authorize reload", async () => {
  const { createReloadBudget } = await budgetModule;
  const broken = [
    () => { throw Error("denied"); },
    () => ({ getItem() { throw Error("denied"); } }),
    () => ({ getItem: () => null, setItem() { throw Error("quota"); } }),
    () => ({ getItem: () => null, setItem() {} }),
    ...["", "-1", "2x", "NaN", "9007199254740992"].map(value => () => storage({ key: value }))
  ];
  for (const provider of broken) assert.equal(createReloadBudget(provider, "key", null).reserve().allowed, false);
});

function cacheEntries(relative) {
  let section = "CACHE";
  return read(relative).split(/\r?\n/).flatMap(line => {
    line = line.trim();
    if (["CACHE:", "NETWORK:", "FALLBACK:"].includes(line)) { section = line.slice(0, -1); return []; }
    if (section !== "CACHE" || !line || line.startsWith("#") || line === "CACHE MANIFEST") return [];
    const [url] = line.split(/\s+/);
    return [{ url, hash: (line.match(/#([a-f0-9]{64})/) || [])[1] }];
  });
}

test("all preview manifests reference existing files and hash comments match bytes", () => {
  const manifests = fs.readdirSync(root).filter(n => /\.(manifest|appcache)$/.test(n));
  manifests.push("vendor/raw13g/cache.appcache");
  for (const manifest of manifests) for (const entry of cacheEntries(manifest)) {
    const target = path.join(root, path.dirname(manifest), entry.url.split("?")[0]);
    assert.ok(fs.statSync(target).isFile(), manifest + ": " + entry.url);
    if (entry.hash) assert.equal(crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex"), entry.hash, entry.url);
  }
});

test("family cache URLs match configuration, run pages and actual wrapper script requests", () => {
  const context = { window: {} };
  vm.runInNewContext(read("host-config.js"), context);
  const cfg = context.window.TaysonHostConfig;
  for (const name of ["lapse", "poops", "psfree", "css"]) {
    const family = cfg.families[name];
    const urls = new Set(cacheEntries(family.manifest).map(e => e.url));
    assert.ok(urls.has(family.cachePage), name + " cachePage URL");
    assert.ok(urls.has("run_" + name + ".html"));
    for (const page of ["index.html", "run_" + name + ".html", family.cachePage.split("?")[0]]) {
      for (const match of read(page).matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/g)) {
        assert.ok(urls.has(match[1]), name + ": " + page + " missing " + match[1]);
      }
    }
  }
});

test("primitive and memory consumers share one exact core URL covered by AppCache", () => {
  for (const [dir, consumers, manifest] of [
    ["", ["chain_lapse.js", "chain_poops.js", "mem.js"], "lapse.manifest"],
    ["vendor/raw13g/", ["jb.js", "mem.js"], "vendor/raw13g/cache.appcache"]
  ]) {
    const imports = consumers.map(file => read(dir + file).match(/from\s+["'](\.\/core\.js[^"']*)/)[1]);
    assert.equal(new Set(imports).size, 1, dir);
    assert.ok(cacheEntries(manifest).some(e => e.url === imports[0].slice(2)));
  }
  assert.ok(cacheEntries("vendor/raw13g/cache.appcache").some(e => e.url === "reload-budget.js"));
  assert.match(read("vendor/raw13g/jb.js"), /from "\.\/reload-budget\.js"/);
});

test("Lapse/Poops telemetry makes zero requests by default and uses timeout only when opted in", () => {
  for (const file of ["chain_lapse.js", "chain_poops.js"]) {
    const source = read(file);
    const post = source.slice(source.indexOf("function post(tag, detail)"), source.indexOf("const VERBOSE"));
    assert.match(source, /const TELEMETRY = .*\.get\("telemetry"\) === "1";/);
    for (const enabled of [false, true]) {
      const requests = [];
      const context = { TELEMETRY: enabled, encodeURIComponent, XMLHttpRequest: function () {
        requests.push(this); this.open = (...args) => { this.args = args; };
        this.setRequestHeader = () => {}; this.send = body => { this.body = body; };
      } };
      vm.runInNewContext(post + '\npost("stage", "test");', context);
      assert.equal(requests.length, enabled ? 1 : 0);
      if (enabled) { assert.equal(requests[0].timeout, 2000); assert.equal(requests[0].args[1], "t"); }
    }
  }
});

function runRouter(local, session = storage()) {
  const redirects = [], frames = [], listeners = {}, timers = [];
  const elements = new Map();
  const document = {
    readyState: "complete",
    getElementById(id) { if (!elements.has(id)) elements.set(id, { textContent: "", className: "" }); return elements.get(id); },
    createElement(tag) { return { tag, setAttribute() {}, contentWindow: {} }; },
    body: { appendChild(el) { frames.push(el); el.parentNode = this; }, removeChild() {} }
  };
  const window = { localStorage: local, sessionStorage: session,
    location: { replace: url => redirects.push(url), reload() { redirects.push("reload"); } },
    addEventListener: (name, cb) => { listeners[name] = cb; },
    removeEventListener: name => { delete listeners[name]; },
    setTimeout: cb => { timers.push(cb); return timers.length; }, clearTimeout() {} };
  const context = { window, document, navigator: { userAgent: "Mozilla/5.0 (PlayStation 4 12.02)" }, encodeURIComponent };
  vm.runInNewContext(read("host-config.js"), context);
  vm.runInNewContext(read("router.js"), context);
  return { redirects, frames, listeners, timers, window };
}

test("router refuses cache-install loop if localStorage does not retain the attempt", () => {
  const r = runRouter({ getItem: () => null, setItem() {} });
  assert.equal(r.frames.length, 0);
  assert.equal(r.redirects.length, 1);
  assert.match(r.redirects[0], /CACHE_INSTALL_FAILED/);
});

test("router refuses activation reload if completed cache state cannot be saved", () => {
  const local = storage(), set = local.setItem;
  local.setItem = (key, value) => { if (key.endsWith("_attempts")) set(key, value); };
  const r = runRouter(local);
  assert.equal(r.frames.length, 1);
  r.listeners.message({ source: r.frames[0].contentWindow, data: "TAYSON_CACHE_READY:lapse" });
  assert.match(r.redirects[0], /CACHE_INSTALL_FAILED/);
  assert.equal(r.redirects.includes("reload"), false);
});

test("router accepts persisted cache completion and schedules one activation reload", () => {
  const r = runRouter(storage());
  r.listeners.message({ source: r.frames[0].contentWindow, data: "TAYSON_CACHE_READY:lapse" });
  assert.equal(r.redirects.length, 0);
  r.timers.at(-1)();
  assert.deepEqual(r.redirects, ["reload"]);
});
