# Tayson PS4 WebKit — FW 13.xx integration (2026-10-11)

## Firmware chains

| PS4 firmware | Chain in Tayson host | Embedded payload |
|---|---|---|
| 7.00–9.60 | Existing PSFree (unchanged) | GoldHEN V9 (original local payload) |
| 10.00–11.02 | Existing CSSFontFace (unchanged) | GoldHEN V9 (original local payload) |
| 11.50 / 12.00 / 12.02 | Existing Lapse (unchanged) | GoldHEN V9 (original local payload) |
| 12.50 / 12.52 / 13.00 | Existing Poops (unchanged) | GoldHEN V9 (original local payload) |
| 13.02 / 13.04 / 13.50 | Separate WebKit + kernel chain | Candidate newer GoldHEN from community hosts; hardware validation pending |
| 13.52 | Separate WebKit + kernel chain | Same candidate newer GoldHEN (NOT V9), physical test pending |

Only explicitly enumerated firmwares run the 13.xx module; there is no wildcard firmware support and no reuse of 13.50 offsets on unspecified firmwares. GoldHEN 2.4b18.9 (V9) is **not** a 13.52-compatible payload; preserving it for older firmware does not make it compatible with newer firmware.

## Provenance

- Raw13g repository: https://github.com/raw13g/raw13g.github.io pinned to `9ba2f0719591d6900d91aba6cc5291f8fff97e6d`.
- WhiteShadow8500 integration: https://github.com/WhiteShadow8500/WhiteShadow8500.github.io pinned to `719b2b0e4150c0b6be220029ffc0bd79f14da764`.
- Original raw13g code MIT LICENSE is preserved at `vendor/raw13g/LICENSE`. Bundled third-party primitives, GoldHEN, HEN and kernel patches have separate provenance and are not relicensed as MIT.

13.xx module uses a nested PS4 Application Cache and firmware-specific offset/payload routing. The existing `host-config.js` only redirects the browser there; legacy cache keys, payload.bin and chains are not changed.

## Test protocol — before publishing

1. `node --test webkit/tests/host-routing.test.cjs` checks route whitelist, module manifests, binary presence and payload separation.
2. On the original FW 12.02 test that Lapse+V9 still launches, with and without network after cache install.
3. On a FW 13.52 console open the host, confirm nested cache and successful GoldHEN load; check reboots, rest mode and crash logs. The embedded binary's exact SiSTR0 release version is **not established here**; validate against the official release before production deployment.
4. On 13.02 / 13.04 / 13.50, confirm the candidate newer GoldHEN is invoked instead of incorrectly attempting V9; check rest mode and crash logs.
5. On unsupported 13.01, 13.03, 13.51, 14.00 verify that the router refuses automatic execution.
6. Do not update console firmware for this test; use a suitable already-owned test console.

## Status

Code integration only. Static tests do not prove live exploit reliability or firmware safety. Branch must be reviewed and tested physically before merging into the GitHub Pages public host.
