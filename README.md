# EventHub API Engine

Campus Connect is a React single-page application served by Flask on Vercel and backed by Supabase. It covers event discovery, event details and registration, personal registrations, and organizer attendee lists. The frontend calls the same-host API by default so it stays aligned with this backend.

## Deploy to Vercel

1. Import this Git repository into Vercel and keep **Root Directory** set to the repository root. Vercel builds the React app from `frontend/` and serves it through Flask.
2. Add these environment variables to Development, Preview, and Production as needed:
   - `SUPABASE_URL`: the project URL from Supabase.
   - `SUPABASE_PUBLISHABLE_KEY`: the project's `sb_publishable_...` key. A legacy anon key can instead be set as `SUPABASE_ANON_KEY`.
3. Deploy or redeploy after saving the variables.
4. In Supabase Auth URL configuration, set the Site URL to the deployed Vercel URL and allow any preview URLs you intend to use for sign-up confirmation.
5. Run `backend/migrations/20261105_add_registration_details.sql` in the Supabase SQL Editor before accepting registrations.

The root `app.py` exports a Flask instance that forwards requests to `backend.app`. Vercel builds `frontend/` and includes `frontend/dist` in the Flask function. The Render service in `render.yaml` remains an API deployment. Do not add a service-role or `sb_secret_...` key to Vercel. The application deliberately exposes only a publishable/anon key through `/api/config`.

For details on Vercel's Flask runtime, see [Vercel's Flask guide](https://vercel.com/docs/frameworks/backend/flask) and [Python runtime configuration](https://vercel.com/docs/functions/runtimes/python).

## Run locally

Create `backend/.env` from `backend/.env.example`. Install Python and frontend dependencies, then run Flask and Vite in separate terminals:

```powershell
python -m pip install -r requirements.txt
cd frontend
npm install
npm run dev
```

In another terminal, run `python backend/app.py`. Open the Vite URL shown in the first terminal (usually `http://localhost:5173`). Vite proxies `/api` requests to Flask on port 5000. To serve the production build through Flask locally, run `npm run build` in `frontend/` first, then open `http://127.0.0.1:5000/`.

## Test

```powershell
python -m unittest discover -s tests -v
```

The API tests use fake Supabase responses and do not create or modify database records. Build the React app with `npm run build` from `frontend/` before running the full test suite.

## API contract

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/events` | Public |
| GET | `/api/events/<id>` | Public |
| POST | `/api/registrations` | Supabase bearer token |
| GET | `/api/me/registrations` | Supabase bearer token |
| GET | `/api/events/<id>/registrations` | Owning organizer only |
| GET | `/api/config` | Public Supabase URL and publishable key |

Registration requests contain `event_id`, `ticket_tier` (`standard` or `vip_workshop`), and attendee details. The backend takes the registration's `student_id` from the validated Supabase access token, not from the request body.

The Supabase project must have `events` and `registrations` tables. This project uses `events.id`, `events.organiser_id`, `registrations.id`, `registrations.event_id`, and `registrations.student_id`. The registration migration adds `ticket_tier` and `attendee`. Configure row-level security to permit public event reads and restrict registration reads/writes to their owner. Add a unique constraint on `(event_id, student_id)` to prevent simultaneous duplicate registrations. If your schema uses other owner/user column names, set `EVENT_OWNER_COLUMN` or `REGISTRATION_USER_COLUMN`.

## Existing Render deployment

`render.yaml` and `backend/requirements.txt` remain available for the existing Render service. Render uses `SUPABASE_ANON_KEY`; Vercel can use either that variable or `SUPABASE_PUBLISHABLE_KEY`.
