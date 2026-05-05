import { useMemo, useState } from "react";

import { formatDuration } from "@/lib/format";
import type { Song, SongPayload } from "@/types/music";

const SONGS_PER_PAGE = 10;

type SongsTableProps = {
  addingSongId: number | null;
  isAdmin: boolean;
  playlistSongIds: Set<number>;
  loading: boolean;
  onAddToPlaylist: (song: Song) => void;
  onCreateSong: (song: SongPayload) => Promise<void>;
  onDeleteSong: (song: Song) => Promise<void>;
  onSearchChange: (search: string) => void;
  onUpdateSong: (songId: number, song: SongPayload) => Promise<void>;
  search: string;
  selectedPlaylistId: string;
  songs: Song[];
};

export function SongsTable({
  addingSongId,
  isAdmin,
  playlistSongIds,
  loading,
  onAddToPlaylist,
  onCreateSong,
  onDeleteSong,
  onSearchChange,
  onUpdateSong,
  search,
  selectedPlaylistId,
  songs,
}: SongsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState("");
  const emptySongForm = {
    artist_name: "",
    duration: 180,
    genre: "",
    title: "",
  };
  const [songForm, setSongForm] = useState<SongPayload>(emptySongForm);
  const genreOptions = useMemo(
    () =>
      Array.from(new Set(songs.map((song) => song.genre).filter(Boolean))).sort(
        (left, right) => left.localeCompare(right),
      ),
    [songs],
  );
  const totalPages = Math.max(Math.ceil(songs.length / SONGS_PER_PAGE), 1);
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * SONGS_PER_PAGE;
  const pageEnd = pageStart + SONGS_PER_PAGE;
  const visibleSongs = useMemo(
    () => songs.slice(pageStart, pageEnd),
    [pageEnd, pageStart, songs],
  );

  function startEditing(song: Song) {
    setEditingSongId(song.song_id);
    setFormStatus("");
    setSongForm({
      artist_name: song.artist_name,
      duration: song.duration,
      genre: song.genre,
      title: song.title,
    });
  }

  function resetForm() {
    setEditingSongId(null);
    setSongForm({
      artist_name: "",
      duration: 180,
      genre: "",
      title: "",
    });
  }

  async function handleSongSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...songForm,
      artist_name: songForm.artist_name.trim(),
      genre: songForm.genre.trim(),
      title: songForm.title.trim(),
    };

    if (
      !payload.title ||
      !payload.genre ||
      !payload.artist_name ||
      payload.duration <= 0
    ) {
      setFormStatus("Complete the song details before saving.");
      return;
    }

    try {
      if (editingSongId) {
        await onUpdateSong(editingSongId, payload);
        setFormStatus("Song updated.");
      } else {
        await onCreateSong(payload);
        setFormStatus("Song created.");
      }
      resetForm();
    } catch (caughtError) {
      setFormStatus(
        caughtError instanceof Error ? caughtError.message : "Could not save song.",
      );
    }
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Songs</h2>
          <p className="text-sm text-slate-500">Song, artist, and album data.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
            onChange={(event) => {
              setCurrentPage(1);
              onSearchChange(event.target.value);
            }}
            placeholder="Search songs"
            type="search"
            value={search}
          />
        </div>
      </div>
      {isAdmin ? (
        <form
          className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-6"
          onSubmit={handleSongSubmit}
        >
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2 xl:col-span-2"
            onChange={(event) =>
              setSongForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Song title"
            type="text"
            value={songForm.title}
          />
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
            onChange={(event) =>
              setSongForm((current) => ({ ...current, genre: event.target.value }))
            }
            placeholder="Genre"
            list="song-genre-options"
            type="text"
            value={songForm.genre}
          />
          <datalist id="song-genre-options">
            {genreOptions.map((genre) => (
              <option key={genre} value={genre} />
            ))}
          </datalist>
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
            min={1}
            onChange={(event) =>
              setSongForm((current) => ({
                ...current,
                duration: Number(event.target.value),
              }))
            }
            placeholder="Seconds"
            type="number"
            value={songForm.duration}
          />
          <input
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2 xl:col-span-2"
            onChange={(event) =>
              setSongForm((current) => ({
                ...current,
                artist_name: event.target.value,
              }))
            }
            placeholder="Artist"
            type="text"
            value={songForm.artist_name}
          />
          <div className="flex gap-2 xl:col-span-6">
            <button
              className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              type="submit"
            >
              {editingSongId ? "Update song" : "Create song"}
            </button>
            {editingSongId ? (
              <button
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={resetForm}
                type="button"
              >
                Cancel
              </button>
            ) : null}
            {formStatus ? (
              <p className="self-center text-sm text-slate-600">{formStatus}</p>
            ) : null}
          </div>
        </form>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Artist</th>
              <th className="px-4 py-3 font-semibold">Album</th>
              <th className="px-4 py-3 font-semibold">Genre</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
              <th className="px-4 py-3 font-semibold">Add</th>
              {isAdmin ? <th className="px-4 py-3 font-semibold">Edit</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleSongs.map((song) => {
              const isAlreadyAdded = playlistSongIds.has(song.song_id);
              const isAdding = addingSongId === song.song_id;

              return (
                <tr key={song.song_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {song.title}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {song.artist_name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {song.album_title}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{song.genre}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {formatDuration(song.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={!selectedPlaylistId || isAlreadyAdded || isAdding}
                      onClick={() => onAddToPlaylist(song)}
                      type="button"
                    >
                      {isAdding ? "Adding" : isAlreadyAdded ? "Added" : "Add"}
                    </button>
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          onClick={() => startEditing(song)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800"
                          onClick={() => {
                            onDeleteSong(song).catch((caughtError) =>
                              setFormStatus(
                                caughtError instanceof Error
                                  ? caughtError.message
                                  : "Could not delete song.",
                              ),
                            );
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {!songs.length ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500"
                  colSpan={isAdmin ? 7 : 6}
                >
                  {loading ? "Loading songs..." : "No songs found."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {songs.length ? pageStart + 1 : 0}-
          {Math.min(pageEnd, songs.length)} of {songs.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="h-9 rounded-md border border-slate-300 px-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={activePage === 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            type="button"
          >
            Previous
          </button>
          <span className="min-w-16 text-center">
            {activePage} / {totalPages}
          </span>
          <button
            className="h-9 rounded-md border border-slate-300 px-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={activePage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
