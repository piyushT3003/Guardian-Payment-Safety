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
        raw_path = environ.get("PATH_INFO", "")
        qs = environ.get("QUERY_STRING", "")

        # Diagnostic inspection endpoint via query param or path
        if "debug=1" in qs or "debug_env" in raw_path:
            headers = [("Content-Type", "application/json")]
            start_response("200 OK", headers)
            info = {k: str(v) for k, v in environ.items() if not k.startswith("wsgi.")}
            return [json.dumps(info, indent=2).encode("utf-8")]

        # In Vercel serverless rewrites, destination `/api/index.py` can replace PATH_INFO
        # Recover the real client request path from WSGI headers/environment
        for key in ["HTTP_X_FORWARDED_URI", "HTTP_X_MATCHED_PATH", "RAW_URI", "REQUEST_URI"]:
            val = environ.get(key)
            if val and not val.endswith("index.py") and not val.endswith("api/index"):
                clean = val.split("?")[0]
                if not clean.startswith("/"):
                    clean = "/" + clean
                environ["PATH_INFO"] = clean
                break

        return self.wsgi_app(environ, start_response)


flask_app.wsgi_app = VercelWSGIMiddleware(flask_app.wsgi_app)
app = flask_app
handler = flask_app
