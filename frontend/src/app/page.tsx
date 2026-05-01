"use client";

import { useEffect, useMemo, useState } from "react";

import { CountCards } from "@/components/CountCards";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OverviewPanels } from "@/components/OverviewPanels";
import { SongsTable } from "@/components/SongsTable";
import { fetchJson } from "@/lib/api";
import type { Album, ApiStatus, Artist, Song, Summary } from "@/types/music";

export default function Home() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    async function loadOverview() {
      try {
        setStatus("checking");
        const [root, summaryData, artistData, albumData] = await Promise.all([
          fetchJson<{ message: string }>("/"),
          fetchJson<Summary>("/dashboard/summary"),
          fetchJson<Artist[]>("/artists"),
          fetchJson<Album[]>("/albums"),
        ]);

        setSummary(summaryData);
        setArtists(artistData.slice(0, 8));
        setAlbums(albumData.slice(0, 8));
        setStatus(root.message ? "connected" : "error");
        setError("");
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
  }, []);

  useEffect(() => {
    async function loadSongs() {
      const params = new URLSearchParams({ limit: "50" });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (genre) {
        params.set("genre", genre);
      }

      try {
        setLoadingSongs(true);
        setSongs(await fetchJson<Song[]>(`/songs?${params.toString()}`));
        setError("");
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
  }, [genre, search]);

  const genres = useMemo(() => {
    return summary?.top_genres.map((item) => item.genre) ?? [];
  }, [summary]);

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader error={error} status={status} />
        <CountCards counts={summary?.counts} />

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <SongsTable
            genre={genre}
            genres={genres}
            loading={loadingSongs}
            onGenreChange={setGenre}
            onSearchChange={setSearch}
            search={search}
            songs={songs}
          />
          <OverviewPanels albums={albums} artists={artists} summary={summary} />
        </section>
      </div>
    </main>
  );
}
