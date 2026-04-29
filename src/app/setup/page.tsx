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

    // Auto-login so profile save works
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up Your emergID
        </h1>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {["Account", "Medical Info", "NFC Tag"].map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1 rounded-full ${
                  i <=
                  (step === "generate" ? 0 : step === "profile" ? 1 : 2)
                    ? "bg-red-600"
                    : "bg-gray-200"
                }`}
              />
              <span className="text-xs text-gray-500 mt-1 block">{label}</span>
            </div>
          ))}
        </div>

        {step === "generate" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                How It Works
              </h2>
              <ol className="space-y-3 text-gray-600">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-medium flex items-center justify-center">
                    1
                  </span>
                  <span>
                    We generate a random account number — no email or personal
                    info required
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-medium flex items-center justify-center">
                    2
                  </span>
                  <span>You enter your medical information</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-sm font-medium flex items-center justify-center">
                    3
                  </span>
                  <span>
                    You write a URL to an NFC tag — any first responder can tap
                    to view your info
                  </span>
                </li>
              </ol>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate My Account"}
            </button>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-6">
            {/* Account number warning */}
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-5">
              <h2 className="text-lg font-bold text-amber-800 mb-2">
                Save Your Account Number
              </h2>
              <p className="text-amber-700 text-sm mb-3">
                This is your only way to access and manage your medical record.
                It will <strong>never be shown again</strong>. There is no
                recovery option — treat it like a password.
              </p>
              <div className="bg-white rounded-md border border-amber-300 p-3 flex items-center justify-between">
                <code className="text-xl font-mono font-bold text-gray-900">
                  {accountNumber}
                </code>
                <button
                  onClick={() => copyToClipboard(accountNumber, "account")}
                  className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                >
                  {copied === "account" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
              <h2 className="text-lg font-bold text-green-800 mb-2">
                Your emergID Is Ready
              </h2>
              <p className="text-green-700 text-sm">
                Write the URL below to your NFC tag using any NFC writing app
                (e.g. NFC Tools). Label the tag visibly:{" "}
                <strong>&ldquo;TAP FOR MEDICAL INFO&rdquo;</strong>
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Your Token URL
              </h3>
              <div className="bg-gray-50 rounded-md border border-gray-200 p-3 break-all">
                <code className="text-sm text-gray-900">{tokenUrl}</code>
              </div>
              <button
                onClick={() => copyToClipboard(tokenUrl, "url")}
                className="mt-3 w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                {copied === "url" ? "Copied!" : "Copy URL"}
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Important Reminders</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  <strong>Log in at least once every 365 days</strong> to keep
                  your record active. We cannot warn you before deletion.
                </li>
                <li>
                  Your name is <strong>not</strong> stored on our server — write
                  it on the physical tag label.
                </li>
                <li>
                  You can update your medical info at any time by logging in
                  with your account number.
                </li>
              </ul>
            </div>

            <a
              href="/account"
              className="block text-center text-red-600 font-medium hover:text-red-700"
            >
              Go to Account Portal
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
