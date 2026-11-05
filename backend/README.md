# Backend

This directory contains the Flask API package, local environment example, and Supabase migration. Project setup and Vercel deployment steps are in the repository [README](../README.md).

For the legacy Render deployment, leave the service root at the repository root, install `backend/requirements.txt`, and run:

```sh
gunicorn backend.app:app --bind 0.0.0.0:$PORT
```

Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Render. Never use a Supabase service-role or secret key in the application.
