import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0" />
        <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            NFC-Powered Emergency Medical ID
          </div>
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-zinc-50 mb-5">
            emerg<span className="text-red-500">ID</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Critical medical information for first responders, accessible with a
            single NFC tap. No app required. No account information stored.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/setup"
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Your emergID
            </Link>
            <Link
              href="/account"
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Access Your Account
            </Link>
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href="https://testflight.apple.com/join/djYRbzYH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition hover:opacity-70"
              aria-label="Download the emergID iOS app on the App Store"
            >
              <Image
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                width={160}
                height={53}
                priority
              />
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 text-center mb-12">
          How It Works
        </p>
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            {
              step: "01",
              title: "Set Up",
              desc: "Generate a random account number — no email, no name, no personal info required.",
            },
            {
              step: "02",
              title: "Write to Tag",
              desc: "Enter your medical info and write the generated URL to any NFC tag.",
            },
            {
              step: "03",
              title: "Tap in Emergency",
              desc: "A first responder taps the tag and instantly sees your medical info in their browser.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-4xl font-bold text-zinc-800 mb-4 font-mono tabular-nums">
                {item.step}
              </div>
              <h3 className="font-semibold text-zinc-100 mb-2">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6">
        <div className="border-t border-zinc-800/60" />
      </div>

      {/* Privacy */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 text-center mb-8">
          Privacy by Design
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "No Account Information",
              desc: "No email, no name, no phone number. Your identity is a random number only you know.",
            },
            {
              title: "Split Data Model",
              desc: "Your name lives on the physical tag only. The server stores medical data with no identifying information.",
            },
            {
              title: "Hashed Credentials",
              desc: "Account numbers and tokens are never stored in plaintext. Even a full database breach exposes nothing useful.",
            },
            {
              title: "Auto-Deletion",
              desc: "Records are automatically deleted after 365 days of inactivity. No orphaned data.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-zinc-900 rounded-xl border border-zinc-800 p-5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mb-3" />
              <h3 className="font-semibold text-zinc-100 mb-1">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-zinc-600 text-sm mt-8">
          emergID is open source and fully self-hostable.{" "}
          <a
            href="https://github.com/codefruitio/emergid"
            className="text-red-500 hover:text-red-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-zinc-700 border-t border-zinc-900">
        emergID
      </div>
    </div>
  );
}
