"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type User = {
  user_id: number;
  name: string;
  email: string;
  is_admin: boolean;
};

export default function ExistingUserLoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => {
        console.error(err);
        setError("Could not load users.");
      });
  }, []);

  function loginAsUser(user: User) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-700">
            Music Streaming Database
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Select a user from the database.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold">Log In</h2>

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex max-h-[420px] flex-col gap-3 overflow-y-auto">
            {users.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No users found.
              </p>
            ) : (
              users.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => loginAsUser(user)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </div>
    </main>
  );
}