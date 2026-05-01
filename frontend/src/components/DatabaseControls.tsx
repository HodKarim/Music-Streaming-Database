"use client";

import { useState } from "react";

import { postEmpty } from "@/lib/api";

type DatabaseControlsProps = {
  onChanged: () => Promise<void>;
};

export function DatabaseControls({ onChanged }: DatabaseControlsProps) {
  const [status, setStatus] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  async function runAction(action: "clear" | "seed") {
    try {
      setIsWorking(true);
      setStatus(action === "clear" ? "Clearing database..." : "Filling tables...");
      await postEmpty(`/dashboard/${action}`);
      await onChanged();
      setStatus(action === "clear" ? "Database cleared." : "Tables filled.");
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
          onClick={() => runAction("clear")}
          type="button"
        >
          Clear database
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
      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </section>
  );
}
