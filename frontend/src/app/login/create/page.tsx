"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type User = {
  user_id: number;
  name: string;
  email: string;
  is_admin: boolean;
};

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

    async function createUser() {
    if (!name || !email) {
        setError("Please enter a name and email.");
        return;
    }

    try {
        const existingUsers: User[] = await fetch(`${API_URL}/users`).then((res) =>
        res.json(),
        );

        const existingUser = existingUsers.find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
        );

        if (existingUser) {
        setError("A user with this email already exists. Please log in instead.");
        return;
        }

        const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name,
            email,
            password: "demo-password",
            is_admin: false,
        }),
        });

        if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create user");
        }

        const newUser: User = await res.json();
        localStorage.setItem("currentUser", JSON.stringify(newUser));
        router.push("/");
    } catch (err) {
        console.error(err);
        setError("Could not create user. Try using a different email.");
    }
    }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-700">
            Music Streaming Database
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create a new demo user.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold">Create New User</h2>

          {error && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input
                type="text"
                placeholder="Demo User"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                placeholder="demo@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <button
              onClick={createUser}
              className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
            >
              Create User & Continue
            </button>

            <button
              onClick={() => router.push("/login")}
              className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}