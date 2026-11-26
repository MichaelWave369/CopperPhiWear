# ΦWear V0.9: physical study preparation
Start the local server from the repo root: python -m http.server 8000 --bind 127.0.0.1. Open http://127.0.0.1:8000/ for all modules. The ΦWear module creates a pilot (plain control, straight reference, TriBraid; three planned specimens each) or full study (nine motifs and two controls; 33 at default replication). Begin with the pilot. Enter documented material and substrate lots, select tile size, and generate. Export manifest, order CSV, reference SVGs and ΦLaboratory seed. The seed is a register of planned IDs, not fabricated specimens; do not interpret its sample count as finished work. Confirm actual construction, material, dimensions and measurement terminals before recording any readings. To correct planned sample metadata before measurement, edit a local copy of the seed JSON and import it into ΦLaboratory; retain the original manifest and record changes. No automatic synchronization between modules.

The straight reference is a line centered across 80% of tile width; plain control has no conductor. Draw these manually with a ruler on the same substrate. Neither is a length-matched comparator for complex designs. Record actual lengths/masses and mismatches, and consider a separate matched experiment before drawing causal conclusions. The default seed 369 creates a deterministic pseudo-random measurement order, not cryptographic randomization or blinding. Verify print calibration. Use nonconductive practice material first and detached samples only. Follow docs/protocol.md, record actual method and instrument uncertainty, retain all failures. Do not measure a worn garment. No medical data or efficacy claim.

## Acceptance gates
- Software: automated model and Chromium integration checks; physical printing and cross-browser coverage remain pending.
- Material: documented composition, care and garment suitability; no loose or sharp conductors.
- Fabrication: independently fabricated swatches, measured dimensions and calibration, documented connections.
- Measurement: baseline, defined flex/abrasion methods, preserved raw readings and all failures.
- Review: evaluate results and limitations independently; a wearable is a separate decision requiring fit and material safety review. No completed physical prototype is claimed.

Hybrid compositions have calibrated fabrication references but are not accepted as study or garment inputs yet. No licensing decision has been made.
