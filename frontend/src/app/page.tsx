"use client";

import { useEffect, useState } from "react";

import { CountCards } from "@/components/CountCards";
import { CreatePlaylistForm } from "@/components/CreatePlaylistForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SongsTable } from "@/components/SongsTable";
import { fetchJson } from "@/lib/api";
import type { ApiStatus, Song, Summary, User } from "@/types/music";

export default function Home() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);

  async function refreshSummary() {
    setSummary(await fetchJson<Summary>("/dashboard/summary"));
  }

  useEffect(() => {
    async function loadOverview() {
      try {
        setStatus("checking");
        const [root, summaryData, userData] = await Promise.all([
          fetchJson<{ message: string }>("/"),
          fetchJson<Summary>("/dashboard/summary"),
          fetchJson<User[]>("/users"),
        ]);

        setSummary(summaryData);
        setUsers(userData);
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
  }, [search]);

  function handlePlaylistCreated() {
    refreshSummary().catch((caughtError) => {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not refresh dashboard summary",
      );
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader error={error} status={status} />
        <CountCards counts={summary?.counts} />

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <SongsTable
            loading={loadingSongs}
            onSearchChange={setSearch}
            search={search}
            songs={songs}
          />
          <CreatePlaylistForm onCreated={handlePlaylistCreated} users={users} />
        </section>
      </div>
    </main>
  );
}
