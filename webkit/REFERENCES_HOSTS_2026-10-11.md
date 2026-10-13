# Three-host review — 2026-10-11

This review relates to the experimental Tayson firmware 13.xx branch only. No compatibility or successful execution on Tayson's PS4 is claimed.

## Sources, inspected in GitHub

- GamerReady: https://github.com/gamerready/op1 — explicit `SUPPORTED` map 13.02 / 13.04 / 13.50 / 13.52 in `index.html`; AppCache manifest; UI selects `goldhen` or `hen`, with `goldhen` as preferred selection. Its `bin/goldhen.bin` has Git SHA-1 blob `b9c254cb5171f82d8824794c184b968e5c604b24`.
- Mansoor0x: https://github.com/mansoor0x/polpNO — exact same supported 13.xx whitelist, AppCache, offsets, kernel patches. `goldhen.bin` has identical Git blob SHA `b9c254cb5171f82d8824794c184b968e5c604b24`.
- Mustafa: https://github.com/mustafs-ps4-ps5/m — entry page advertises 5.05–13.52 on GitHub; `ran/index.html` selects `slopkit/jb.js?v=19` using `parseFloat(fwVersion)` and `fwNum >= 13.02 && fwNum <= 13.52`. That inclusive range allows **unconfirmed intermediate firmware revisions** into a potentially incompatible exploit. Do **not** port that unguarded range behavior.

## Release source versus hosted binaries

- SiSTRo GoldHEN v2.4b18.11: https://ko-fi.com/s/ccbe9f7bf0 — added 13.52.
- SiSTRo GoldHEN v2.4b18.12: https://ko-fi.com/s/85ea22bd2f — added 13.02, 13.04, 13.50.
- Community-hosted binaries may show GoldHEN strings in plaintext and identical Git hashes, but none of that proves byte-for-byte identity with the official SiSTR0 archive, nor proves safe operation on a user's physical console.
- The earlier Tayson GoldHEN v2.4b18.9 stays in the original, unmodified legacy branch (up to the already implemented 13.00 routes). It cannot be assumed to load on 13.52.
- For new 13.xx routes, stage a candidate newer `goldhen.bin` while keeping `hen.bin` as a separate, non-default fallback asset for investigation. Keep new payload, offsets and kernel patches isolated.

## Exploit risk gates

1. Exact-firmware whitelist: allow 13.02 / 13.04 / 13.50 / 13.52 only. Reject 13.03, 13.05, 13.51 and all unknown revisions. Never blindly run exploit via a `force=1` override in production.
2. Keep AppCache for the new 13.xx subhost independent of legacy caches. Increment its revision whenever a payload changes.
3. Require an offline cache smoke test (all manifest assets load), exact firmware confirmation in PS4 system information and post-boot GoldHEN verification. Rest mode and power-cycle behavior remain untested by the assistant.
4. Independently obtain official binary and compare hashes before claiming a particular SiSTR0 release identifier.
5. Do not merge into production until tests on 13.xx actual hardware and original 12.02 / 13.00 regression smoke tests succeed.
