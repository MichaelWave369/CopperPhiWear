# CopperPhiWear (ΦCW)

An open research project exploring passive conductive textile geometry, inspired by braided networks, Fibonacci branching, NBG pocket meshes and recursive Altermath motifs.

**Research prototype, not a medical device, electrical PPE, or validated RF shield.** No geometry is presumed to improve health. The initial objective is measurable textile engineering, not treatment or electromagnetic therapy.

## V0.1: PocketMesh Core
A removable textile liner for an existing long-sleeve hoodie, with nested square motifs on torso panels, three-strand braid motifs on the back and sleeves, and optional hexagonal shoulder swatches. Begin with small off-body samples. Use only flexible garment-rated materials, with conductive elements fully enclosed and no exposed metal ends. Do not make continuous conductive rings around the neck or limbs. Keep panels electrically isolated by default; no power, batteries, grounding or body electrodes. Never use near electrical equipment, during storms, while charging devices, or as protective equipment. Do not sleep in prototypes. Stop use if irritation, discomfort, overheating or damaged lining occurs.

## Nine candidate geometries
1. TriBraid: three interlaced paths.
2. HexBraid: six interlaced paths.
3. GoldenBranch: Fibonacci-inspired spacing.
4. Mycelium: branching and cross-links.
5. PocketMesh: nested square cells.
6. HexMesh: honeycomb.
7. Spiral: open spiral path.
8. FractalBraid: recursive branch motifs.
9. PhiHybrid: modular combination of braid, pocket and hex motifs.

## Research workflow
- Start with identical-size flat swatches, a nonconductive control and a straight-line conductive reference.
- Document material, copper content, dimensions, mass, construction, and whether crossings are connected or insulated.
- Compare length, coverage, resistance, flex durability, abrasion and comfort proxies. RF tests require suitable equipment and controlled off-body fixtures.
- Match conductor mass or length where feasible; otherwise report the difference. Repeat and retain raw data, including null results.
- No biological benefit can be inferred from resistance, geometry, or shielding measurements.

## Repository
- `docs/architecture.md`: prototype construction and design gates.
- `docs/protocol.md`: off-body comparison protocol.
- `patterns/catalog.json`: machine-readable candidate designs.
- `tools/patterns.py`: dependency-free SVG concept generator.
- `tests/test_patterns.py`: generator validation.

## Direction
A local, inspectable design-to-swatch workflow, with reproducible geometric models and honest evidence boundaries. Licensing is to be selected by the repository owner before external reuse.

## V0.9 integrated research workbench
From the repository root, start `python -m http.server 8000 --bind 127.0.0.1` and open http://127.0.0.1:8000/. The launcher links ΦWeave, ΦTextile, ΦGarment, ΦFabrication, ΦLaboratory, ΦOptimize, ΦHybrid and ΦWear. See `docs/wear.md` for the reproducible pilot and full study packages. V0.9 prepares detached specimens; no physical wearable has been fabricated or validated. Export local JSON files before closing; module handoffs are manual. Run `python -m unittest discover -s tests -v` and `node --test tests/*.test.mjs` for model validation.

## V1.0 development: ΦVault
Save named local snapshots in garment, hybrid and laboratory editors. Manage backups from the launcher; see `docs/vault.md`. No automatic saving, encryption or cloud synchronization. Browser storage is not a substitute for portable backups.

## ΦBridge
Capture vault snapshots into a portable research manifest with typed contextual links and derived reports. See `docs/bridge.md`. Links do not establish experimental provenance or medical evidence.

## ΦHybrid fabrication
Load saved hybrid compositions directly in ΦFabrication, retaining original scale and recursive transforms. Export a calibrated reference SVG and a versioned fabrication manifest; ΦBridge reports paper fit. See `docs/fabrication.md`.

## ΦJunction
Inspect detached swatch topology with explicit coincident endpoint bonds and ideal DC analysis. See `docs/junction.md`. No implicit electrical connections or on-body measurements.

## ΦEvidence
Compare explicitly paired detached swatches with documented matching criteria, retained exclusions and descriptive contrasts. See `docs/evidence.md`. No causal or health inference.
