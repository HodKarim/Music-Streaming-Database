export type ApiStatus = "checking" | "connected" | "error";

export type Summary = {
  counts: Record<string, number | null>;
};

export type Song = {
  song_id: number;
  title: string;
  duration: number;
  genre: string;
  artist_name: string;
  album_title: string;
};

export type User = {
  user_id: number;
  name: string;
  email: string;
  is_admin: boolean;
};

export type Playlist = {
  playlist_id: number;
  user_id: number;
  name: string;
  created_date: string;
};

export type PlaylistSong = Song & {
  added_date: string;
  playlist_id: number;
};
