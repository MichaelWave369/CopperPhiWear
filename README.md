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
