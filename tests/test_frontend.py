import re
import json
import shutil
import subprocess
import unittest
from pathlib import Path

from flask import Flask

from app import app as vercel_app

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
PAGES = (
    FRONTEND / "stitch_campus_connect_frontend" / "explore_campus_events" / "code.html",
    FRONTEND / "stitch_campus_connect_frontend" / "event_details_registration" / "code.html",
    FRONTEND / "stitch_campus_connect_frontend" / "my_registered_events" / "code.html",
    FRONTEND / "stitch_campus_connect_frontend" / "organizer_attendee_management" / "code.html",
)
SCRIPTS = (
    "event-api.js",
    "explore-events.js",
    "event-details.js",
    "my-registrations.js",
    "organizer-attendees.js",
)


class FrontendTests(unittest.TestCase):
    def test_vercel_function_includes_frontend_with_a_glob_string(self):
        config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        include_files = config["functions"]["app.py"]["includeFiles"]
        self.assertIsInstance(include_files, str)
        self.assertEqual(include_files, "frontend/**/*")

    def test_vercel_entrypoint_is_a_flask_app_with_backend_routes(self):
        self.assertIsInstance(vercel_app, Flask)
        with vercel_app.test_client() as client:
            home = client.get("/")
            asset = client.get("/assets/event-api.js")
            self.assertEqual(home.status_code, 200)
            self.assertEqual(asset.status_code, 200)
            home.close()
            asset.close()

    def test_pages_load_shared_api_client_and_page_scripts(self):
        for page in PAGES:
            with self.subTest(page=page.name):
                source = page.read_text(encoding="utf-8")
                self.assertIn('/assets/event-api.js', source)
                self.assertIn('/assets/', source)
        for page, script in zip(PAGES, SCRIPTS[1:]):
            self.assertIn(f'/assets/{script}', page.read_text(encoding="utf-8"))

    def test_api_client_uses_same_origin_and_all_contract_routes(self):
        source = (FRONTEND / "event-api.js").read_text(encoding="utf-8")
        self.assertIn("window.EVENT_API_BASE_URL || ''", source)
        self.assertNotIn("zero5nov-workshop.onrender.com", source)
        for route in (
            "/api/events",
            "/api/registrations",
            "/api/me/registrations",
            "/api/events/${encodeURIComponent(eventId)}/registrations",
        ):
            combined = source + "\n" + "\n".join(
                (FRONTEND / script).read_text(encoding="utf-8") for script in SCRIPTS[1:]
            )
            self.assertIn(route, combined)

    @unittest.skipUnless(shutil.which("node"), "Node.js is not installed")
    def test_frontend_javascript_parses(self):
        scripts = [FRONTEND / name for name in SCRIPTS]
        for page in PAGES:
            source = page.read_text(encoding="utf-8")
            for inline_script in re.findall(r"<script\b[^>]*>(.*?)</script\s*>", source, re.I | re.S):
                if inline_script.strip():
                    result = subprocess.run(
                        ["node", "--check"], input=inline_script, text=True,
                        capture_output=True, check=False,
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
        for script in scripts:
            result = subprocess.run(
                ["node", "--check", str(script)], text=True,
                capture_output=True, check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
