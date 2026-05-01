import { formatDuration } from "@/lib/format";
import type { Song } from "@/types/music";

type SongsTableProps = {
  loading: boolean;
  onSearchChange: (search: string) => void;
  search: string;
  songs: Song[];
};

export function SongsTable({
  loading,
  onSearchChange,
  search,
  songs,
}: SongsTableProps) {
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
            onChange={(event) => onSearchChange(event.target.value)}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {songs.map((song) => (
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
              </tr>
            ))}
            {!songs.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  {loading ? "Loading songs..." : "No songs found."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
