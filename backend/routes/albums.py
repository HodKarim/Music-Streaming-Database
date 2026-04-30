from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import execute_query, fetch_all, fetch_one
from backend.schemas import AlbumCreate, AlbumUpdate


router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("")
def get_albums(search: Optional[str] = Query(default=None)):
    base_query = """
        SELECT
            al.album_id,
            al.title,
            al.release_date,
            al.artist_id,
            ar.name AS artist_name
        FROM albums al
        JOIN artists ar ON al.artist_id = ar.artist_id
    """

    if search:
        return fetch_all(
            base_query
            + """
            WHERE al.title LIKE %s
            ORDER BY al.title
            """,
            (f"%{search}%",),
        )

    return fetch_all(base_query + " ORDER BY al.title")


@router.get("/{album_id}")
def get_album(album_id: int):
    album = fetch_one(
        """
        SELECT
            al.album_id,
            al.title,
            al.release_date,
            al.artist_id,
            ar.name AS artist_name
        FROM albums al
        JOIN artists ar ON al.artist_id = ar.artist_id
        WHERE al.album_id = %s
        """,
        (album_id,),
    )

    if not album:
        raise HTTPException(404, detail="Album not found")

    return album


@router.post("")
def create_album(album: AlbumCreate):
    album_id = execute_query(
        """
        INSERT INTO albums (title, release_date, artist_id)
        VALUES (%s, %s, %s)
        """,
        (album.title, album.release_date, album.artist_id),
    )

    return get_album(album_id)


@router.put("/{album_id}")
def update_album(album_id: int, album: AlbumUpdate):
    get_album(album_id)

    execute_query(
        """
        UPDATE albums
        SET title = %s, release_date = %s, artist_id = %s
        WHERE album_id = %s
        """,
        (album.title, album.release_date, album.artist_id, album_id),
    )

    return get_album(album_id)


@router.delete("/{album_id}")
def delete_album(album_id: int):
    get_album(album_id)

    execute_query(
        """
        DELETE FROM albums
        WHERE album_id = %s
        """,
        (album_id,),
    )


@router.get("/{album_id}/songs")
def get_album_songs(album_id: int):
    return fetch_all(
        """
        SELECT
            s.song_id,
            s.title,
            s.duration,
            s.genre,
            s.album_id,
            s.artist_id,
            ar.name AS artist_name
        FROM songs s
        JOIN artists ar ON s.artist_id = ar.artist_id
        WHERE s.album_id = %s
        ORDER BY s.title
        """,
        (album_id,),
    )
