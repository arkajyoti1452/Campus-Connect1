import base64
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from supabase import create_client

load_dotenv()

app = Flask(__name__)
FRONTEND_ROOT = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "stitch_campus_connect_frontend"
)
FRONTEND_PAGES = {
    "explore": FRONTEND_ROOT / "explore_campus_events" / "code.html",
    "details": FRONTEND_ROOT / "event_details_registration" / "code.html",
    "registrations": FRONTEND_ROOT / "my_registered_events" / "code.html",
    "attendees": FRONTEND_ROOT / "organizer_attendee_management" / "code.html",
}
FRONTEND_ASSETS = {
    name: Path(__file__).resolve().parent.parent / "frontend" / name
    for name in (
        "event-api.js",
        "explore-events.js",
        "event-details.js",
        "my-registrations.js",
        "organizer-attendees.js",
    )
}

EVENTS_TABLE = "events"
REGISTRATIONS_TABLE = "registrations"
EVENT_OWNER_COLUMN = os.environ.get("EVENT_OWNER_COLUMN", "organiser_id")
REGISTRATION_USER_COLUMN = os.environ.get("REGISTRATION_USER_COLUMN", "student_id")
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]


def is_public_supabase_key(key):
    if key.startswith("sb_publishable_"):
        return True
    parts = key.split(".")
    if len(parts) == 3:
        try:
            payload = parts[1] + "=" * (-len(parts[1]) % 4)
            claims = json.loads(base64.urlsafe_b64decode(payload))
            return isinstance(claims, dict) and claims.get("role") == "anon"
        except (ValueError, TypeError, json.JSONDecodeError):
            pass
    return False


