from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sqlite3
import json
import uuid
import io
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "tracker.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trackers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            columns TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS rows (
            id TEXT PRIMARY KEY,
            tracker_id TEXT NOT NULL,
            data TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            notes TEXT DEFAULT '',
            row_index INTEGER,
            FOREIGN KEY (tracker_id) REFERENCES trackers(id)
        )
    """)
    conn.commit()

    # Migration: add color and font_style columns if they don't exist yet
    try:
        conn.execute("ALTER TABLE rows ADD COLUMN color TEXT DEFAULT ''")
        conn.commit()
    except Exception:
        pass

    try:
        conn.execute("ALTER TABLE rows ADD COLUMN font_style TEXT DEFAULT 'normal'")
        conn.commit()
    except Exception:
        pass

    conn.close()


init_db()


def normalize_status(val: str) -> str:
    if not val:
        return "pending"
    v = val.lower().strip()
    if v in ["done", "complete", "completed", "finished", "closed"]:
        return "completed"
    if v in ["in progress", "in-progress", "inprogress", "ongoing", "active", "wip"]:
        return "in-progress"
    if v in ["blocked", "stuck", "on hold", "onhold"]:
        return "blocked"
    if v in ["cancelled", "canceled", "dropped", "removed"]:
        return "cancelled"
    return "pending"


@app.get("/api/trackers")
def get_trackers():
    conn = get_db()
    trackers = conn.execute(
        "SELECT * FROM trackers ORDER BY created_at DESC"
    ).fetchall()
    result = []
    for t in trackers:
        t_dict = dict(t)
        t_dict["columns"] = json.loads(t_dict["columns"])
        rows = conn.execute(
            "SELECT status FROM rows WHERE tracker_id = ?", (t_dict["id"],)
        ).fetchall()
        total = len(rows)
        counts = {"pending": 0, "in-progress": 0, "completed": 0, "blocked": 0, "cancelled": 0}
        for r in rows:
            s = r["status"]
            if s in counts:
                counts[s] += 1
            else:
                counts["pending"] += 1
        t_dict["stats"] = {"total": total, **counts}
        result.append(t_dict)
    conn.close()
    return result


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "upload"

    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(how="all").reset_index(drop=True)

    tracker_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    tracker_name = filename.rsplit(".", 1)[0]
    columns = df.columns.tolist()

    status_col = None
    for col in columns:
        if col.lower() in ["status", "state", "progress", "stage"]:
            status_col = col
            break

    conn = get_db()
    conn.execute(
        "INSERT INTO trackers VALUES (?, ?, ?, ?, ?)",
        (tracker_id, tracker_name, json.dumps(columns), now, now),
    )

    for i, (_, row) in enumerate(df.iterrows()):
        row_id = str(uuid.uuid4())
        row_data = {}
        for col in columns:
            val = row[col]
            if pd.isna(val):
                row_data[col] = ""
            elif hasattr(val, "item"):
                row_data[col] = val.item()
            elif hasattr(val, "isoformat"):
                row_data[col] = val.isoformat()
            else:
                row_data[col] = str(val)

        status = "pending"
        if status_col and row_data.get(status_col):
            status = normalize_status(str(row_data[status_col]))

        conn.execute(
            "INSERT INTO rows (id, tracker_id, data, status, notes, row_index, color, font_style) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (row_id, tracker_id, json.dumps(row_data), status, "", i, "", "normal"),
        )

    conn.commit()

    tracker = conn.execute(
        "SELECT * FROM trackers WHERE id = ?", (tracker_id,)
    ).fetchone()
    rows = conn.execute(
        "SELECT * FROM rows WHERE tracker_id = ? ORDER BY row_index", (tracker_id,)
    ).fetchall()
    conn.close()

    t_dict = dict(tracker)
    t_dict["columns"] = json.loads(t_dict["columns"])
    t_dict["rows"] = [{**dict(r), "data": json.loads(r["data"])} for r in rows]
    return t_dict


@app.get("/api/tracker/{tracker_id}")
def get_tracker(tracker_id: str):
    conn = get_db()
    tracker = conn.execute(
        "SELECT * FROM trackers WHERE id = ?", (tracker_id,)
    ).fetchone()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")

    rows = conn.execute(
        "SELECT * FROM rows WHERE tracker_id = ? ORDER BY row_index", (tracker_id,)
    ).fetchall()
    conn.close()

    t_dict = dict(tracker)
    t_dict["columns"] = json.loads(t_dict["columns"])
    t_dict["rows"] = [{**dict(r), "data": json.loads(r["data"])} for r in rows]
    return t_dict


class RowUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    color: Optional[str] = None
    font_style: Optional[str] = None
    data: Optional[dict] = None


@app.patch("/api/row/{row_id}")
def update_row(row_id: str, update: RowUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM rows WHERE id = ?", (row_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")

    new_status = update.status if update.status is not None else row["status"]
    new_notes = update.notes if update.notes is not None else row["notes"]
    new_color = update.color if update.color is not None else (row["color"] if "color" in row.keys() else "")
    new_font_style = update.font_style if update.font_style is not None else (row["font_style"] if "font_style" in row.keys() else "normal")

    existing_data = json.loads(row["data"])
    if update.data is not None:
        existing_data.update({k: str(v) if v is not None else "" for k, v in update.data.items()})

    conn.execute(
        "UPDATE rows SET status=?, notes=?, color=?, font_style=?, data=? WHERE id=?",
        (new_status, new_notes, new_color, new_font_style, json.dumps(existing_data), row_id),
    )
    conn.execute(
        "UPDATE trackers SET updated_at = ? WHERE id = ?",
        (datetime.utcnow().isoformat(), row["tracker_id"]),
    )
    conn.commit()

    updated = conn.execute("SELECT * FROM rows WHERE id = ?", (row_id,)).fetchone()
    conn.close()

    r_dict = dict(updated)
    r_dict["data"] = json.loads(r_dict["data"])
    return r_dict


@app.delete("/api/tracker/{tracker_id}")
def delete_tracker(tracker_id: str):
    conn = get_db()
    conn.execute("DELETE FROM rows WHERE tracker_id = ?", (tracker_id,))
    conn.execute("DELETE FROM trackers WHERE id = ?", (tracker_id,))
    conn.commit()
    conn.close()
    return {"success": True}


class TrackerUpdate(BaseModel):
    name: Optional[str] = None


@app.patch("/api/tracker/{tracker_id}")
def update_tracker(tracker_id: str, update: TrackerUpdate):
    conn = get_db()
    tracker = conn.execute(
        "SELECT * FROM trackers WHERE id = ?", (tracker_id,)
    ).fetchone()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")

    new_name = update.name.strip() if update.name else tracker["name"]
    now = datetime.utcnow().isoformat()

    conn.execute(
        "UPDATE trackers SET name = ?, updated_at = ? WHERE id = ?",
        (new_name, now, tracker_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "name": new_name}


class BulkUpdate(BaseModel):
    row_ids: List[str]
    status: Optional[str] = None
    notes: Optional[str] = None
    color: Optional[str] = None
    font_style: Optional[str] = None


@app.post("/api/bulk-update")
def bulk_update_rows(update: BulkUpdate):
    if not update.row_ids:
        return {"updated": 0}

    conn = get_db()
    updated = 0
    now = datetime.utcnow().isoformat()
    tracker_ids = set()

    for row_id in update.row_ids:
        row = conn.execute("SELECT * FROM rows WHERE id = ?", (row_id,)).fetchone()
        if not row:
            continue
        new_status = update.status if update.status is not None else row["status"]
        new_notes = update.notes if update.notes is not None else row["notes"]
        new_color = update.color if update.color is not None else (row["color"] if "color" in row.keys() else "")
        new_font_style = update.font_style if update.font_style is not None else (row["font_style"] if "font_style" in row.keys() else "normal")
        conn.execute(
            "UPDATE rows SET status=?, notes=?, color=?, font_style=? WHERE id=?",
            (new_status, new_notes, new_color, new_font_style, row_id),
        )
        tracker_ids.add(row["tracker_id"])
        updated += 1

    for tid in tracker_ids:
        conn.execute(
            "UPDATE trackers SET updated_at = ? WHERE id = ?", (now, tid)
        )

    conn.commit()
    conn.close()
    return {"updated": updated}


# ── Manual tracker creation ──────────────────────────────────────────────────

class CreateTrackerPayload(BaseModel):
    name: str
    columns: List[str]


@app.post("/api/create")
def create_tracker_manual(payload: CreateTrackerPayload):
    name = payload.name.strip()
    cols = [c.strip() for c in payload.columns if c.strip()]
    if not name:
        raise HTTPException(status_code=400, detail="Tracker name is required")
    if not cols:
        raise HTTPException(status_code=400, detail="At least one column is required")

    tracker_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    conn = get_db()
    conn.execute(
        "INSERT INTO trackers VALUES (?, ?, ?, ?, ?)",
        (tracker_id, name, json.dumps(cols), now, now),
    )
    conn.commit()

    tracker = conn.execute(
        "SELECT * FROM trackers WHERE id = ?", (tracker_id,)
    ).fetchone()
    conn.close()

    t_dict = dict(tracker)
    t_dict["columns"] = json.loads(t_dict["columns"])
    t_dict["rows"] = []
    t_dict["stats"] = {"total": 0, "pending": 0, "in-progress": 0, "completed": 0, "blocked": 0, "cancelled": 0}
    return t_dict


# ── Add / delete individual rows ─────────────────────────────────────────────

class AddRowPayload(BaseModel):
    data: dict
    status: Optional[str] = "pending"
    notes: Optional[str] = ""


@app.post("/api/tracker/{tracker_id}/row")
def add_row(tracker_id: str, payload: AddRowPayload):
    conn = get_db()
    tracker = conn.execute(
        "SELECT * FROM trackers WHERE id = ?", (tracker_id,)
    ).fetchone()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")

    max_idx = conn.execute(
        "SELECT COALESCE(MAX(row_index), -1) FROM rows WHERE tracker_id = ?",
        (tracker_id,),
    ).fetchone()[0]

    row_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    status = payload.status or "pending"

    # Serialize data values to strings
    clean_data = {k: str(v) if v is not None else "" for k, v in payload.data.items()}

    conn.execute(
        "INSERT INTO rows (id, tracker_id, data, status, notes, row_index, color, font_style) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (row_id, tracker_id, json.dumps(clean_data), status, payload.notes or "", max_idx + 1, "", "normal"),
    )
    conn.execute(
        "UPDATE trackers SET updated_at = ? WHERE id = ?", (now, tracker_id)
    )
    conn.commit()

    row = conn.execute("SELECT * FROM rows WHERE id = ?", (row_id,)).fetchone()
    conn.close()

    r_dict = dict(row)
    r_dict["data"] = json.loads(r_dict["data"])
    return r_dict


@app.delete("/api/row/{row_id}")
def delete_row(row_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM rows WHERE id = ?", (row_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")

    conn.execute("DELETE FROM rows WHERE id = ?", (row_id,))
    conn.execute(
        "UPDATE trackers SET updated_at = ? WHERE id = ?",
        (datetime.utcnow().isoformat(), row["tracker_id"]),
    )
    conn.commit()
    conn.close()
    return {"success": True}


# ── Column management ────────────────────────────────────────────────────────

class ColumnUpdate(BaseModel):
    columns: List[str]


@app.patch("/api/tracker/{tracker_id}/columns")
def update_columns(tracker_id: str, update: ColumnUpdate):
    cols = [c.strip() for c in update.columns if c.strip()]
    if not cols:
        raise HTTPException(status_code=400, detail="At least one column is required")

    conn = get_db()
    tracker = conn.execute(
        "SELECT * FROM trackers WHERE id = ?", (tracker_id,)
    ).fetchone()
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker not found")

    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE trackers SET columns = ?, updated_at = ? WHERE id = ?",
        (json.dumps(cols), now, tracker_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "columns": cols}
