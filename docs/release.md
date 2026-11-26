# CopperPhiWear 1.0.0-rc.1 — release acceptance

## Scope
Local-first research software for passive conductive textile concepts and detached experimental swatches. The release candidate is a source-tree version marker, not a GitHub Release/tag or a certification. No license has been selected; publication of source alone does not grant an open-source license.

## Reproduce
Clone or check out the candidate commit. From repo root:
    python -m http.server 8000 --bind 127.0.0.1
Open http://127.0.0.1:8000/. Keep the server bound to loopback. Runtime needs a modern browser with ES modules; vault writes require Web Locks and a secure context such as loopback. Existing JSON files are the portable fallback. No external runtime JavaScript dependencies. Save backups; local storage is not encrypted and may be cleared.

## Acceptance ledger
- [x] Previous exact baseline: `969a9824d3354ffb4d3ccae8f7910376bce113be`, [CI 45773673566](https://github.com/MichaelWave369/CopperPhiWear/actions/runs/45773673566).
- [x] Baseline Python model tests: 2 passed; Node tests: 60 passed; Chromium scenarios: 5 passed.
- [x] Initial browser setup incompatibility diagnosed and corrected by pinning Ubuntu 24.04.
- [ ] Verify CI at the candidate commit itself (both jobs required; do not infer success from the parent).
- [ ] Owner selects license and confirms distribution terms before claiming an open-source release.
- [ ] Owner approves final version/tag and release notes.
- [ ] Physical print calibration, substrate and conductor inspection, detached swatch tests.
- [ ] Independent review before any wearable trial; no health claims.

## Known limitations
Single-page reference sheets; hybrid compositions are not garment panel inputs. No inferred electrical junctions, interior splitting, real contact resistance or powered garment model. Junction records use standalone JSON. Manifest links are contextual assertions, not experimental provenance. Laboratory comparisons are descriptive, use declared pairs and exploratory match tolerances, and do not propagate instrument uncertainty. No automated sync across all modules. ΦVault is origin/profile-specific and capped. Firefox, Safari, full accessibility, mobile layout, actual printing and long-term browser storage behavior are not comprehensively verified.

## Research boundary
Never connect power, grounding or measuring instruments to worn garments. No protective equipment, shielding certification, medical advice or clinical efficacy. Do not commit personal health data. Use only detached samples for the initial pilot. Keep results and negative outcomes separate from simulated fixtures.
