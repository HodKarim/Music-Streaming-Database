import { useMemo, useState } from "react";

import { formatDuration } from "@/lib/format";
import type { Song } from "@/types/music";

const SONGS_PER_PAGE = 10;

type SongsTableProps = {
  addingSongId: number | null;
  playlistSongIds: Set<number>;
  loading: boolean;
  onAddToPlaylist: (song: Song) => void;
  onSearchChange: (search: string) => void;
  search: string;
  selectedPlaylistId: string;
  songs: Song[];
};

export function SongsTable({
  addingSongId,
  playlistSongIds,
  loading,
  onAddToPlaylist,
  onSearchChange,
  search,
  selectedPlaylistId,
  songs,
}: SongsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(songs.length / SONGS_PER_PAGE), 1);
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * SONGS_PER_PAGE;
  const pageEnd = pageStart + SONGS_PER_PAGE;
  const visibleSongs = useMemo(
    () => songs.slice(pageStart, pageEnd),
    [pageEnd, pageStart, songs],
  );

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
                </tr>
              );
            })}
            {!songs.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
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
