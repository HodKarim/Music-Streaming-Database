"use client";

import { useEffect, useState } from "react";

import { fetchJson, postEmpty } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import type { Album, AlbumAddResult, AlbumSong } from "@/types/music";

type AlbumsPanelProps = {
  onAlbumAdded: () => Promise<void>;
  selectedPlaylistId: string;
  userId: number;
};

export function AlbumsPanel({
  onAlbumAdded,
  selectedPlaylistId,
  userId,
}: AlbumsPanelProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumSongs, setAlbumSongs] = useState<AlbumSong[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [addingAlbum, setAddingAlbum] = useState(false);

  const selectedAlbum =
    albums.find((album) => String(album.album_id) === selectedAlbumId) ?? null;

  useEffect(() => {
    async function loadAlbums() {
      try {
        setLoadingAlbums(true);
        const params = new URLSearchParams();

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const query = params.toString();
        setAlbums(
          await fetchJson<Album[]>(`/albums${query ? `?${query}` : ""}`, {
            userId,
          }),
        );
        setStatus("");
      } catch (caughtError) {
        setStatus(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load albums.",
        );
      } finally {
        setLoadingAlbums(false);
      }
    }

    loadAlbums();
  }, [search, userId]);

  useEffect(() => {
    async function loadAlbumSongs() {
      if (!selectedAlbumId) {
        setAlbumSongs([]);
        return;
      }

      try {
        setLoadingSongs(true);
        setAlbumSongs(
          await fetchJson<AlbumSong[]>(`/albums/${selectedAlbumId}/songs`, {
            userId,
          }),
        );
        setStatus("");
      } catch (caughtError) {
        setStatus(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load album songs.",
        );
      } finally {
        setLoadingSongs(false);
      }
    }

    loadAlbumSongs();
  }, [selectedAlbumId, userId]);

  async function handleAddAlbum() {
    if (!selectedPlaylistId || !selectedAlbumId) {
      setStatus("Select an album and playlist first.");
      return;
    }

    try {
      setAddingAlbum(true);
      const result = await postEmpty<AlbumAddResult>(
        `/playlists/${selectedPlaylistId}/albums/${selectedAlbumId}`,
        { userId },
      );
      await onAlbumAdded();
      setStatus(
        `Added ${result.added} songs. Skipped ${result.skipped} already in the playlist.`,
      );
    } catch (caughtError) {
      setStatus(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not add album.",
      );
    } finally {
      setAddingAlbum(false);
    }
  }

  function handleSearchChange(nextSearch: string) {
    setSearch(nextSearch);
    setSelectedAlbumId("");
    setAlbumSongs([]);
    setStatus("");
  }

  function handleSelectAlbum(album: Album) {
    setSelectedAlbumId(String(album.album_id));
    setStatus("");
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Albums</h2>
          <p className="text-sm text-slate-500">
            Search, open an album, and add its songs to a playlist.
          </p>
        </div>
        <input
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search albums"
          type="search"
          value={search}
        />

        <div className="rounded-md border border-slate-200">
          {loadingAlbums ? (
            <p className="p-3 text-sm text-slate-500">Loading albums...</p>
          ) : null}

          {!loadingAlbums && !albums.length ? (
            <p className="p-3 text-sm text-slate-500">No albums found.</p>
          ) : null}

          {!loadingAlbums && albums.length ? (
            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
              {albums.map((album) => {
                const isSelected = String(album.album_id) === selectedAlbumId;

                return (
                  <button
                    className={`grid w-full gap-1 px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "bg-teal-50 text-teal-950"
                        : "hover:bg-slate-50"
                    }`}
                    key={album.album_id}
                    onClick={() => handleSelectAlbum(album)}
                    type="button"
                  >
                    <span className="font-medium">{album.title}</span>
                    <span className="text-slate-500">{album.artist_name}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        {!selectedAlbum ? (
          <p className="py-3 text-sm text-slate-500">
            Click an album to view its songs.
          </p>
        ) : null}

        {selectedAlbum ? (
          <div className="grid gap-3">
            <div className="text-sm text-slate-600">
              <div className="font-medium text-slate-950">
                {selectedAlbum.title}
              </div>
              <div>
                {selectedAlbum.artist_name} - {albumSongs.length}{" "}
                {albumSongs.length === 1 ? "song" : "songs"}
              </div>
            </div>
            <button
              className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!selectedPlaylistId || addingAlbum || loadingSongs}
              onClick={handleAddAlbum}
              type="button"
            >
              {addingAlbum ? "Adding album..." : "Add album to playlist"}
            </button>
          </div>
        ) : null}

        {loadingSongs ? (
          <p className="py-6 text-sm text-slate-500">Loading album songs...</p>
        ) : null}

        {!loadingSongs && selectedAlbum && !albumSongs.length ? (
          <p className="py-6 text-sm text-slate-500">
            This album has no songs yet.
          </p>
        ) : null}

        {!loadingSongs && albumSongs.length ? (
          <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-slate-100">
            {albumSongs.map((song) => (
              <div className="grid gap-1 py-3 text-sm" key={song.song_id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{song.title}</p>
                  <span className="font-mono text-xs text-slate-500">
                    {formatDuration(song.duration)}
                  </span>
                </div>
                <p className="text-slate-600">{song.genre}</p>
              </div>
            ))}
          </div>
        ) : null}

        {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
      </div>
    </section>
  );
}
