from fastapi import APIRouter, Depends, HTTPException

from backend.auth import can_manage_user_resource, get_current_user
from backend.database import execute_query, execute_transaction, fetch_all, fetch_one
from backend.routes.songs import find_song
from backend.schemas import PlaylistCreate, PlaylistUpdate


router = APIRouter(tags=["playlists"])


@router.get("/users/{user_id}/playlists")
def get_user_playlists(user_id: int, current_user: dict = Depends(get_current_user)):
    if not can_manage_user_resource(current_user, user_id):
        raise HTTPException(403, detail="Cannot view another user's playlists")

    return fetch_all(
        """
        SELECT playlist_id, user_id, name, created_date
        FROM playlists
        WHERE user_id = %s
        ORDER BY created_date DESC
        """,
        (user_id,),
    )


@router.get("/playlists/{playlist_id}")
def get_playlist(playlist_id: int):
    playlist = fetch_one(
        """
        SELECT playlist_id, user_id, name, created_date
        FROM playlists
        WHERE playlist_id = %s
        """,
        (playlist_id,),
    )

    if not playlist:
        raise HTTPException(404, detail="Playlist not found")

    return playlist


@router.post("/playlists")
def create_playlist(
    playlist: PlaylistCreate,
    current_user: dict = Depends(get_current_user),
):
    if not can_manage_user_resource(current_user, playlist.user_id):
        raise HTTPException(403, detail="Cannot create playlists for another user")

    playlist_id = execute_query(
        """
        INSERT INTO playlists (user_id, name, created_date)
        VALUES (%s, %s, CURDATE())
        """,
        (playlist.user_id, playlist.name),
    )

    return get_playlist(playlist_id)


@router.put("/playlists/{playlist_id}")
def update_playlist(
    playlist_id: int,
    playlist: PlaylistUpdate,
    current_user: dict = Depends(get_current_user),
):
    existing_playlist = get_playlist(playlist_id)
    if not can_manage_user_resource(current_user, existing_playlist["user_id"]):
        raise HTTPException(403, detail="Cannot edit another user's playlist")

    execute_query(
        """
        UPDATE playlists
        SET name = %s
        WHERE playlist_id = %s
        """,
        (playlist.name, playlist_id),
    )

    return {**existing_playlist, "name": playlist.name}


@router.delete("/playlists/{playlist_id}")
def delete_playlist(
    playlist_id: int,
    current_user: dict = Depends(get_current_user),
):
    playlist = get_playlist(playlist_id)
    if not can_manage_user_resource(current_user, playlist["user_id"]):
        raise HTTPException(403, detail="Cannot delete another user's playlist")

    execute_transaction(
        [
            (
                """
                DELETE FROM playlist_songs
                WHERE playlist_id = %s
                """,
                (playlist_id,),
            ),
            (
                """
                DELETE FROM playlists
                WHERE playlist_id = %s
                """,
                (playlist_id,),
            ),
        ]
    )


@router.get("/playlists/{playlist_id}/songs")
def get_playlist_songs(
    playlist_id: int,
    current_user: dict = Depends(get_current_user),
):
    playlist = get_playlist(playlist_id)
    if not can_manage_user_resource(current_user, playlist["user_id"]):
        raise HTTPException(403, detail="Cannot view another user's playlist")

    return fetch_all(
        """
        SELECT
            ps.playlist_id,
            ps.song_id,
            ps.added_date,
            s.title,
            s.duration,
            s.genre,
            ar.name AS artist_name,
            al.title AS album_title
        FROM playlist_songs ps
        JOIN songs s ON ps.song_id = s.song_id
        JOIN artists ar ON s.artist_id = ar.artist_id
        JOIN albums al ON s.album_id = al.album_id
        WHERE ps.playlist_id = %s
        ORDER BY ps.added_date DESC
        """,
        (playlist_id,),
    )


@router.post("/playlists/{playlist_id}/songs/{song_id}")
def add_song_to_playlist(
    playlist_id: int,
    song_id: int,
    current_user: dict = Depends(get_current_user),
):
    playlist = get_playlist(playlist_id)
    if not can_manage_user_resource(current_user, playlist["user_id"]):
        raise HTTPException(403, detail="Cannot edit another user's playlist")
    find_song(song_id)

    execute_query(
        """
        INSERT INTO playlist_songs (playlist_id, song_id, added_date)
        VALUES (%s, %s, CURDATE())
        """,
        (playlist_id, song_id),
    )

    return {"playlist_id": playlist_id, "song_id": song_id, "message": "Song added"}


@router.delete("/playlists/{playlist_id}/songs/{song_id}")
def remove_song_from_playlist(
    playlist_id: int,
    song_id: int,
    current_user: dict = Depends(get_current_user),
):
    playlist = get_playlist(playlist_id)
    if not can_manage_user_resource(current_user, playlist["user_id"]):
        raise HTTPException(403, detail="Cannot edit another user's playlist")

    execute_query(
        """
        DELETE FROM playlist_songs
        WHERE playlist_id = %s AND song_id = %s
        """,
        (playlist_id, song_id),
    )
