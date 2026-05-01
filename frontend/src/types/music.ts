export type ApiStatus = "checking" | "connected" | "error";

export type Summary = {
  counts: Record<string, number | null>;
  top_genres: { genre: string; song_count: number }[];
  recent_playlist_adds: {
    added_date: string;
    playlist_name: string;
    song_title: string;
    artist_name: string;
  }[];
};

export type Song = {
  song_id: number;
  title: string;
  duration: number;
  genre: string;
  artist_name: string;
  album_title: string;
};

export type Artist = {
  artist_id: number;
  name: string;
};

export type Album = {
  album_id: number;
  title: string;
  release_date: string | null;
  artist_name: string;
};
