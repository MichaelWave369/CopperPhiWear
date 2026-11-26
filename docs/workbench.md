# ΦWeave Workbench V0.2
Local browser prototype. Requires Python 3 for the local server, not for the geometry engine.
From the repository root run:
```sh
python -m http.server 8000 --bind 127.0.0.1
```
Open http://127.0.0.1:8000/workbench/ in a modern browser. No external network calls, dependencies or accounts. ES modules require HTTP serving; opening the HTML directly may fail.
Choose a motif, adjust the visible parameters, export SVG or JSON. SVG dimensions are specified in millimeters; verify print scaling with a ruler. JSON stores the exact settings and length metric. The browser engine is independently versioned, not numerically identical to V0.1 Python output. The braid families are presets of a shared mathematical motif, not weaving instructions. Fractal depth is capped at three in the UI. No electrical connectivity model or material mass estimate yet.
Validation: node --test tests/workbench.test.mjs (Node 22); python -m unittest discover -s tests -v. Automated tests cover geometry, not browser interaction or physical properties.
