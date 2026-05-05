from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.auth import get_current_user, require_admin
from backend.database import execute_query, fetch_all, fetch_one
from backend.schemas import AlbumCreate, AlbumUpdate


router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("")
def get_albums(
    search: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    base_query = """
        SELECT
            al.album_id,
            al.title,
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
def get_album(album_id: int, current_user: dict = Depends(get_current_user)):
    return find_album(album_id)


def find_album(album_id: int):
    album = fetch_one(
        """
        SELECT
            al.album_id,
            al.title,
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
def create_album(album: AlbumCreate, current_user: dict = Depends(require_admin)):
    album_id = execute_query(
        """
        INSERT INTO albums (title, artist_id)
        VALUES (%s, %s)
        """,
        (album.title, album.artist_id),
    )

    return get_album(album_id)


@router.put("/{album_id}")
def update_album(
    album_id: int,
    album: AlbumUpdate,
    current_user: dict = Depends(require_admin),
):
    find_album(album_id)

    execute_query(
        """
        UPDATE albums
        SET title = %s, artist_id = %s
        WHERE album_id = %s
        """,
        (album.title, album.artist_id, album_id),
    )

    return get_album(album_id)


@router.delete("/{album_id}")
def delete_album(album_id: int, current_user: dict = Depends(require_admin)):
    find_album(album_id)

    execute_query(
        """
        DELETE FROM albums
        WHERE album_id = %s
        """,
        (album_id,),
    )


@router.get("/{album_id}/songs")
def get_album_songs(
    album_id: int,
    current_user: dict = Depends(get_current_user),
):
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
