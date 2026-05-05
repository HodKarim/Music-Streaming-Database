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
  AuthUser,
  Playlist,
  PlaylistSong,
  Song,
  SongApiPayload,
  SongPayload,
  Summary,
  User,
} from "@/types/music";

const CURRENT_USER_STORAGE_KEY = "music_streaming_user";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

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

  const loadUsers = useCallback(async () => {
    const userData = await fetchJson<User[]>("/users");
    setUsers(userData);
    return userData;
  }, []);

  const loadPlaylists = useCallback(
    async (userList: User[], activeUser: AuthUser) => {
      const visibleUsers = activeUser.is_admin
        ? userList
        : userList.filter((user) => user.user_id === activeUser.user_id);

      const userPlaylists = await Promise.all(
        visibleUsers.map((user) =>
          fetchJson<Playlist[]>(`/users/${user.user_id}/playlists`, {
            userId: activeUser.user_id,
          }),
        ),
      );

      return userPlaylists.flat();
    },
    [],
  );

  const loadSelectedPlaylistSongs = useCallback(
    async (playlistId: string, activeUser: AuthUser) => {
      if (!playlistId) {
        setPlaylistSongs([]);
        return;
      }

      setLoadingPlaylistSongs(true);
      setPlaylistSongs(
        await fetchJson<PlaylistSong[]>(`/playlists/${playlistId}/songs`, {
          userId: activeUser.user_id,
        }),
      );
      setLoadingPlaylistSongs(false);
    },
    [],
  );

  async function refreshSummary(activeUser = currentUser) {
    if (!activeUser) {
      return;
    }

    setSummary(
      await fetchJson<Summary>("/dashboard/summary", {
        userId: activeUser.user_id,
      }),
    );
  }

  const loadOverviewData = useCallback(
    async (activeUser: AuthUser) => {
      setStatus("checking");

      const [root, summaryData, userData] = await Promise.all([
        fetchJson<{ message: string }>("/"),
        fetchJson<Summary>("/dashboard/summary", {
          userId: activeUser.user_id,
        }),
        fetchJson<User[]>("/users"),
      ]);

      const playlistData = await loadPlaylists(userData, activeUser);

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
    async (activeUser: AuthUser, activeSearch: string) => {
      if (!activeUser) {
        return;
      }

      const params = new URLSearchParams({ limit: "50" });

      if (activeSearch.trim()) {
        params.set("search", activeSearch.trim());
      }

      setLoadingSongs(true);
      setSongs(
        await fetchJson<Song[]>(`/songs?${params.toString()}`, {
          userId: activeUser.user_id,
        }),
      );
      setError("");
      setLoadingSongs(false);
    },
    [],
  );

  useEffect(() => {
    async function restoreUser() {
      try {
        await loadUsers();

        const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);

        if (!storedUser) {
          setStatus("connected");
          return;
        }

        const parsedUser = JSON.parse(storedUser) as AuthUser;
        const user = await fetchJson<AuthUser>("/auth/me", {
          userId: parsedUser.user_id,
        });

        setCurrentUser(user);
        await loadOverviewData(user);
        await loadSongsData(user, "");
      } catch (caughtError) {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        setCurrentUser(null);
        setStatus("connected");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not restore user.",
        );
      }
    }

    restoreUser();
  }, [loadOverviewData, loadSongsData, loadUsers]);

  useEffect(() => {
    async function loadSongs() {
      if (!currentUser) {
        return;
      }

      try {
        await loadSongsData(currentUser, search);
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
  }, [currentUser, loadSongsData, search]);

  useEffect(() => {
    async function loadPlaylistSongs() {
      if (!currentUser) {
        return;
      }

      try {
        await loadSelectedPlaylistSongs(selectedPlaylistId, currentUser);
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
  }, [currentUser, loadSelectedPlaylistSongs, selectedPlaylistId]);

  async function handleAuthenticated(nextUser: AuthUser) {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(nextUser));
    setCurrentUser(nextUser);
    setError("");
    await loadOverviewData(nextUser);
    await loadSongsData(nextUser, search);
  }

  async function handleSwitchAccount() {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setCurrentUser(null);
    setSummary(null);
    setSongs([]);
    setPlaylists([]);
    setPlaylistSongs([]);
    setSelectedPlaylistId("");
    await loadUsers();
  }

  async function handleDatabaseChanged() {
    if (!currentUser) {
      return;
    }

    try {
      setPlaylistSongs([]);
      await loadUsers();
      await loadOverviewData(currentUser);
      await loadSongsData(currentUser, search);
    } catch (caughtError) {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      setCurrentUser(null);
      setSummary(null);
      setSongs([]);
      setPlaylists([]);
      setPlaylistSongs([]);
      await loadUsers();
      throw caughtError;
    }
  }

  async function refreshPlaylists(nextSelectedPlaylistId = selectedPlaylistId) {
    if (!currentUser) {
      return;
    }

    const userData = await loadUsers();
    const playlistData = await loadPlaylists(userData, currentUser);
    const validSelectedPlaylistId = playlistData.some(
      (playlist) => String(playlist.playlist_id) === nextSelectedPlaylistId,
    )
      ? nextSelectedPlaylistId
      : "";

    setPlaylists(playlistData);
    setSelectedPlaylistId(validSelectedPlaylistId);

    if (validSelectedPlaylistId) {
      await loadSelectedPlaylistSongs(validSelectedPlaylistId, currentUser);
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
    if (!selectedPlaylistId || !currentUser) {
      setError("Select a playlist before adding songs.");
      return;
    }

    try {
      setAddingSongId(song.song_id);
      await postEmpty<{ message: string }>(
        `/playlists/${selectedPlaylistId}/songs/${song.song_id}`,
        { userId: currentUser.user_id },
      );
      await loadSelectedPlaylistSongs(selectedPlaylistId, currentUser);
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
    if (!currentUser) {
      return;
    }

    await postJson<Song, SongApiPayload>(
      "/songs",
      await resolveSongPayload(song),
      { userId: currentUser.user_id },
    );
    await refreshSummary();
    await loadSongsData(currentUser, search);
  }

  async function handleUpdateSong(songId: number, song: SongPayload) {
    if (!currentUser) {
      return;
    }

    await postJson<Song, SongApiPayload>(
      `/songs/${songId}`,
      await resolveSongPayload(song),
      {
        method: "PUT",
        userId: currentUser.user_id,
      },
    );
    await loadSongsData(currentUser, search);
  }

  async function resolveSongPayload(song: SongPayload): Promise<SongApiPayload> {
    if (!currentUser) {
      throw new Error("Select a user before changing songs.");
    }

    const artistName = song.artist_name.trim();
    const genre = song.genre.trim();
    const albumTitle = `${genre} Collection`;

    const matchingArtists = await fetchJson<Artist[]>("/artists", {
      userId: currentUser.user_id,
    });
    const existingArtist = matchingArtists.find(
      (artist) => artist.name.toLowerCase() === artistName.toLowerCase(),
    );
    const artist =
      existingArtist ??
      (await postJson<Artist, { name: string }>(
        "/artists",
        { name: artistName },
        { userId: currentUser.user_id },
      ));

    const matchingAlbums = await fetchJson<Album[]>("/albums", {
      userId: currentUser.user_id,
    });
    const existingAlbum = matchingAlbums.find(
      (album) =>
        album.artist_id === artist.artist_id &&
        album.title.toLowerCase() === albumTitle.toLowerCase(),
    );
    const album =
      existingAlbum ??
      (await postJson<
        Album,
        { title: string; artist_id: number }
      >(
        "/albums",
        {
          artist_id: artist.artist_id,
          title: albumTitle,
        },
        { userId: currentUser.user_id },
      ));

    return {
      album_id: album.album_id,
      artist_id: artist.artist_id,
      duration: song.duration,
      genre,
      title: song.title.trim(),
    };
  }

  async function handleDeleteSong(song: Song) {
    if (!currentUser) {
      return;
    }

    await postEmpty(`/songs/${song.song_id}`, {
      method: "DELETE",
      userId: currentUser.user_id,
    });
    await refreshSummary();
    await loadSongsData(currentUser, search);

    if (selectedPlaylistId) {
      await loadSelectedPlaylistSongs(selectedPlaylistId, currentUser);
    }
  }

  const playlistSongIds = new Set(playlistSongs.map((song) => song.song_id));

  if (!currentUser) {
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
            />

            <PlaylistsPanel
              loading={loadingPlaylistSongs}
              onSelectPlaylist={setSelectedPlaylistId}
              onRefreshPlaylists={refreshPlaylists}
              playlistSongs={playlistSongs}
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              userId={currentUser.user_id}
              users={users}
            />
          </div>
        </section>

        {currentUser.is_admin ? (
          <DatabaseControls
            onChanged={handleDatabaseChanged}
            userId={currentUser.user_id}
          />
        ) : null}
      </div>
    </main>
  );
}
