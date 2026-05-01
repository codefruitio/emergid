"use client";

import { useState } from "react";
import ProfileForm, { ProfileData } from "@/components/ProfileForm";

type Step = "generate" | "profile" | "done";

export default function SetupPage() {
  const [step, setStep] = useState<Step>("generate");
  const [accountNumber, setAccountNumber] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"account" | "url" | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch("/api/account", { method: "POST" });
    const data = await res.json();
    setAccountNumber(data.accountNumber);
    setTokenUrl(data.tokenUrl);

    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountNumber: data.accountNumber }),
    });

    setLoading(false);
    setStep("profile");
  };

  const handleProfileSave = async (data: ProfileData) => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStep("done");
  };

  const copyToClipboard = async (text: string, label: "account" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const stepIndex = step === "generate" ? 0 : step === "profile" ? 1 : 2;
  const stepLabels = ["Account", "Medical Info", "NFC Tag"];

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-6">
            Set Up Your emergID
          </h1>

          {/* Step indicator */}
          <div className="flex gap-1">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-0.5 rounded-full mb-2 transition-colors duration-300 ${
                    i <= stepIndex ? "bg-red-500" : "bg-zinc-800"
                  }`}
                />
                <span
                  className={`text-xs transition-colors ${
                    i <= stepIndex ? "text-zinc-400" : "text-zinc-700"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {step === "generate" && (
          <div className="space-y-5">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">
                How It Works
              </h2>
              <ol className="space-y-3">
                {[
                  "We generate a random account number — no email or personal info required",
                  "You enter your medical information",
                  "You write a URL to an NFC tag — any first responder can tap to view your info",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs font-mono font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate My Account"}
            </button>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-5">
            {/* Account number warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
              <h2 className="text-base font-bold text-amber-400 mb-2">
                Save Your Account Number
              </h2>
              <p className="text-amber-500/80 text-sm mb-4">
                This is your only way to access and manage your medical record.
                It will <strong className="text-amber-400">never be shown again</strong>. There is no
                recovery option — treat it like a password.
              </p>
              <div className="bg-zinc-900 rounded-lg border border-amber-500/20 p-3 flex items-center justify-between gap-3">
                <code className="text-xl font-mono font-bold text-zinc-100 tracking-wider">
                  {accountNumber}
                </code>
                <button
                  onClick={() => copyToClipboard(accountNumber, "account")}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap transition-colors"
                >
                  {copied === "account" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-base font-semibold text-zinc-100 mb-4">
                Your Medical Information
              </h2>
              <ProfileForm
                onSubmit={handleProfileSave}
                submitLabel="Save & Continue"
              />
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
              <h2 className="text-base font-bold text-emerald-400 mb-1">
                Your emergID Is Ready
              </h2>
              <p className="text-emerald-600 text-sm">
                Write the URL below to your NFC tag using any NFC writing app
                (e.g. NFC Tools). Label the tag visibly:{" "}
                <strong className="text-emerald-500">&ldquo;TAP FOR MEDICAL INFO&rdquo;</strong>
              </p>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Your Token URL
              </h3>
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-3 break-all">
                <code className="text-sm text-zinc-300 font-mono">
                  {tokenUrl}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(tokenUrl, "url")}
                className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {copied === "url" ? "Copied!" : "Copy URL"}
              </button>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3">
              <h3 className="font-semibold text-zinc-100 text-sm">
                Important Reminders
              </h3>
              <ul className="text-sm text-zinc-500 space-y-2">
                <li className="flex gap-2">
                  <span className="text-zinc-700 flex-shrink-0">—</span>
                  <span>
                    <strong className="text-zinc-400">Log in at least once every 365 days</strong> to keep
                    your record active. We cannot warn you before deletion.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-700 flex-shrink-0">—</span>
                  <span>
                    Your name is <strong className="text-zinc-400">not</strong> stored on our server — write
                    it on the physical tag label.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-zinc-700 flex-shrink-0">—</span>
                  <span>
                    You can update your medical info at any time by logging in
                    with your account number.
                  </span>
                </li>
              </ul>
            </div>

            <a
              href="/account"
              className="block text-center text-red-500 hover:text-red-400 font-medium text-sm transition-colors"
            >
              Go to Account Portal →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