def public_supabase_key():
    """Return a Supabase key safe to expose in the browser, if configured."""
    for name in ("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "SUPABASE_KEY"):
        key = os.environ.get(name, "")
        if key and is_public_supabase_key(key):
            return key
    return None


@app.after_request
def add_api_cors_headers(response):
    if request.path.startswith("/api/"):
        origin = request.headers.get("Origin")
        if "*" in CORS_ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = "*"
        elif origin in CORS_ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response


def get_supabase_client(access_token=None):
    """Create an isolated client so one request cannot change another's auth."""
    url = os.environ.get("SUPABASE_URL")
    key = public_supabase_key()
    if not url or not key:
        return None

    client = create_client(url, key)
    if access_token:
        # PostgREST then evaluates requests as the authenticated user and applies RLS.
        client.postgrest.auth(access_token)
    return client


def bearer_token():
    authorization = request.headers.get("Authorization", "")
    scheme, separator, token = authorization.partition(" ")
    if separator and scheme.lower() == "bearer" and token.strip():
        return token.strip()
    return None


def authenticated_client():
    token = bearer_token()
    if not token:
        return None, None, (jsonify({"error": "Authentication required"}), 401)

    client = get_supabase_client(token)
    if client is None:
        return None, None, (jsonify({"error": "Backend is not configured"}), 503)

    try:
        result = client.auth.get_user(token)
        user = getattr(result, "user", None)
        if user is None and isinstance(result, dict):
            user = result.get("user")
        user_id = getattr(user, "id", None)
        if user_id is None and isinstance(user, dict):
            user_id = user.get("id")
        if not user_id:
            raise ValueError("Supabase did not return an authenticated user")
    except Exception:
        return None, None, (jsonify({"error": "Invalid or expired access token"}), 401)

    return client, str(user_id), None


def service_unavailable():
    return jsonify({"error": "Backend is not configured"}), 503


def database_error(error):
    if getattr(error, "code", None) == "23505":
        return jsonify({"error": "Registration already exists"}), 409
    app.logger.exception("Supabase request failed: %s", error)
    return jsonify({"error": "Database request failed"}), 502


@app.get("/")
def index():
    if FRONTEND_PAGES["explore"].is_file():
        return send_file(FRONTEND_PAGES["explore"])
    return jsonify({
        "service": "events-api",
        "endpoints": [
            "GET /api/events",
            "GET /api/events/<id>",
            "POST /api/registrations",
            "GET /api/me/registrations",
            "GET /api/events/<id>/registrations",
        ],
    })


@app.get("/event-details")
def event_details_page():
    return send_file(FRONTEND_PAGES["details"])


@app.get("/my-registrations")
def my_registrations_page():
    return send_file(FRONTEND_PAGES["registrations"])


@app.get("/organizer-attendees")
def organizer_attendees_page():
    return send_file(FRONTEND_PAGES["attendees"])


@app.get("/assets/<asset_name>")
def frontend_asset(asset_name):
    asset = FRONTEND_ASSETS.get(asset_name)
    if asset is None or not asset.is_file():
        return jsonify({"error": "Asset not found"}), 404
    return send_file(asset, mimetype="application/javascript")


@app.get("/api/config")
def public_config():
    """Expose only the public Supabase URL and publishable key to the UI."""
    url = os.environ.get("SUPABASE_URL")
    key = public_supabase_key()
    if not url or not key:
        return service_unavailable()
    return jsonify({"supabase_url": url, "supabase_key": key})


@app.get("/api/events")
def list_events():
    client = get_supabase_client()
    if client is None:
        return service_unavailable()
    try:
        response = client.table(EVENTS_TABLE).select("*").execute()
        return jsonify(response.data)
    except Exception as error:
        return database_error(error)


@app.get("/api/events/<event_id>")
def get_event(event_id):
    client = get_supabase_client()
    if client is None:
        return service_unavailable()
    try:
        response = (
            client.table(EVENTS_TABLE)
            .select("*")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return jsonify({"error": "Event not found"}), 404
        return jsonify(response.data[0])
    except Exception as error:
        return database_error(error)


@app.post("/api/registrations")
def create_registration():
    body = request.get_json(silent=True)
    event_id = body.get("event_id") if isinstance(body, dict) else None
    if not event_id:
        return jsonify({"error": "Request body must include event_id"}), 400

    ticket_tier = body.get("ticket_tier", "standard")
    attendee = body.get("attendee", {})
    if not isinstance(ticket_tier, str) or not ticket_tier.strip() or len(ticket_tier) > 80:
        return jsonify({"error": "ticket_tier must be a non-empty string of at most 80 characters"}), 400
    ticket_tier = ticket_tier.strip()
    if not isinstance(attendee, dict):
        return jsonify({"error": "attendee must be an object"}), 400

    allowed_attendee_fields = {
        "full_name", "email", "affiliation", "dietary_accessibility",
    }
    attendee_details = {
        key: str(value).strip()
        for key, value in attendee.items()
        if key in allowed_attendee_fields and value is not None
    }

    client, user_id, auth_error = authenticated_client()
    if auth_error:
        return auth_error

    try:
        event = (
            client.table(EVENTS_TABLE)
            .select("id")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )
        if not event.data:
            return jsonify({"error": "Event not found"}), 404

        existing = (
            client.table(REGISTRATIONS_TABLE)
            .select("id")
            .eq("event_id", event_id)
            .eq(REGISTRATION_USER_COLUMN, user_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            return jsonify({"error": "Registration already exists"}), 409

        response = client.table(REGISTRATIONS_TABLE).insert({
            "event_id": event_id,
            REGISTRATION_USER_COLUMN: user_id,
            "ticket_tier": ticket_tier,
            "attendee": attendee_details,
        }).execute()
        registration = response.data[0] if response.data else {}
        return jsonify(registration), 201
    except Exception as error:
        return database_error(error)


@app.get("/api/me/registrations")
def my_registrations():
    client, user_id, auth_error = authenticated_client()
    if auth_error:
        return auth_error
    try:
        response = (
            client.table(REGISTRATIONS_TABLE)
            .select("*")
            .eq(REGISTRATION_USER_COLUMN, user_id)
            .execute()
        )
        return jsonify(response.data)
    except Exception as error:
        return database_error(error)


@app.get("/api/events/<event_id>/registrations")
def event_registrations(event_id):
    client, user_id, auth_error = authenticated_client()
    if auth_error:
        return auth_error

    try:
        event_response = (
            client.table(EVENTS_TABLE)
            .select("*")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )
        if not event_response.data:
            return jsonify({"error": "Event not found"}), 404

        event = event_response.data[0]
        if event.get(EVENT_OWNER_COLUMN) != user_id:
            return jsonify({"error": "Only the event organizer can view registrations"}), 403

        response = (
            client.table(REGISTRATIONS_TABLE)
            .select("*")
            .eq("event_id", event_id)
            .execute()
        )
        return jsonify(response.data)
    except Exception as error:
        return database_error(error)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    )
