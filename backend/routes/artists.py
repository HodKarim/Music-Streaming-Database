from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.auth import get_current_user, require_admin
from backend.database import execute_query, fetch_all, fetch_one
from backend.schemas import ArtistCreate, ArtistUpdate


router = APIRouter(prefix="/artists", tags=["artists"])


@router.get("")
def get_artists(
    search: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    if search:
        return fetch_all(
            """
            SELECT artist_id, name
            FROM artists
            WHERE name LIKE %s
            ORDER BY name
            """,
            (f"%{search}%",),
        )

    return fetch_all(
        """
        SELECT artist_id, name
        FROM artists
        ORDER BY name
        """
    )


@router.get("/{artist_id}")
def get_artist(
    artist_id: int,
    current_user: dict = Depends(get_current_user),
):
    return find_artist(artist_id)


def find_artist(artist_id: int):
    artist = fetch_one(
        """
        SELECT artist_id, name
        FROM artists
        WHERE artist_id = %s
        """,
        (artist_id,),
    )

    if not artist:
        raise HTTPException(404, detail="Artist not found")

    return artist


@router.post("")
def create_artist(artist: ArtistCreate, current_user: dict = Depends(require_admin)):
    artist_id = execute_query(
        """
        INSERT INTO artists (name)
        VALUES (%s)
        """,
        (artist.name,),
    )

    return get_artist(artist_id)


@router.put("/{artist_id}")
def update_artist(
    artist_id: int,
    artist: ArtistUpdate,
    current_user: dict = Depends(require_admin),
):
    find_artist(artist_id)

    execute_query(
        """
        UPDATE artists
        SET name = %s
        WHERE artist_id = %s
        """,
        (artist.name, artist_id),
    )

    return get_artist(artist_id)


@router.delete("/{artist_id}")
def delete_artist(artist_id: int, current_user: dict = Depends(require_admin)):
    find_artist(artist_id)

    execute_query(
        """
        DELETE FROM artists
        WHERE artist_id = %s
        """,
        (artist_id,),
    )


@router.get("/{artist_id}/songs")
def get_artist_songs(
    artist_id: int,
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
            a.name AS artist_name
        FROM songs s
        JOIN artists a ON s.artist_id = a.artist_id
        WHERE s.artist_id = %s
        ORDER BY s.title
        """,
        (artist_id,),
    )
