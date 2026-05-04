"use client";

import { useCallback, useEffect, useState } from "react";

import { CountCards } from "@/components/CountCards";
import { CreatePlaylistForm } from "@/components/CreatePlaylistForm";
import { DatabaseControls } from "@/components/DatabaseControls";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PlaylistsPanel } from "@/components/PlaylistsPanel";
import { SongsTable } from "@/components/SongsTable";
import { fetchJson, postEmpty } from "@/lib/api";
import type {
  ApiStatus,
  Playlist,
  PlaylistSong,
  Song,
  Summary,
  User,
} from "@/types/music";

export default function Home() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [search, setSearch] = useState("");
  const [addingSongId, setAddingSongId] = useState<number | null>(null);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false);

  async function refreshSummary() {
    setSummary(await fetchJson<Summary>("/dashboard/summary"));
  }

  const loadPlaylists = useCallback(async (userList: User[]) => {
    const userPlaylists = await Promise.all(
      userList.map((user) =>
        fetchJson<Playlist[]>(`/users/${user.user_id}/playlists`),
      ),
    );

    return userPlaylists.flat();
  }, []);

  const loadOverviewData = useCallback(async () => {
    setStatus("checking");
    const [root, summaryData, userData] = await Promise.all([
      fetchJson<{ message: string }>("/"),
      fetchJson<Summary>("/dashboard/summary"),
      fetchJson<User[]>("/users"),
    ]);
    const playlistData = await loadPlaylists(userData);

    setSummary(summaryData);
    setUsers(userData);
    setPlaylists(playlistData);
    setSelectedPlaylistId(
      playlistData.length === 1 ? String(playlistData[0].playlist_id) : "",
    );
    setStatus(root.message ? "connected" : "error");
    setError("");
  }, [loadPlaylists]);

  const loadSongsData = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    setLoadingSongs(true);
    setSongs(await fetchJson<Song[]>(`/songs?${params.toString()}`));
    setError("");
    setLoadingSongs(false);
  }, [search]);

  useEffect(() => {
    async function loadOverview() {
      try {
        await loadOverviewData();
      } catch (caughtError) {
        setStatus("error");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not reach the API",
        );
      }
    }

    loadOverview();
  }, [loadOverviewData]);

  useEffect(() => {
    async function loadSongs() {
      try {
        await loadSongsData();
      } catch (caughtError) {
        setStatus("error");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load songs",
        );
      } finally {
        setLoadingSongs(false);
      }
    }

    loadSongs();
  }, [loadSongsData]);

  async function handleDatabaseChanged() {
    setPlaylistSongs([]);
    await loadOverviewData();
    await loadSongsData();
  }

  useEffect(() => {
    async function loadPlaylistSongs() {
      if (!selectedPlaylistId) {
        setPlaylistSongs([]);
        return;
      }

      try {
        setLoadingPlaylistSongs(true);
        setPlaylistSongs(
          await fetchJson<PlaylistSong[]>(
            `/playlists/${selectedPlaylistId}/songs`,
          ),
        );
        setError("");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load playlist songs",
        );
      } finally {
        setLoadingPlaylistSongs(false);
      }
    }

    loadPlaylistSongs();
  }, [selectedPlaylistId]);

  async function refreshPlaylists(nextSelectedPlaylistId = selectedPlaylistId) {
    const playlistData = await loadPlaylists(users);
    setPlaylists(playlistData);
    setSelectedPlaylistId(nextSelectedPlaylistId);
  }

  function handlePlaylistCreated(playlist: Playlist) {
    Promise.all([refreshSummary(), refreshPlaylists(String(playlist.playlist_id))])
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not refresh playlists",
        );
      });
  }

  async function handleAddToPlaylist(song: Song) {
    if (!selectedPlaylistId) {
      setError("Select a playlist before adding songs.");
      return;
    }

    try {
      setAddingSongId(song.song_id);
      await postEmpty<{ message: string }>(
        `/playlists/${selectedPlaylistId}/songs/${song.song_id}`,
      );
      setPlaylistSongs(
        await fetchJson<PlaylistSong[]>(`/playlists/${selectedPlaylistId}/songs`),
      );
      setError("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? `Could not add song: ${caughtError.message}`
          : "Could not add song",
      );
    } finally {
      setAddingSongId(null);
    }
  }

  const playlistSongIds = new Set(playlistSongs.map((song) => song.song_id));

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader error={error} status={status} />
        <CountCards counts={summary?.counts} />

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <SongsTable
            addingSongId={addingSongId}
            playlistSongIds={playlistSongIds}
            loading={loadingSongs}
            onAddToPlaylist={handleAddToPlaylist}
            onSearchChange={setSearch}
            search={search}
            selectedPlaylistId={selectedPlaylistId}
            songs={songs}
          />
          <div className="flex flex-col gap-6">
            <DatabaseControls onChanged={handleDatabaseChanged} />
            <CreatePlaylistForm
              onCreated={handlePlaylistCreated}
              users={users}
            />
            <PlaylistsPanel
              loading={loadingPlaylistSongs}
              onSelectPlaylist={setSelectedPlaylistId}
              onRefreshPlaylists={refreshPlaylists}
              playlistSongs={playlistSongs}
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              users={users}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
