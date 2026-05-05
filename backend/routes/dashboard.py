from pathlib import Path

from fastapi import APIRouter, Depends
from mysql.connector import Error

from backend.auth import get_current_user, require_admin
from backend.database import fetch_all, fetch_one, get_connection
from backend.load_spotify_features import DEFAULT_CSV_PATH, import_rows


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary(current_user: dict = Depends(get_current_user)):
    counts = fetch_one(
        """
        SELECT
            (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM artists) AS artists,
            (SELECT COUNT(*) FROM albums) AS albums,
            (SELECT COUNT(*) FROM songs) AS songs,
            (SELECT COUNT(*) FROM playlists) AS playlists,
            (SELECT COUNT(*) FROM playlist_songs) AS playlist_songs
        """
    )

    top_genres = fetch_all(
        """
        SELECT genre, COUNT(*) AS song_count
        FROM songs
        GROUP BY genre
        ORDER BY song_count DESC, genre
        LIMIT 8
        """
    )

    recent_playlist_adds = fetch_all(
        """
        SELECT
            ps.added_date,
            p.name AS playlist_name,
            s.title AS song_title,
            ar.name AS artist_name
        FROM playlist_songs ps
        JOIN playlists p ON ps.playlist_id = p.playlist_id
        JOIN songs s ON ps.song_id = s.song_id
        JOIN artists ar ON s.artist_id = ar.artist_id
        ORDER BY ps.added_date DESC, p.name, s.title
        LIMIT 10
        """
    )

    return {
        "counts": counts,
        "top_genres": top_genres,
        "recent_playlist_adds": recent_playlist_adds,
    }


@router.post("/clear")
def clear_database(current_user: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        for table_name in (
            "playlist_songs",
            "playlists",
            "user_sessions",
            "songs",
            "albums",
            "artists",
            "users",
        ):
            cursor.execute(f"TRUNCATE TABLE {table_name}")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        conn.commit()
        return {"message": "Database cleared"}
    except Error:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


@router.post("/clear-songs")
def clear_songs(current_user: dict = Depends(require_admin)):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        for table_name in (
            "playlist_songs",
            "songs",
            "albums",
            "artists",
        ):
            cursor.execute(f"TRUNCATE TABLE {table_name}")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        conn.commit()
        return {"message": "Songs cleared"}
    except Error:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


@router.post("/seed")
def seed_database(limit: int = 50, current_user: dict = Depends(require_admin)):
    csv_path = Path(DEFAULT_CSV_PATH)
    stats = import_rows(csv_path, limit=limit)
    return {"message": "Database filled", "stats": stats}
