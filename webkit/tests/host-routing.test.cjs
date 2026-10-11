"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "host-config.js"), "utf8"), sandbox);
const cfg = sandbox.window.TaysonHostConfig;

test("existing routes and GoldHEN V9 stay unchanged", () => {
  assert.equal(cfg.payload.version, "2.4b18.9");
  for (const fw of ["7.00", "9.60"]) assert.equal(cfg.resolveRoute(fw).family, "psfree");
  for (const fw of ["10.00", "11.02"]) assert.equal(cfg.resolveRoute(fw).family, "css");
  for (const fw of ["11.50", "12.00", "12.02"]) assert.equal(cfg.resolveRoute(fw).family, "lapse");
  for (const fw of ["12.50", "12.52", "13.00"]) assert.equal(cfg.resolveRoute(fw).family, "poops");
});
test("13.xx list uses distinct native-cache loader", () => {
  const fam = cfg.families.raw13g;
  assert.equal(fam.nativeCache, true);
  assert.equal(fam.entry, "vendor/raw13g/index.html");
  for (const fw of ["13.02", "13.04", "13.50", "13.52"]) {
    assert.equal(cfg.resolveRoute(fw).family, "raw13g");
  }
});
test("unknown firmware must not be routed into neighboring exploit", () => {
  for (const fw of ["11.52", "13.01", "13.03", "13.05", "13.51", "13.53", "14.00", "abc"]) {
    assert.equal(cfg.resolveRoute(fw), null, fw);
  }
});
test("firmware-specific payload and kernel patches exist and differ", () => {
  const dir = path.join(root, "vendor", "raw13g");
  const required = ["index.html", "jb.html", "jb.js", "ps4_offsets.js", "core.js", "mem.js", "int64.js", "rpc_worker.js", "cache.appcache", "LICENSE", "hen.bin", "goldhen.bin", "patches/1302.bin", "patches/1350.bin", "patches/1352.bin"];
  for (const p of required) assert.ok(fs.statSync(path.join(dir, p)).size > 0, p);
  assert.notDeepEqual(fs.readFileSync(path.join(dir, "hen.bin")), fs.readFileSync(path.join(dir, "goldhen.bin")));
  const offsets = fs.readFileSync(path.join(dir, "ps4_offsets.js"), "utf8");
  assert.match(offsets, /payload:\s*"goldhen\.bin"/);
  assert.match(offsets, /payload:\s*"hen\.bin"/);
  const manifest = fs.readFileSync(path.join(dir, "cache.appcache"), "utf8");
  assert.match(manifest, /^hen\.bin/m);
  assert.match(manifest, /^goldhen\.bin/m);
  assert.doesNotMatch(manifest, /^ps4debug\.bin/m);
});
