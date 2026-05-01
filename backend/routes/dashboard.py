from fastapi import APIRouter

from backend.database import fetch_all, fetch_one


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_summary():
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
