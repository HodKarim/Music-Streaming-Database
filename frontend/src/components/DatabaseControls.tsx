"use client";

import { useState } from "react";

import { postEmpty } from "@/lib/api";

type DatabaseControlsProps = {
  onChanged: () => Promise<void>;
  token: string;
};

export function DatabaseControls({ onChanged, token }: DatabaseControlsProps) {
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  async function runAction(action: "clear" | "clear-songs" | "seed") {
    const statusByAction = {
      clear: ["Clearing database...", "Database cleared."],
      "clear-songs": ["Clearing songs...", "Songs cleared."],
      seed: ["Filling tables...", "Tables filled."],
    } as const;

    try {
      setIsWorking(true);
      setStatus(statusByAction[action][0]);
      await postEmpty(`/dashboard/${action}`, { token });
      await onChanged();
      setStatus(statusByAction[action][1]);
    } catch (caughtError) {
      setStatus(
        caughtError instanceof Error
          ? caughtError.message
          : "Database action failed.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Database</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          className="h-10 rounded-md bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isWorking}
          onClick={() => runAction("clear-songs")}
          type="button"
        >
          Clear songs
        </button>
        <button
          className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isWorking}
          onClick={() => runAction("seed")}
          type="button"
        >
          Fill tables
        </button>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <button
          className="h-10 w-full rounded-md border border-rose-300 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          disabled={isWorking}
          onClick={() => {
            if (confirm("Clear the entire database, including users?")) {
              runAction("clear");
            }
          }}
          type="button"
        >
          Clear database
        </button>
      </div>
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </section>
  );
}
