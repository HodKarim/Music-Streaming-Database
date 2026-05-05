export type ApiStatus = "checking" | "connected" | "error";

export type Summary = {
  counts: Record<string, number | null>;
};

export type Song = {
  song_id: number;
  title: string;
  duration: number;
  genre: string;
  album_id: number;
  artist_id: number;
  artist_name: string;
  album_title: string;
};

export type SongPayload = {
  title: string;
  duration: number;
  genre: string;
  artist_name: string;
};

export type SongApiPayload = {
  title: string;
  duration: number;
  genre: string;
  album_id: number;
  artist_id: number;
};

export type User = {
  user_id: number;
  name: string;
  email: string;
  is_admin: boolean;
};

export type AuthUser = User;

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = LoginPayload & {
  name: string;
  is_admin: boolean;
};

export type Artist = {
  artist_id: number;
  name: string;
};

export type Album = {
  album_id: number;
  title: string;
  artist_id: number;
  artist_name: string;
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
