import json
import sqlite3
from datetime import datetime
from pathlib import Path

from app.models import Mindmap


DATABASE_PATH = Path(__file__).resolve().parent.parent / "mindmaps.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS mindmaps (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            mindmap_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    connection.commit()
    connection.close()


def save_mindmap(
    mindmap_id: str,
    mindmap: Mindmap,
    created_at: datetime,
):
    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO mindmaps (
                id,
                title,
                mindmap_json,
                created_at
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                mindmap_id,
                mindmap.title,
                json.dumps(
                    mindmap.model_dump(
                        by_alias=True
                    )
                ),
                created_at.isoformat(),
            ),
        )

        connection.commit()

    finally:
        connection.close()


def get_mindmap(mindmap_id: str):
    connection = get_connection()

    row = connection.execute(
        """
        SELECT id, title, mindmap_json, created_at
        FROM mindmaps
        WHERE id = ?
        """,
        (mindmap_id,),
    ).fetchone()

    connection.close()

    if row is None:
        return None

    return row


def get_all_mindmaps():
    connection = get_connection()

    rows = connection.execute(
        """
        SELECT id, title, created_at
        FROM mindmaps
        ORDER BY created_at DESC
        """
    ).fetchall()

    connection.close()

    return rows