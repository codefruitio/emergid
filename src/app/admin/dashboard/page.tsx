"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileForm, { ProfileData } from "@/components/ProfileForm";
import AccessLog from "@/components/AccessLog";

interface ProfileResponse {
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  physicianName: string | null;
  physicianPhone: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  lastUpdated: string;
  ttlDeadline: string;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [logs, setLogs] = useState<
    { accessedAt: string; eventType: string; notificationStatus?: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  type Tab = "profile" | "log" | "token" | "danger";
  const [tab, setTab] = useState<Tab>("profile");
  const [clearingLogs, setClearingLogs] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tokenUrl, setTokenUrl] = useState<string | null>(null);
  const [rerolling, setRerolling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("emergid:dashboardTab");
    if (
      stored === "profile" ||
      stored === "log" ||
      stored === "token" ||
      stored === "danger"
    ) {
      setTab(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("emergid:dashboardTab", tab);
  }, [tab]);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => {
        if (r.status === 401) {
          router.push("/admin");
          return null;
        }
        return r.json();
      }),
      fetch("/api/access-log").then((r) => (r.ok ? r.json() : [])),
    ]).then(([profileData, logData]) => {
      if (profileData) setProfile(profileData);
      setLogs(logData);
      setLoading(false);
    });
  }, [router]);

  const handleProfileSave = async (data: ProfileData) => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      const updated = await fetch("/api/profile").then((r) => r.json());
      setProfile(updated);
    }
  };

  const handleReroll = async () => {
    if (
      !confirm(
        "This will invalidate your current NFC tag URL. You will need to reprogram your tag with the new URL. Continue?"
      )
    )
      return;

    setRerolling(true);
    const res = await fetch("/api/token/reroll", { method: "POST" });
    const data = await res.json();
    setTokenUrl(data.tokenUrl);
    setRerolling(false);
  };

  const handleClearLogs = async () => {
    if (
      !confirm(
        "This will permanently delete all access log entries for your account. Continue?"
      )
    )
      return;

    setClearingLogs(true);
    const res = await fetch("/api/access-log", { method: "DELETE" });
    if (res.ok) setLogs([]);
    setClearingLogs(false);
  };

  const handleDestroy = async () => {
    if (
      !confirm(
        "This will permanently delete your account and all medical data. Your NFC tag will stop working. This cannot be undone. Are you sure?"
      )
    )
      return;

    const res = await fetch("/api/account/destroy", { method: "POST" });
    if (res.ok) {
      router.push("/");
    }
  };

  const copyUrl = async () => {
    if (tokenUrl) {
      await navigator.clipboard.writeText(tokenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!profile) return null;

  const ttlDate = new Date(profile.ttlDeadline);
  const daysUntilExpiry = Math.ceil(
    (ttlDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const initialData: Partial<ProfileData> = {
    bloodType: profile.bloodType || "",
    allergies: parseJsonArray(profile.allergies),
    medications: parseJsonArray(profile.medications),
    conditions: parseJsonArray(profile.conditions),
    physicianName: profile.physicianName || "",
    physicianPhone: profile.physicianPhone || "",
    emergencyContactRelation: profile.emergencyContactRelation || "",
    emergencyContactPhone: profile.emergencyContactPhone || "",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">emergID</h1>
            <p className="text-sm text-gray-500">Account Portal</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-500">Account expires in</div>
            <div className="font-semibold text-gray-900">
              {daysUntilExpiry} days
            </div>
          </div>
        </div>

        {/* TTL Notice */}
        {daysUntilExpiry < 90 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              Your record will be deleted in {daysUntilExpiry} days if you
              don&apos;t log in again. Logging in today has already reset your
              365-day timer.
            </p>
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-800 text-sm font-medium">
              Medical profile updated successfully.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {(
            [
              ["profile", "Medical Profile"],
              ["log", "Access Log"],
              ["token", "Token"],
              ["danger", "Account"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                tab === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {tab === "profile" && (
            <ProfileForm
              initialData={initialData}
              onSubmit={handleProfileSave}
              submitLabel="Update Medical Profile"
            />
          )}

          {tab === "log" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Access Log
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Each entry represents a tap on your NFC tag. Only timestamps are
                recorded — no location or device information.
              </p>
              <AccessLog entries={logs} />
              {logs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleClearLogs}
                    disabled={clearingLogs}
                    className="text-sm text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
                  >
                    {clearingLogs ? "Clearing..." : "Clear access log"}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "token" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Reroll Token
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Rerolling generates a new URL and immediately invalidates the
                  old one. You will need to reprogram your NFC tag with the new
                  URL. Recommended if you suspect your URL has been copied or
                  shared outside of an authorized context.
                </p>
                <button
                  onClick={handleReroll}
                  disabled={rerolling}
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {rerolling ? "Generating..." : "Reroll Token"}
                </button>
              </div>

              {tokenUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <h3 className="font-semibold text-green-800 mb-2">
                    New Token URL Generated
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    Write this URL to your NFC tag. The old URL no longer works.
                  </p>
                  <div className="bg-white rounded-md border border-green-200 p-3 break-all">
                    <code className="text-sm text-gray-900">{tokenUrl}</code>
                  </div>
                  <button
                    onClick={copyUrl}
                    className="mt-3 w-full bg-green-100 text-green-800 py-2 rounded-lg font-medium hover:bg-green-200"
                  >
                    {copied ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "danger" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Destroy Account
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete your account, all medical data, and
                  invalidate your NFC tag URL. This action is immediate and
                  cannot be undone.
                </p>
                <button
                  onClick={handleDestroy}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
                >
                  Destroy Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
