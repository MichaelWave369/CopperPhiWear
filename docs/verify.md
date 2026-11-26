# ΦVerify — browser verification
The CI browser job installs pinned Playwright (test-only dependency) and Chromium, serves the repository on a private loopback port, and runs tests against real browser pages. Synthetic fixtures exercise launcher navigation, SVG rendering, hybrid export and reimport via vault, reload and new-tab visibility, backup merge and conflict rejection, hybrid fabrication dimensions, malformed import retention, planned specimen transfer, open-circuit recording, evidence exclusions and endpoint bonding/removal. No synthetic data is persisted to the repository as experimental evidence.

Run locally with Python 3.12:
    python -m pip install -r tests/browser/requirements.txt
    python -m playwright install chromium
    python tests/browser/test_workbench.py

Linux may require `python -m playwright install --with-deps chromium`. The runtime web application still uses no third-party JavaScript packages. This is Chromium integration coverage, not exhaustive browser or accessibility testing, real printer calibration, restart persistence across browser profiles, physical textile testing, medical validation, or a guarantee of fit. The remaining research depends on detached real swatches and documented measurements.

The browser job pins Ubuntu 24.04 because the initial Ubuntu 26.04 runner could not install this Playwright release's Chromium dependencies. Browser verification remains a mandatory job; no failure bypass.
