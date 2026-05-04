import { formatDuration } from "@/lib/format";
import type { Playlist, PlaylistSong, User } from "@/types/music";

type PlaylistsPanelProps = {
  loading: boolean;
  onSelectPlaylist: (playlistId: string) => void;
  onRefreshPlaylists: () => void;
  playlistSongs: PlaylistSong[];
  playlists: Playlist[];
  selectedPlaylistId: string;
  users: User[];
};

export function PlaylistsPanel({
  loading,
  onSelectPlaylist,
  onRefreshPlaylists,
  playlistSongs,
  playlists,
  selectedPlaylistId,
  users,
}: PlaylistsPanelProps) {
  const selectedPlaylist = playlists.find(
    (playlist) => String(playlist.playlist_id) === selectedPlaylistId,
  );

  function getUserName(userId: number) {
    return users.find((user) => user.user_id === userId)?.name ?? "Unknown user";
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Playlists</h2>
          <p className="text-sm text-slate-500">
            View a playlist and add songs from the table.
          </p>
        </div>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
          onChange={(event) => onSelectPlaylist(event.target.value)}
          value={selectedPlaylistId}
        >
          <option value="">Select playlist</option>
          {playlists.map((playlist) => (
            <option key={playlist.playlist_id} value={playlist.playlist_id}>
              {playlist.name} - {getUserName(playlist.user_id)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {selectedPlaylist ? (
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-medium text-slate-950">
              {selectedPlaylist.name}
            </span>{" "}
            created {selectedPlaylist.created_date}
          </div>
        ) : null}

        {selectedPlaylistId ? (
          <div className="flex gap-2 mb-4">
            <button
              className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              onClick={async () => {
                const newName = prompt("Enter new playlist name:");
                if (!newName) return;

                await fetch(`http://127.0.0.1:8000/playlists/${selectedPlaylistId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: newName }),
                });

                await onRefreshPlaylists();
              }}
            >
              Rename</button>  
            <button
              className="h-10 rounded-md bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              onClick={async () => {
                if (!confirm("Delete this playlist?")) return;

                await fetch(`http://127.0.0.1:8000/playlists/${selectedPlaylistId}`, {
                  method: "DELETE",
                });
                await onRefreshPlaylists();
                onSelectPlaylist("");
              }}
            >Delete</button>
          </div>  
        ) : null}

        {loading ? (
          <p className="py-6 text-sm text-slate-500">Loading playlist...</p>
        ) : null}

        {!loading && selectedPlaylistId && !playlistSongs.length ? (
          <p className="py-6 text-sm text-slate-500">
            This playlist has no songs yet.
          </p>
        ) : null}

        {!loading && !selectedPlaylistId ? (
          <p className="py-6 text-sm text-slate-500">
            Select a playlist to view its songs.
          </p>
        ) : null}

        {!loading && playlistSongs.length ? (
          <div className="divide-y divide-slate-100">
            {playlistSongs.map((song) => (
              <div className="grid gap-1 py-3 text-sm" key={song.song_id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{song.title}</p>
                  <span className="font-mono text-xs text-slate-500">
                    {formatDuration(song.duration)}
                  </span>
                </div>
                <p className="text-slate-600">
                  {song.artist_name} - {song.album_title}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  Added {song.added_date}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
