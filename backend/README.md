# Events API

## Run locally

Copy `.env.example` to `.env` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Keep the Supabase service-role key out of this Flask app. Install dependencies and start the development server from this directory:

```sh
pip install -r requirements.txt
python app.py
```

## Deploy to Render

The repository-root `render.yaml` defines the web service and uses this directory as its root. Push the project to a Git repository, then create a Render Blueprint from that repository. Enter `SUPABASE_URL` and the Supabase public/anon key when Render prompts for the secret environment variables. Do not add `.env` or a service-role key to the repository.

The service runs with Gunicorn and listens on Render's `PORT`. The root path (`/`) is configured as the health check.

## Database expectations

The API expects `events` and `registrations` tables. Events use `id` and `organizer_id`; registrations use `id`, `event_id`, and `user_id`. Set `EVENT_OWNER_COLUMN` or `REGISTRATION_USER_COLUMN` if your project uses different owner/user column names. Add a unique constraint on `(event_id, user_id)` to prevent duplicate registrations during concurrent requests. Supabase row-level security should allow public event reads and restrict registration reads and writes to the appropriate users.

## Routes

| Method | Route | Authentication |
| --- | --- | --- |
| GET | `/api/events` | Public |
| GET | `/api/events/<id>` | Public |
| POST | `/api/registrations` | Bearer access token |
| GET | `/api/me/registrations` | Bearer access token |
| GET | `/api/events/<id>/registrations` | Bearer access token; event organizer only |

Create a registration by sending JSON such as `{"event_id":"<event-id>"}`. Send the Supabase user's access token in `Authorization: Bearer <access-token>` for authenticated routes. Duplicate registrations return `409`.
