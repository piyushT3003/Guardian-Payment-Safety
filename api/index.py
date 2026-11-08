import os
import sys
import json
import traceback
from pathlib import Path

# Add project root directory to sys.path so app and its modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Explicitly flag serverless environment for DB & stream lifecycle
os.environ["VERCEL"] = "1"

try:
    from app import app as flask_app
except Exception as exc:
    from flask import Flask, jsonify
    flask_app = Flask(__name__)
    err_tb = traceback.format_exc()
    @flask_app.route("/", defaults={"path": ""})
    @flask_app.route("/<path:path>")
    def startup_fallback(path=""):
        return jsonify({
            "ok": False,
            "error": "Startup exception in Guardian Flask application",
            "details": str(exc),
            "traceback": err_tb.split("\n"),
            "sys_path": sys.path,
            "cwd": os.getcwd()
        }), 500


class VercelWSGIMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        qs = environ.get("QUERY_STRING", "")

        # Synchronize PATH_INFO from ?path=... query parameter passed by Vercel rewrites
        if "path=" in qs:
            for part in qs.split("&"):
                if part.startswith("path="):
                    p = part[5:]
                    if p:
                        import urllib.parse
                        decoded = urllib.parse.unquote(p)
                        if not decoded.startswith("/"):
                            decoded = "/" + decoded
                        environ["PATH_INFO"] = decoded.split("?")[0]
                    else:
                        environ["PATH_INFO"] = "/"
                    break

        return self.wsgi_app(environ, start_response)


flask_app.wsgi_app = VercelWSGIMiddleware(flask_app.wsgi_app)
app = flask_app
handler = flask_app
