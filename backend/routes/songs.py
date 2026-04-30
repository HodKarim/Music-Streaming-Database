from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import execute_query, execute_transaction, fetch_all, fetch_one
from backend.schemas import SongCreate, SongUpdate


router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("")
def get_songs(
    search: Optional[str] = Query(default=None),
    genre: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    query = """
        SELECT
            s.song_id,
            s.title,
            s.duration,
            s.genre,
            s.album_id,
            s.artist_id,
            ar.name AS artist_name,
            al.title AS album_title
        FROM songs s
        JOIN artists ar ON s.artist_id = ar.artist_id
        JOIN albums al ON s.album_id = al.album_id
        WHERE (%s IS NULL OR s.title LIKE %s)
          AND (%s IS NULL OR s.genre = %s)
        ORDER BY s.title
        LIMIT %s
    """

    search_value = f"%{search}%" if search else None
    return fetch_all(query, (search, search_value, genre, genre, limit))


@router.get("/{song_id}")
def get_song(song_id: int):
    song = fetch_one(
        """
        SELECT
            s.song_id,
            s.title,
            s.duration,
            s.genre,
            s.album_id,
            s.artist_id,
            ar.name AS artist_name,
            al.title AS album_title
        FROM songs s
        JOIN artists ar ON s.artist_id = ar.artist_id
        JOIN albums al ON s.album_id = al.album_id
        WHERE s.song_id = %s
        """,
        (song_id,),
    )

    if not song:
        raise HTTPException(404, detail="Song not found")

    return song


@router.post("")
def create_song(song: SongCreate):
    song_id = execute_query(
        """
        INSERT INTO songs (title, duration, genre, album_id, artist_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (song.title, song.duration, song.genre, song.album_id, song.artist_id),
    )

    return get_song(song_id)


@router.put("/{song_id}")
def update_song(song_id: int, song: SongUpdate):
    get_song(song_id)

    execute_query(
        """
        UPDATE songs
        SET title = %s,
            duration = %s,
            genre = %s,
            album_id = %s,
            artist_id = %s
        WHERE song_id = %s
        """,
        (
            song.title,
            song.duration,
            song.genre,
            song.album_id,
            song.artist_id,
            song_id,
        ),
    )

    return get_song(song_id)


@router.delete("/{song_id}")
def delete_song(song_id: int):
    get_song(song_id)

    execute_transaction(
        [
            (
                """
                DELETE FROM playlist_songs
                WHERE song_id = %s
                """,
                (song_id,),
            ),
            (
                """
                DELETE FROM songs
                WHERE song_id = %s
                """,
                (song_id,),
            ),
        ]
    )
