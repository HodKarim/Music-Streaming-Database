import argparse
import csv
import random
from pathlib import Path

from mysql.connector import Error

from backend.database import get_connection


DEFAULT_CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "SpotifyFeatures.csv"


def get_or_create_artist(cursor, name: str) -> tuple[int, bool]:
    cursor.execute(
        """
        SELECT artist_id
        FROM artists
        WHERE name = %s
        LIMIT 1
        """,
        (name,),
    )
    row = cursor.fetchone()

    if row:
        return row["artist_id"], False

    cursor.execute("INSERT INTO artists (name) VALUES (%s)", (name,))
    return cursor.lastrowid, True


def get_or_create_album(cursor, title: str, artist_id: int) -> tuple[int, bool]:
    cursor.execute(
        """
        SELECT album_id
        FROM albums
        WHERE title = %s AND artist_id = %s
        LIMIT 1
        """,
        (title, artist_id),
    )
    row = cursor.fetchone()

    if row:
        return row["album_id"], False

    cursor.execute(
        """
        INSERT INTO albums (title, release_date, artist_id)
        VALUES (%s, NULL, %s)
        """,
        (title, artist_id),
    )
    return cursor.lastrowid, True


def song_exists(cursor, title: str, artist_id: int) -> bool:
    cursor.execute(
        """
        SELECT song_id
        FROM songs
        WHERE title = %s AND artist_id = %s
        LIMIT 1
        """,
        (title, artist_id),
    )
    return cursor.fetchone() is not None


def import_rows(csv_path: Path, limit: int) -> dict[str, int]:
    stats = {"artists": 0, "albums": 0, "songs": 0, "skipped": 0}
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            rows = list(reader)
            random.shuffle(rows)

            for row in rows:
                if stats["songs"] >= limit:
                    break

                artist_name = row.get("artist_name", "").strip()
                track_name = row.get("track_name", "").strip()
                genre = row.get("genre", "").strip() or "Unknown"
                duration_ms = row.get("duration_ms", "").strip()

                if not artist_name or not track_name or not duration_ms:
                    stats["skipped"] += 1
                    continue

                artist_id, created_artist = get_or_create_artist(cursor, artist_name)
                if created_artist:
                    stats["artists"] += 1

                album_id, created_album = get_or_create_album(
                    cursor,
                    f"{genre} Collection",
                    artist_id,
                )
                if created_album:
                    stats["albums"] += 1

                if song_exists(cursor, track_name, artist_id):
                    stats["skipped"] += 1
                    continue

                cursor.execute(
                    """
                    INSERT INTO songs (title, duration, genre, album_id, artist_id)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        track_name,
                        round(int(duration_ms) / 1000),
                        genre,
                        album_id,
                        artist_id,
                    ),
                )
                stats["songs"] += 1

        conn.commit()
        return stats
    except Error:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Load Spotify CSV rows into MySQL.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV_PATH)
    parser.add_argument("--limit", type=int, default=500)
    args = parser.parse_args()

    stats = import_rows(args.csv, args.limit)
    print(
        "Imported "
        f"{stats['songs']} songs, {stats['artists']} artists, "
        f"{stats['albums']} albums. Skipped {stats['skipped']} rows."
    )


if __name__ == "__main__":
    main()
