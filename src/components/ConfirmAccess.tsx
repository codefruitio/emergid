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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-5 py-4 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-red-600"
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
          <span className="text-xs font-bold tracking-widest uppercase text-gray-900">
            emergID
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8 max-w-lg mx-auto w-full">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          First Responder Access
        </h1>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-8">
          Only proceed if you are a first responder in an active medical
          emergency. This access will be logged.
        </p>

        <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-xl p-4 mb-8">
          <p className="text-amber-900 text-sm leading-relaxed">
            By confirming, you acknowledge you are accessing this medical record
            for emergency purposes only. The patient will be notified.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <div className="mt-auto">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-5 rounded-2xl font-bold text-xl shadow-lg shadow-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Confirm — Medical Emergency"}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Patient will be notified of this access
          </p>
        </div>
      </div>
    </div>
  );
}
