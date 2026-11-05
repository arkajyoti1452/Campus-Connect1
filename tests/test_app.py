import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend import app as app_module


class FakeQuery:
    def __init__(self, client, table_name):
        self.client = client
        self.table_name = table_name
        self.filters = []
        self.inserted = None

    def select(self, *_columns):
        return self

    def eq(self, column, value):
        self.filters.append((column, value))
        return self

    def limit(self, _count):
        return self

    def insert(self, value):
        self.inserted = value
        self.client.tables.setdefault(self.table_name, []).append(value)
        return self

    def execute(self):
        rows = self.client.tables.get(self.table_name, [])
        result = [
            row for row in rows
            if all(row.get(column) == value for column, value in self.filters)
        ]
        if self.inserted is not None:
            result = [self.inserted]
        return SimpleNamespace(data=result)


class FakeClient:
    def __init__(self, tables=None, user_id="user-123"):
        self.tables = tables or {}
        self.user_id = user_id
        self.auth = SimpleNamespace(
            get_user=lambda _token: SimpleNamespace(user=SimpleNamespace(id=user_id))
        )
        self.postgrest = SimpleNamespace(auth=lambda _token: None)

    def table(self, table_name):
        return FakeQuery(self, table_name)


class EventsApiTests(unittest.TestCase):
    def setUp(self):
        app_module.app.config.update(TESTING=True)
        self.client = app_module.app.test_client()
        self.event = {
            "id": "event-1",
            "title": "Workshop",
            "organizer_id": "organizer-1",
        }

    def test_home_serves_the_frontend(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Campus Connect", response.data)
        self.assertIn(b"/assets/event-api.js", response.data)
        self.assertIn(b"/assets/explore-events.js", response.data)
        response.close()

    def test_all_frontend_routes_and_assets_are_available(self):
        paths = (
            "/event-details",
            "/my-registrations",
            "/organizer-attendees",
            "/assets/event-api.js",
            "/assets/explore-events.js",
            "/assets/event-details.js",
            "/assets/my-registrations.js",
            "/assets/organizer-attendees.js",
        )
        for path in paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                response.close()

    def test_api_allows_cross_origin_frontend_requests(self):
        response = self.client.options(
            "/api/events",
            headers={"Origin": "https://campus.example"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), "*")

    def test_public_config_requires_a_public_key(self):
        with patch.dict(os.environ, {}, clear=True):
            response = self.client.get("/api/config")
        self.assertEqual(response.status_code, 503)

    def test_public_config_returns_publishable_key(self):
        env = {
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_PUBLISHABLE_KEY": "sb_publishable_test_key",
        }
        with patch.dict(os.environ, env, clear=True):
            response = self.client.get("/api/config")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["supabase_key"], env["SUPABASE_PUBLISHABLE_KEY"])

    def test_public_config_refuses_a_secret_key(self):
        env = {
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_KEY": "sb_" + "secret_do_not_expose",
        }
        with patch.dict(os.environ, env, clear=True):
            response = self.client.get("/api/config")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn(("sb_" + "secret_do_not_expose").encode(), response.data)

    def test_list_events_returns_rows(self):
        events = [self.event]
        fake = FakeClient({"events": events})
        with patch.object(app_module, "get_supabase_client", return_value=fake):
            response = self.client.get("/api/events")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, events)

    def test_event_details_returns_404_when_unknown(self):
        fake = FakeClient({"events": []})
        with patch.object(app_module, "get_supabase_client", return_value=fake):
            response = self.client.get("/api/events/missing")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json["error"], "Event not found")

    def test_private_registration_routes_require_authentication(self):
        create = self.client.post("/api/registrations", json={"event_id": "event-1"})
        mine = self.client.get("/api/me/registrations")
        attendees = self.client.get("/api/events/event-1/registrations")
        self.assertEqual([create.status_code, mine.status_code, attendees.status_code], [401, 401, 401])

    def test_registration_uses_authenticated_user_and_returns_201(self):
        fake = FakeClient({"events": [self.event], "registrations": []})
        with patch.object(app_module, "authenticated_client", return_value=(fake, "user-123", None)):
            response = self.client.post(
                "/api/registrations",
                json={
                    "event_id": "event-1",
                    "ticket_tier": "vip_workshop",
                    "user_id": "attacker-controlled-id",
                    "attendee": {"full_name": "Test Person", "email": "test@example.com"},
                },
            )
        self.assertEqual(response.status_code, 201)
        inserted = fake.tables["registrations"][0]
        self.assertEqual(inserted["user_id"], "user-123")
        self.assertEqual(inserted["ticket_tier"], "vip_workshop")
        self.assertNotEqual(inserted["user_id"], "attacker-controlled-id")

    def test_duplicate_registration_returns_409(self):
        existing = {"id": "registration-1", "event_id": "event-1", "user_id": "user-123"}
        fake = FakeClient({"events": [self.event], "registrations": [existing]})
        with patch.object(app_module, "authenticated_client", return_value=(fake, "user-123", None)):
            response = self.client.post("/api/registrations", json={"event_id": "event-1"})
        self.assertEqual(response.status_code, 409)

    def test_organizer_can_view_attendees_but_other_users_cannot(self):
        fake = FakeClient({
            "events": [self.event],
            "registrations": [{"id": "registration-1", "event_id": "event-1"}],
        })
        with patch.object(app_module, "authenticated_client", return_value=(fake, "organizer-1", None)):
            allowed = self.client.get("/api/events/event-1/registrations")
        with patch.object(app_module, "authenticated_client", return_value=(fake, "user-123", None)):
            denied = self.client.get("/api/events/event-1/registrations")
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed.json, [{"id": "registration-1", "event_id": "event-1"}])
        self.assertEqual(denied.status_code, 403)

    def test_database_connection_failure_is_reported_as_502(self):
        fake = FakeClient()
        fake.table = lambda _table: (_ for _ in ()).throw(ConnectionError("offline"))
        with patch.object(app_module, "get_supabase_client", return_value=fake):
            response = self.client.get("/api/events")
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json["error"], "Database request failed")


if __name__ == "__main__":
    unittest.main()
