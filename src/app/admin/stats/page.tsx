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
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
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
    if (res.status === 401) {
      setStage("login");
      return;
    }
    if (!res.ok) {
      setStage("login");
      return;
    }
    const data = (await res.json()) as Stats;
    setStats(data);
    setStage("ok");
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
      setLoginError(
        "Owner login is not configured on this server (OWNER_PASSWORD is unset)."
      );
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (stage === "login") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">emergID</h1>
            <p className="text-gray-500 mt-1">Owner Dashboard</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
          >
            <div>
              <label
                htmlFor="owner-password"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              />
            </div>
            {loginError && (
              <p className="text-red-600 text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={submitting || password.length === 0}
              className="w-full bg-gray-900 text-white py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Owner Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Generated {new Date(stats.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadStats}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Accounts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={stats.accounts.total} />
          <StatCard
            label="Push enabled"
            value={stats.accounts.withPushEnabled}
            hint={
              stats.accounts.total > 0
                ? `${Math.round(
                    (stats.accounts.withPushEnabled / stats.accounts.total) *
                      100
                  )}% of total`
                : undefined
            }
          />
          <StatCard label="Active 24h" value={stats.accounts.active.last24h} />
          <StatCard label="Active 7d" value={stats.accounts.active.last7d} />
          <StatCard label="Active 30d" value={stats.accounts.active.last30d} />
          <StatCard
            label="Expiring ≤30d"
            value={stats.accounts.expiring.within30d}
          />
          <StatCard
            label="Expiring ≤90d"
            value={stats.accounts.expiring.within90d}
          />
          <StatCard
            label="Past deadline"
            value={stats.accounts.expiring.pastDeadline}
            hint="awaiting cleanup"
          />
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Access events
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={stats.access.total} />
          <StatCard label="Last 24h" value={stats.access.last24h} />
          <StatCard label="Last 7d" value={stats.access.last7d} />
          <StatCard label="Last 30d" value={stats.access.last30d} />
          <StatCard
            label="Notifications sent"
            value={stats.access.notifications.sent}
          />
          <StatCard
            label="Cooldown skipped"
            value={stats.access.notifications.cooldown}
          />
          <StatCard
            label="No push token"
            value={stats.access.notifications.noToken}
          />
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Recent events
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {stats.recentEvents.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">No events yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2">When</th>
                  <th className="text-left px-4 py-2">Account</th>
                  <th className="text-left px-4 py-2">Event</th>
                  <th className="text-left px-4 py-2">Notification</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEvents.map((e, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 text-gray-900"
                  >
                    <td className="px-4 py-2">
                      {new Date(e.accessedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-gray-500">#{e.accountId}</td>
                    <td className="px-4 py-2">{e.eventType}</td>
                    <td className="px-4 py-2 text-gray-500">
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
