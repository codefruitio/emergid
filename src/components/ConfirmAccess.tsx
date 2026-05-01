"use client";

import { useState } from "react";
import MedicalCard, { MedicalData } from "@/components/MedicalCard";

export default function ConfirmAccess({ token }: { token: string }) {
  const [data, setData] = useState<MedicalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (data) {
    return <MedicalCard data={data} />;
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/e/${token}/confirm`, { method: "POST" });
      if (!res.ok) {
        setError(
          res.status === 404
            ? "Record not found or expired."
            : "Unable to access record. Try again."
        );
        setLoading(false);
        return;
      }
      const body = (await res.json()) as MedicalData;
      setData(body);
    } catch {
      setError("Unable to access record. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-red-600 text-white px-6 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <svg
              className="w-7 h-7 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Emergency Medical Information
              </h1>
              <p className="text-red-200 text-xs mt-0.5 font-medium tracking-wider uppercase">
                emergID
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h2 className="text-amber-900 font-semibold mb-1.5 text-sm">
            First Responder Access
          </h2>
          <p className="text-amber-800 text-sm leading-relaxed">
            By continuing, you confirm you are a first responder accessing this
            record for a medical emergency. The patient will be notified that
            their emergency information was accessed.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Loading…" : "Confirm — Medical Emergency"}
        </button>
      </div>
    </div>
  );
}
