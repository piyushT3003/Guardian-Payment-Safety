import os
import sys
import traceback
from pathlib import Path

# Add project root directory to sys.path so app and its modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Explicitly flag serverless environment for DB & stream lifecycle
os.environ["VERCEL"] = "1"

try:
    from app import app
except Exception as exc:
    from flask import Flask, jsonify
    app = Flask(__name__)
    err_tb = traceback.format_exc()
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def startup_fallback(path=""):
        return jsonify({
            "ok": False,
            "error": "Startup exception in Guardian Flask application",
            "details": str(exc),
            "traceback": err_tb.split("\n"),
            "sys_path": sys.path,
            "cwd": os.getcwd()
        }), 500
