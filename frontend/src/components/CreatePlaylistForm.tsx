"use client";

import { useState } from "react";

import { postJson } from "@/lib/api";
import type { Playlist, User } from "@/types/music";

type CreatePlaylistFormProps = {
  currentUser: User;
  onCreated: (playlist: Playlist) => void;
};

export function CreatePlaylistForm({
  currentUser,
  onCreated,
}: CreatePlaylistFormProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setStatus("Enter a playlist name.");
      return;
    }

    try {
      setIsSaving(true);
      const playlist = await postJson<Playlist, { name: string; user_id: number }>(
        "/playlists",
        {
          name: name.trim(),
          user_id: currentUser.user_id,
        },
        { userId: currentUser.user_id },
      );

      setName("");
      setStatus(`Created "${playlist.name}".`);
      onCreated(playlist);
    } catch (caughtError) {
      setStatus(
        caughtError instanceof Error
          ? `Could not create playlist: ${caughtError.message}`
          : "Could not create playlist.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Create Playlist</h2>
      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <input
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
          onChange={(event) => setName(event.target.value)}
          placeholder="Playlist name"
          type="text"
          value={name}
        />

        <button
          className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Creating..." : "Create playlist"}
        </button>

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
      </form>
    </section>
  );
}
