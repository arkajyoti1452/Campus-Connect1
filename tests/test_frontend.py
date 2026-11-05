import json
import re
import unittest
from pathlib import Path

from flask import Flask

from app import app as vercel_app


ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"


class FrontendTests(unittest.TestCase):
    def test_react_package_and_scripts_are_configured(self):
        package = json.loads((FRONTEND / "package.json").read_text(encoding="utf-8"))
        self.assertIn("react", package["dependencies"])
        self.assertIn("react-dom", package["dependencies"])
        self.assertIn("vite", package["devDependencies"])
        self.assertEqual(package["scripts"]["build"], "vite build")

    def test_react_app_uses_the_backend_contract(self):
        app_source = (FRONTEND / "src" / "App.jsx").read_text(encoding="utf-8")
        api_source = (FRONTEND / "src" / "api.js").read_text(encoding="utf-8")
        for expected in (
            "'/api/events'",
            "'/api/registrations'",
            "'/api/me/registrations'",
            "/api/events/${encodeURIComponent(eventKey)}/registrations",
            "event_id:",
            "ticket_tier:",
            "attendee:",
            "student_id",
        ):
            self.assertIn(expected, app_source + api_source)
        self.assertIn("/api/config", api_source)
        self.assertIn("Authorization", api_source)

    def test_vite_dev_server_proxies_api_to_flask(self):
        config = (FRONTEND / "vite.config.js").read_text(encoding="utf-8")
        self.assertIn("'/api'", config)
        self.assertIn("http://127.0.0.1:5000", config)

    def test_vercel_builds_react_and_includes_dist(self):
        config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        self.assertIn("npm --prefix frontend run build", config["buildCommand"])
        self.assertEqual(config["functions"]["app.py"]["includeFiles"], "frontend/dist/**/*")

    def test_production_build_is_served_by_flask(self):
        index_file = DIST / "index.html"
        self.assertTrue(index_file.is_file(), "Run npm run build in frontend before the backend tests.")
        index = index_file.read_text(encoding="utf-8")
        self.assertIn('<div id="root">', index)
        asset_paths = re.findall(r'(?:src|href)="(/assets/[^"]+)"', index)
        self.assertTrue(asset_paths)
        self.assertIsInstance(vercel_app, Flask)
        with vercel_app.test_client() as client:
            home = client.get("/")
            self.assertEqual(home.status_code, 200)
            self.assertIn(b'<div id="root">', home.data)
            home.close()
            for path in asset_paths:
                with self.subTest(path=path):
                    response = client.get(path)
                    self.assertEqual(response.status_code, 200)
                    response.close()


if __name__ == "__main__":
    unittest.main()
