# ΦTextile V0.3
Open http://127.0.0.1:8000/workbench/textile.html after starting the local server from the repo root as described in docs/workbench.md. Uses default V0.2 pattern settings. No remote dependencies. Enter supplier or off-body measured linear mass, linear resistance and copper mass fraction. No invented material presets. Report includes inputs, geometry, packing and limitations. 10% purchase allowance applies to length, not installed mass.

## Model
L = sum of polyline segment lengths times tile scale. Yarn mass = L times g/m; copper mass = yarn mass times copper mass fraction. Straight-reference resistance = L times measured ohm/m. It does not represent the assembled network. Rectangular packing uses floor((dimension - 2 margin + gap)/(tile + gap)), clamped at zero. No tailoring allowances beyond explicit margins.

## Topology API
Each path has two distinct endpoints (2i and 2i+1). Endpoint bonds are explicit integer pairs; crossings and coincident coordinates are never inferred as joints. Interior junctions require splitting the input path before bonding. The solver computes ideal DC equivalent resistance for connected components up to 150 nodes, using supplied linear resistance and zero contact resistance at bonds. Disconnected returns null; identical ideal nodes return zero. No RF, capacitive, thermal, body, biological, or powered garment model. Use detached samples only. Compare to low-energy off-body meter measurements; never attach a meter to a worn garment. No fabrication or medical certification.

## Validation
Node tests exercise series/parallel reference circuits, disconnected paths, loops, panel packing, material estimates and invalid inputs. Browser UI and actual textile data are not yet validated.
