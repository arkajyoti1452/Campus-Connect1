"""Vercel entry point that exposes the backend Flask application."""

from flask import Flask

from backend.app import app as backend_app


# Vercel discovers Flask apps by looking for a Flask instance in app.py.
# Delegate its WSGI handling to the application that owns the API routes.
app = Flask(__name__)
app.wsgi_app = backend_app.wsgi_app
