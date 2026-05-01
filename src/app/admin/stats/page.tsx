"use client";

import { useEffect, useState, useCallback } from "react";

interface Stats {
  generatedAt: string;
  accounts: {
    total: number;
    withPushEnabled: number;
    active: { last24h: number; last7d: number; last30d: number };
    expiring: {
      within30d: number;
      within60d: number;
      within90d: number;
      pastDeadline: number;
    };
  };
  access: {
    total: number;
    last24h: number;
    last7d: number;
    last30d: number;
    notifications: { sent: number; cooldown: number; noToken: number };
  };
  recentEvents: {
    accountId: number;
    eventType: string;
    notificationStatus: string | null;
    accessedAt: string;
  }[];
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "red" | "amber";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent === "red"
          ? "bg-red-500/10 border-red-500/20"
          : accent === "amber"
          ? "bg-amber-500/10 border-amber-500/20"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-bold tabular-nums ${
          accent === "red"
            ? "text-red-400"
            : accent === "amber"
            ? "text-amber-400"
            : "text-zinc-100"
        }`}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-zinc-600 mt-1">{hint}</div>}
    </div>
  );
}

export default function OwnerStatsPage() {
  const [stage, setStage] = useState<"loading" | "login" | "ok">("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.status === 401) { setStage("login"); return; }
    if (!res.ok) { setStage("login"); return; }
    const data = (await res.json()) as Stats;
    setStats(data);
    setStage("ok");
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setSubmitting(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (res.ok) {
      setPassword("");
      await loadStats();
    } else if (res.status === 503) {
      setLoginError("Owner login is not configured on this server (OWNER_PASSWORD is unset).");
    } else {
      setLoginError("Invalid password.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setStats(null);
    setStage("login");
  };

  if (stage === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Loading…</p>
      </div>
    );
  }

  if (stage === "login") {
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
                  d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">emergID</h1>
            <p className="text-zinc-500 mt-1 text-sm">Owner Dashboard</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4"
          >
            <div>
              <label
                htmlFor="owner-password"
                className="block text-sm font-medium text-zinc-400 mb-1.5"
              >
                Owner Password
              </label>
              <input
                id="owner-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={submitting || password.length === 0}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 py-3 rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Owner Dashboard</h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Generated {new Date(stats.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadStats}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Accounts */}
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">
          Accounts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total" value={stats.accounts.total} />
          <StatCard
            label="Push enabled"
            value={stats.accounts.withPushEnabled}
            hint={
              stats.accounts.total > 0
                ? `${Math.round((stats.accounts.withPushEnabled / stats.accounts.total) * 100)}% of total`
                : undefined
            }
          />
          <StatCard label="Active 24h" value={stats.accounts.active.last24h} />
          <StatCard label="Active 7d" value={stats.accounts.active.last7d} />
          <StatCard label="Active 30d" value={stats.accounts.active.last30d} />
          <StatCard
            label="Expiring ≤30d"
            value={stats.accounts.expiring.within30d}
            accent={stats.accounts.expiring.within30d > 0 ? "amber" : undefined}
          />
          <StatCard
            label="Expiring ≤90d"
            value={stats.accounts.expiring.within90d}
          />
          <StatCard
            label="Past deadline"
            value={stats.accounts.expiring.pastDeadline}
            hint="awaiting cleanup"
            accent={stats.accounts.expiring.pastDeadline > 0 ? "red" : undefined}
          />
        </div>

        {/* Access events */}
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">
          Access Events
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total" value={stats.access.total} />
          <StatCard label="Last 24h" value={stats.access.last24h} />
          <StatCard label="Last 7d" value={stats.access.last7d} />
          <StatCard label="Last 30d" value={stats.access.last30d} />
          <StatCard label="Notifs sent" value={stats.access.notifications.sent} />
          <StatCard label="Cooldown skipped" value={stats.access.notifications.cooldown} />
          <StatCard label="No push token" value={stats.access.notifications.noToken} />
        </div>

        {/* Recent events */}
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">
          Recent Events
        </p>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {stats.recentEvents.length === 0 ? (
            <p className="text-sm text-zinc-600 p-5">No events yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800/60">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    When
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    Account
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    Event
                  </th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    Notification
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.map((e, i) => (
                  <tr key={i} className="border-t border-zinc-800">
                    <td className="px-4 py-3 text-zinc-300 tabular-nums">
                      {new Date(e.accessedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono">
                      #{e.accountId}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{e.eventType}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {e.notificationStatus ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
