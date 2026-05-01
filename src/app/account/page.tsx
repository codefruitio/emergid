"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountLoginPage() {
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountNumber: accountNumber.trim() }),
    });

    if (res.ok) {
      router.push("/account/dashboard");
    } else {
      setError("Invalid account number. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">emergID</h1>
          <p className="text-zinc-500 mt-1 text-sm">Account Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="accountNumber"
              className="block text-sm font-medium text-zinc-400 mb-1.5"
            >
              Account Number
            </label>
            <div className="relative">
              <input
                id="accountNumber"
                name="account-number"
                type={revealed ? "text" : "password"}
                autoComplete="current-password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0000000000000000"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 pr-10 text-center font-mono text-lg text-zinc-100 placeholder:text-zinc-600 focus:border-red-500/60 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={
                  revealed ? "Hide account number" : "Show account number"
                }
                aria-pressed={revealed}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {revealed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.584 10.587a2 2 0 002.828 2.83" />
                    <path d="M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.043 5.19M6.61 6.611C4.662 7.967 3.18 9.93 2.458 12c1.274 4.057 5.064 7 9.542 7 1.77 0 3.447-.46 4.89-1.272" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !accountNumber.trim()}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Don&apos;t have an account?{" "}
          <a
            href="/setup"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
