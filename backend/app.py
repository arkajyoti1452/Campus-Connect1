import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from postgrest import APIError
from supabase import create_client

load_dotenv()

app = Flask(__name__)

EVENTS_TABLE = "events"
REGISTRATIONS_TABLE = "registrations"
EVENT_OWNER_COLUMN = os.environ.get("EVENT_OWNER_COLUMN", "organizer_id")
REGISTRATION_USER_COLUMN = os.environ.get("REGISTRATION_USER_COLUMN", "user_id")


def get_supabase_client(access_token=None):
    """Create an isolated client so one request cannot change another's auth."""
    url = os.environ.get("SUPABASE_URL")
    # Use the public/anon key. Never put a service-role key in this app.
    key = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
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


@app.get("/api/events")
def list_events():
    client = get_supabase_client()
    if client is None:
        return service_unavailable()
    try:
        response = client.table(EVENTS_TABLE).select("*").execute()
        return jsonify(response.data)
    except APIError as error:
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
    except APIError as error:
        return database_error(error)


@app.post("/api/registrations")
def create_registration():
    body = request.get_json(silent=True)
    event_id = body.get("event_id") if isinstance(body, dict) else None
    if not event_id:
        return jsonify({"error": "Request body must include event_id"}), 400

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
        }).execute()
        registration = response.data[0] if response.data else {}
        return jsonify(registration), 201
    except APIError as error:
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
    except APIError as error:
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
    except APIError as error:
        return database_error(error)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    )
