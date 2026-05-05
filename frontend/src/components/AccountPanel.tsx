"use client";

import { useMemo, useState } from "react";

import { postJson } from "@/lib/api";
import type {
  AuthSession,
  LoginPayload,
  SignupPayload,
  User,
} from "@/types/music";

type AccountPanelProps = {
  error: string;
  knownUsers: User[];
  onAuthenticated: (session: AuthSession) => void;
  onRefreshUsers: () => Promise<unknown>;
};

export function AccountPanel({
  error,
  knownUsers,
  onAuthenticated,
  onRefreshUsers,
}: AccountPanelProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [selectedUserId, setSelectedUserId] = useState("");
  const selectedUser = useMemo(
    () => knownUsers.find((user) => String(user.user_id) === selectedUserId),
    [knownUsers, selectedUserId],
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resetFields(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setStatus("");
    setPassword("");
    setName("");
    setEmail("");
    setIsAdmin(false);
    setSelectedUserId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const activeEmail = mode === "signin" ? selectedUser?.email ?? email : email;

    if (!activeEmail.trim() || !password.trim()) {
      setStatus("Enter an email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setStatus("Enter a name for the new account.");
      return;
    }

    try {
      setIsSaving(true);
      const session =
        mode === "signin"
          ? await postJson<AuthSession, LoginPayload>("/auth/login", {
              email: activeEmail.trim(),
              password,
            })
          : await postJson<AuthSession, SignupPayload>("/auth/signup", {
              email: activeEmail.trim(),
              is_admin: isAdmin,
              name: name.trim(),
              password,
            });

      localStorage.setItem("music_streaming_session", JSON.stringify(session));
      await onRefreshUsers();
      onAuthenticated(session);
    } catch (caughtError) {
      setStatus(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not authenticate.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-950 sm:px-6">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <p className="text-3xl font-semibold text-teal-700 sm:text-4xl">
            Music Streaming Database
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose an existing demo account or create a new one to start managing
            playlists and song data.
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
            <button
              className={`h-10 rounded-md text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              onClick={() => resetFields("signin")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`h-10 rounded-md text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              onClick={() => resetFields("signup")}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            {mode === "signin" ? (
              <>
                <select
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
                  onChange={(event) => {
                    setSelectedUserId(event.target.value);
                    const user = knownUsers.find(
                      (knownUser) =>
                        String(knownUser.user_id) === event.target.value,
                    );
                    setEmail(user?.email ?? "");
                  }}
                  value={selectedUserId}
                >
                  <option value="">Choose existing account</option>
                  {knownUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} {user.is_admin ? "(admin)" : ""}
                    </option>
                  ))}
                </select>
                <input
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                  value={email}
                />
              </>
            ) : (
              <>
                <input
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name"
                  type="text"
                  value={name}
                />
                <input
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  type="email"
                  value={email}
                />
                <label className="flex h-10 items-center justify-between rounded-md border border-slate-300 px-3 text-sm text-slate-700">
                  <span>Admin account</span>
                  <input
                    checked={isAdmin}
                    className="h-4 w-4 accent-teal-700"
                    onChange={(event) => setIsAdmin(event.target.checked)}
                    type="checkbox"
                  />
                </label>
              </>
            )}

            <input
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-teal-600 transition focus:ring-2"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              value={password}
            />

            <button
              className="h-10 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isSaving}
              type="submit"
            >
              {isSaving
                ? "Working..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>

            {status || error ? (
              <p className="text-sm text-rose-700">{status || error}</p>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}
