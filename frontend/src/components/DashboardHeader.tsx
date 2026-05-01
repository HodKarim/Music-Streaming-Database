import { API_URL } from "@/lib/api";
import type { ApiStatus } from "@/types/music";

type DashboardHeaderProps = {
  error: string;
  status: ApiStatus;
};

export function DashboardHeader({ error, status }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-2xl font-semibold text-teal-700">
          Music Streaming Database
        </p>
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm sm:min-w-80">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-600">FastAPI</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "connected"
              ? "bg-emerald-100 text-emerald-800"
              : status === "checking"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
              }`}
          >
            {status}
          </span>
        </div>
        <p className="break-all font-mono text-xs text-slate-500">{API_URL}</p>
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
      </div>
    </header>
  );
}
