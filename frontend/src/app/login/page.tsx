"use client";

import { useRouter } from "next/navigation";

export default function LoginLandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-700">
            Music Streaming Database
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in or create a new user to continue.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold">Welcome</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select an option below to access the music database.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <button
              onClick={() => router.push("/login/existing")}
              className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
            >
              Log In
            </button>

            <button
              onClick={() => router.push("/login/create")}
              className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Create New User
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}