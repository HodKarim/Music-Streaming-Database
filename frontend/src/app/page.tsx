"use client";

import { useCallback, useEffect, useState } from "react";

import { AccountPanel } from "@/components/AccountPanel";
import { CountCards } from "@/components/CountCards";
import { CreatePlaylistForm } from "@/components/CreatePlaylistForm";
import { DatabaseControls } from "@/components/DatabaseControls";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PlaylistsPanel } from "@/components/PlaylistsPanel";
import { SongsTable } from "@/components/SongsTable";
import { fetchJson, postEmpty, postJson } from "@/lib/api";
import type {
  Album,
  ApiStatus,
  Artist,
  AuthSession,
  AuthUser,
  Playlist,
  PlaylistSong,
  Song,
  SongPayload,
  Summary,
  User,
} from "@/types/music";

const SESSION_STORAGE_KEY = "music_streaming_session";

export default function Home() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [search, setSearch] = useState("");
  const [addingSongId, setAddingSongId] = useState<number | null>(null);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false);

  const token = session?.token ?? "";
  const currentUser = session?.user ?? null;

  const loadUsers = useCallback(async () => {
    const userData = await fetchJson<User[]>("/users");
    setUsers(userData);
    return userData;
  }, []);

  const loadPlaylists = useCallback(
    async (userList: User[], activeUser: AuthUser, activeToken: string) => {
      const visibleUsers = activeUser.is_admin
        ? userList
        : userList.filter((user) => user.user_id === activeUser.user_id);
      const userPlaylists = await Promise.all(
        visibleUsers.map((user) =>
          fetchJson<Playlist[]>(`/users/${user.user_id}/playlists`, {
            token: activeToken,
          }),
        ),
      );

      return userPlaylists.flat();
    },
    [],
  );

  const loadSelectedPlaylistSongs = useCallback(
    async (playlistId: string, activeToken: string) => {
      if (!playlistId) {
        setPlaylistSongs([]);
        return;
      }

      setLoadingPlaylistSongs(true);
      setPlaylistSongs(
        await fetchJson<PlaylistSong[]>(`/playlists/${playlistId}/songs`, {
          token: activeToken,
        }),
      );
      setLoadingPlaylistSongs(false);
    },
    [],
  );

  async function refreshSummary(activeToken = token) {
    setSummary(
      await fetchJson<Summary>("/dashboard/summary", { token: activeToken }),
    );
  }

  const loadOverviewData = useCallback(
    async (activeSession: AuthSession) => {
      setStatus("checking");
      const [root, summaryData, userData] = await Promise.all([
        fetchJson<{ message: string }>("/"),
        fetchJson<Summary>("/dashboard/summary", {
          token: activeSession.token,
        }),
        fetchJson<User[]>("/users"),
      ]);
      const playlistData = await loadPlaylists(
        userData,
        activeSession.user,
        activeSession.token,
      );

      setSummary(summaryData);
      setUsers(userData);
      setPlaylists(playlistData);
      setSelectedPlaylistId(
        playlistData.length === 1 ? String(playlistData[0].playlist_id) : "",
      );
      setStatus(root.message ? "connected" : "error");
      setError("");
    },
    [loadPlaylists],
  );

  const loadSongsData = useCallback(
    async (activeToken: string, activeSearch: string) => {
      if (!activeToken) {
        return;
      }

      const params = new URLSearchParams({ limit: "50" });

      if (activeSearch.trim()) {
        params.set("search", activeSearch.trim());
      }

      setLoadingSongs(true);
      setSongs(
        await fetchJson<Song[]>(`/songs?${params.toString()}`, {
          token: activeToken,
        }),
      );
      setError("");
      setLoadingSongs(false);
    },
    [],
  );

  const loadAdminLookups = useCallback(async (activeToken: string) => {
    const [artistData, albumData] = await Promise.all([
      fetchJson<Artist[]>("/artists", { token: activeToken }),
      fetchJson<Album[]>("/albums", { token: activeToken }),
    ]);
    setArtists(artistData);
    setAlbums(albumData);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        await loadUsers();
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);

        if (!storedSession) {
          setStatus("connected");
          return;
        }

        const parsedSession = JSON.parse(storedSession) as AuthSession;
        const user = await fetchJson<AuthUser>("/auth/me", {
          token: parsedSession.token,
        });
        const activeSession = { token: parsedSession.token, user };
        setSession(activeSession);
        await loadOverviewData(activeSession);
        await loadSongsData(activeSession.token, "");

        if (user.is_admin) {
          await loadAdminLookups(activeSession.token);
        }
      } catch (caughtError) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        setStatus("connected");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not restore session.",
        );
      }
    }

    restoreSession();
  }, [loadAdminLookups, loadOverviewData, loadSongsData, loadUsers]);

  useEffect(() => {
    async function loadSongs() {
      if (!session) {
        return;
      }

      try {
        await loadSongsData(session.token, search);
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
  }, [loadSongsData, search, session]);

  useEffect(() => {
    async function loadPlaylistSongs() {
      if (!session) {
        return;
      }

      try {
        await loadSelectedPlaylistSongs(selectedPlaylistId, session.token);
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
  }, [loadSelectedPlaylistSongs, selectedPlaylistId, session]);

  async function handleAuthenticated(nextSession: AuthSession) {
    setSession(nextSession);
    setError("");
    await loadOverviewData(nextSession);
    await loadSongsData(nextSession.token, search);

    if (nextSession.user.is_admin) {
      await loadAdminLookups(nextSession.token);
    }
  }

  async function handleSwitchAccount() {
    if (session) {
      await postEmpty("/auth/logout", { token: session.token }).catch(() => null);
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setSummary(null);
    setSongs([]);
    setPlaylists([]);
    setPlaylistSongs([]);
    setSelectedPlaylistId("");
    await loadUsers();
  }

  async function handleDatabaseChanged() {
    if (!session) {
      return;
    }

    try {
      setPlaylistSongs([]);
      await loadUsers();
      await loadOverviewData(session);
      await loadSongsData(session.token, search);
      await loadAdminLookups(session.token);
    } catch (caughtError) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
      setSummary(null);
      setSongs([]);
      setPlaylists([]);
      setPlaylistSongs([]);
      await loadUsers();
      throw caughtError;
    }
  }

  async function refreshPlaylists(nextSelectedPlaylistId = selectedPlaylistId) {
    if (!session) {
      return;
    }

    const userData = await loadUsers();
    const playlistData = await loadPlaylists(userData, session.user, session.token);
    const validSelectedPlaylistId = playlistData.some(
      (playlist) => String(playlist.playlist_id) === nextSelectedPlaylistId,
    )
      ? nextSelectedPlaylistId
      : "";

    setPlaylists(playlistData);
    setSelectedPlaylistId(validSelectedPlaylistId);

    if (validSelectedPlaylistId) {
      await loadSelectedPlaylistSongs(validSelectedPlaylistId, session.token);
    } else {
      setPlaylistSongs([]);
    }
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
    if (!selectedPlaylistId || !session) {
      setError("Select a playlist before adding songs.");
      return;
    }

    try {
      setAddingSongId(song.song_id);
      await postEmpty<{ message: string }>(
        `/playlists/${selectedPlaylistId}/songs/${song.song_id}`,
        { token: session.token },
      );
      await loadSelectedPlaylistSongs(selectedPlaylistId, session.token);
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

  async function handleCreateSong(song: SongPayload) {
    await postJson<Song, SongPayload>("/songs", song, { token });
    await refreshSummary();
    await loadSongsData(token, search);
  }

  async function handleUpdateSong(songId: number, song: SongPayload) {
    await postJson<Song, SongPayload>(`/songs/${songId}`, song, {
      method: "PUT",
      token,
    });
    await loadSongsData(token, search);
  }

  async function handleDeleteSong(song: Song) {
    await postEmpty(`/songs/${song.song_id}`, { method: "DELETE", token });
    await refreshSummary();
    await loadSongsData(token, search);

    if (selectedPlaylistId) {
      await loadSelectedPlaylistSongs(selectedPlaylistId, token);
    }
  }

  const playlistSongIds = new Set(playlistSongs.map((song) => song.song_id));

  if (!session || !currentUser) {
    return (
      <AccountPanel
        error={error}
        knownUsers={users}
        onAuthenticated={handleAuthenticated}
        onRefreshUsers={loadUsers}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          error={error}
          onSwitchAccount={handleSwitchAccount}
          status={status}
          user={currentUser}
        />
        <CountCards counts={summary?.counts} />

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <SongsTable
            addingSongId={addingSongId}
            albums={albums}
            artists={artists}
            isAdmin={currentUser.is_admin}
            playlistSongIds={playlistSongIds}
            loading={loadingSongs}
            onAddToPlaylist={handleAddToPlaylist}
            onCreateSong={handleCreateSong}
            onDeleteSong={handleDeleteSong}
            onSearchChange={setSearch}
            onUpdateSong={handleUpdateSong}
            search={search}
            selectedPlaylistId={selectedPlaylistId}
            songs={songs}
          />
          <div className="flex flex-col gap-6">
            <CreatePlaylistForm
              currentUser={currentUser}
              onCreated={handlePlaylistCreated}
              token={session.token}
              users={users}
            />
            <PlaylistsPanel
              loading={loadingPlaylistSongs}
              onSelectPlaylist={setSelectedPlaylistId}
              onRefreshPlaylists={refreshPlaylists}
              playlistSongs={playlistSongs}
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              token={session.token}
              users={users}
            />
          </div>
        </section>

        {currentUser.is_admin ? (
          <DatabaseControls
            onChanged={handleDatabaseChanged}
            token={session.token}
          />
        ) : null}
      </div>
    </main>
  );
}
