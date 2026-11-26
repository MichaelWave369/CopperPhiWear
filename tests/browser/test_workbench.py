"""Real Chromium integration checks. All data are synthetic test fixtures."""
import functools
import http.server
import json
import pathlib
import threading
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[2]
KEY = "copperphiwear.vault.v1"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class Workbench(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=str(ROOT))
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.context = self.browser.new_context(accept_downloads=True)
        self.errors = []
        self.context.on("page", lambda p: p.on("pageerror", lambda e: self.errors.append(str(e))))
        self.page = self.context.new_page()
        self.page.on("dialog", lambda d: d.accept())

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], "Uncaught browser errors")

    def go(self, name):
        response = self.page.goto(self.base + name, wait_until="load")
        self.assertEqual(response.status, 200)
        expect(self.page.locator("h1")).to_be_visible()

    def download(self, selector):
        with self.page.expect_download() as event:
            self.page.locator(selector).click()
        return pathlib.Path(event.value.path()).read_text(encoding="utf-8")

    def upload(self, selector, data):
        self.page.locator(selector).set_input_files({
            "name": "fixture.json", "mimeType": "application/json",
            "buffer": json.dumps(data).encode(),
        })

    def snapshot(self, name):
        self.page.get_by_placeholder("Snapshot name").fill(name)
        self.page.get_by_role("button", name="Save new snapshot", exact=True).click()
        expect(self.page.get_by_text("Snapshot saved locally.", exact=False)).to_be_visible()

    def load_snapshot(self, kind):
        section = self.page.locator("main > section").filter(
            has=self.page.get_by_role("heading", name="ΦVault local snapshots · " + kind, exact=True)
        )
        section.get_by_role("button", name="Load selected snapshot").click()
        expect(section.get_by_text("Snapshot loaded.", exact=True)).to_be_visible()

    def test_launcher_and_all_modules(self):
        self.go("/")
        links = self.page.locator(".modules a").evaluate_all("(links) => links.map(a => a.getAttribute('href'))")
        self.assertEqual(len(links), 13)
        for link in links:
            self.go("/" + link)
        self.go("/workbench/index.html")
        expect(self.page.locator("#preview svg")).to_be_visible()
        self.page.locator("#pattern").select_option("spiral")
        expect(self.page.locator("#preview svg polyline")).to_have_count(1)

    def test_hybrid_vault_fabrication_roundtrip(self):
        self.go("/workbench/hybrid.html")
        expect(self.page.locator("#preview svg")).to_be_visible()
        self.page.locator("#preset").select_option("braid-369")
        self.page.locator("#load").click()
        self.page.locator("#size").fill("120")
        self.page.locator("#compile").click()
        expect(self.page.locator("#metrics")).to_contain_text('"size_mm": 120')
        original = json.loads(self.download("#json"))
        self.snapshot("Synthetic hybrid")
        self.page.reload(wait_until="load")
        self.load_snapshot("hybrid")
        self.assertEqual(json.loads(self.download("#json")), original)
        self.go("/workbench/fabrication.html")
        self.load_snapshot("hybrid")
        expect(self.page.locator("#hybridSvg")).to_be_enabled()
        self.page.locator("#hybridQuantity").fill("3")
        manifest = json.loads(self.download("#hybridJson"))
        self.assertEqual(manifest["project"], original)
        self.assertEqual(manifest["quantity"], 3)
        svg = self.download("#hybridSvg")
        self.assertIn('width="215.9mm"', svg)
        self.assertIn('h50', svg)
        self.upload("#hybridFile", {"version": 999})
        expect(self.page.locator("#hybridStatus")).to_contain_text("Import rejected")
        self.assertEqual(json.loads(self.download("#hybridJson")), manifest)

    def test_vault_backup_merge_and_conflict(self):
        self.go("/workbench/hybrid.html")
        self.snapshot("Synthetic snapshot")
        self.go("/workbench/vault.html")
        expect(self.page.locator("#records .record")).to_have_count(1)
        backup = json.loads(self.download("#backup"))
        self.upload("#merge", backup)
        self.page.locator("#restore").click()
        expect(self.page.locator("#status")).to_have_text("Backup merged.")
        expect(self.page.locator("#records .record")).to_have_count(1)
        conflict = json.loads(json.dumps(backup))
        conflict["records"][0]["name"] = "Conflict"
        self.upload("#merge", conflict)
        self.page.locator("#restore").click()
        expect(self.page.locator("#status")).to_contain_text("conflicting snapshot ID")
        self.assertEqual(json.loads(self.download("#backup")), backup)
        other = self.context.new_page()
        try:
            other.goto(self.base + "/workbench/vault.html", wait_until="load")
            expect(other.locator("#records")).to_contain_text("Synthetic snapshot")
        finally:
            other.close()

    def test_wear_laboratory_evidence_handoff(self):
        self.go("/workbench/wear.html")
        self.page.locator("#lot").fill("synthetic lot")
        self.page.locator("#substrate").fill("synthetic substrate")
        self.page.get_by_role("button", name="Generate study package").click()
        expect(self.page.locator("#summary")).to_contain_text('"specimens": 9')
        seed = json.loads(self.download("#lab"))
        self.assertEqual(len(seed["samples"]), 9)
        self.assertEqual(seed["readings"], [])
        self.snapshot("Synthetic pilot")
        self.go("/workbench/laboratory.html")
        self.load_snapshot("laboratory")
        expect(self.page.locator("#summary")).to_contain_text('"sample_count": 9')
        form = self.page.locator("#reading")
        form.locator('[name="id"]').fill("TEST-OPEN")
        form.locator('[name="sampleId"]').select_option("CW-02-01")
        form.locator('[name="method"]').fill("synthetic fixture")
        self.page.locator("#readingStatus").select_option("open")
        form.locator('[name="notes"]').fill("synthetic open circuit")
        form.get_by_role("button", name="Append reading").click()
        expect(self.page.locator("#status")).to_contain_text("Reading appended")
        register = json.loads(self.download("#save"))
        self.assertEqual(register["readings"][0]["status"], "open")
        self.assertIsNone(register["readings"][0]["resistanceOhm"])
        self.snapshot("Synthetic observations")
        self.go("/workbench/evidence.html")
        self.page.get_by_label("Saved snapshot").select_option(
            label=self.page.get_by_label("Saved snapshot").locator("option").filter(has_text="Synthetic observations").text_content()
        )
        self.load_snapshot("laboratory")
        self.page.locator("#method").fill("synthetic fixture")
        self.page.locator("#pairs").fill("CW-03-01,CW-02-01")
        self.page.locator("#compare").click()
        expect(self.page.locator("#status")).to_contain_text("1 excluded")
        evidence = json.loads(self.download("#export"))
        self.assertEqual(evidence["summary"]["eligible_pairs"], 0)
        self.assertIsNone(evidence["summary"]["contrast_pp"]["median"])

    def test_material_review_roundtrip(self):
        self.go("/workbench/material.html")
        expect(self.page.locator("#status")).to_have_text("incomplete")
        original = json.loads(self.download("#export"))
        self.assertIsNone(original["quantities"]["copperMassFraction"]["value"])
        self.page.locator("#record").fill("{bad")
        self.page.locator("#evaluate").click()
        expect(self.page.locator("#export")).to_be_disabled()
        self.upload("#import", original)
        expect(self.page.locator("#status")).to_have_text("incomplete")
        self.assertEqual(json.loads(self.download("#export")), original)
        report = json.loads(self.download("#report"))
        self.assertFalse(report["authorized_for_wear"])
        self.assertFalse(report["authorized_for_experiment"])

    def test_junction_bond_and_export(self):
        self.go("/workbench/junction.html")
        expect(self.page.locator("#network svg")).to_be_visible()
        before = json.loads(self.page.locator("#metrics").text_content())
        self.page.locator("#a").select_option("1")
        self.page.locator("#b").select_option("2")
        self.page.locator("#bond").click()
        expect(self.page.locator("#bonds button")).to_have_count(1)
        after = json.loads(self.download("#report"))
        self.assertEqual(after["metrics"]["components"], before["components"] - 1)
        self.assertEqual(after["project"]["bonds"], [[1, 2]])
        self.page.locator("#bonds button").click()
        expect(self.page.locator("#bonds button")).to_have_count(0)
        self.assertEqual(json.loads(self.download("#report"))["metrics"]["components"], before["components"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
