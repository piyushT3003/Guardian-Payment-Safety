from pathlib import Path
import os, sqlite3

BASE = Path(__file__).resolve().parent.parent
DB = Path(os.environ.get("GUARDIAN_DB_PATH", str(BASE / "guardian.db")))
if DB.exists():
    con = sqlite3.connect(DB)
    for table in ("actions", "alerts", "events"):
        try:
            con.execute(f"DELETE FROM {table}")
        except sqlite3.OperationalError:
            pass
    con.commit()
    con.close()
    print(f"Guardian demo database reset: {DB}")
else:
    print(f"No guardian.db exists at {DB}. Nothing to reset.")
