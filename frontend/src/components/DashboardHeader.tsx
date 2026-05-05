import type { ApiStatus, AuthUser } from "@/types/music";

type DashboardHeaderProps = {
  error: string;
  onSwitchAccount: () => void;
  status: ApiStatus;
  user: AuthUser;
};

export function DashboardHeader({
  error,
  onSwitchAccount,
  status,
  user,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-2xl font-semibold text-teal-700">
          Music Streaming Database
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user.name} {user.is_admin ? "(admin)" : ""}
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm sm:min-w-80">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-600">Database Status</span>
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
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
        <button
          className="h-9 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={onSwitchAccount}
          type="button"
        >
          Switch account
        </button>
      </div>
    </header>
  );
}
