import type { Album, Artist, Summary } from "@/types/music";

type OverviewPanelsProps = {
  albums: Album[];
  artists: Artist[];
  summary: Summary | null;
};

export function OverviewPanels({ albums, artists, summary }: OverviewPanelsProps) {
  const maxGenreCount = Math.max(
    ...(summary?.top_genres.map((item) => item.song_count) ?? [1]),
    1,
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Top Genres</h2>
          <div className="mt-4 flex flex-col gap-3">
            {summary?.top_genres.map((item) => (
              <div key={item.genre}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {item.genre}
                  </span>
                  <span className="text-slate-500">{item.song_count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-600"
                    style={{
                      width: `${Math.max(
                        8,
                        (item.song_count / maxGenreCount) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Recent Playlist Adds
          </h2>
          <div className="mt-4 flex flex-col divide-y divide-slate-100">
            {summary?.recent_playlist_adds.map((item) => (
              <div
                className="grid gap-1 py-3 text-sm"
                key={`${item.playlist_name}-${item.song_title}-${item.added_date}`}
              >
                <p className="font-medium text-slate-950">{item.song_title}</p>
                <p className="text-slate-600">
                  {item.artist_name} in {item.playlist_name}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  {item.added_date}
                </p>
              </div>
            ))}
            {!summary?.recent_playlist_adds.length ? (
              <p className="py-6 text-sm text-slate-500">
                No playlist activity yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="grid gap-6 lg:col-span-2 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Artists</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {artists.map((artist) => (
              <div
                className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                key={artist.artist_id}
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Albums</h2>
          <div className="mt-4 grid gap-3">
            {albums.map((album) => (
              <div className="text-sm" key={album.album_id}>
                <p className="font-medium text-slate-950">{album.title}</p>
                <p className="text-slate-500">
                  {album.artist_name}
                  {album.release_date ? ` - ${album.release_date}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
