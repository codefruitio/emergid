import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-red-600 text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">emergID</h1>
          <p className="text-xl text-red-100 mb-8 max-w-xl mx-auto">
            Critical medical information for first responders, accessible with a
            single NFC tap. No app required. No account information stored.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/setup"
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-red-50 transition"
            >
              Create Your emergID
            </Link>
            <Link
              href="/admin"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Access Your Account
            </Link>
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href="https://testflight.apple.com/join/djYRbzYH"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition hover:opacity-80"
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
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Set Up",
              desc: "Generate a random account number — no email, no name, no personal info required.",
            },
            {
              step: "2",
              title: "Write to Tag",
              desc: "Enter your medical info and write the generated URL to any NFC tag.",
            },
            {
              step: "3",
              title: "Tap in Emergency",
              desc: "A first responder taps the tag and instantly sees your medical info in their browser.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 text-xl font-bold flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Privacy by Design
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
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
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            emergID is open source and fully self-hostable. Don&apos;t trust
            a third party with your medical data — run your own instance.{" "}
            <a
              href="https://github.com/codefruitio/emergid"
              className="text-red-600 hover:text-red-700 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-400">
        emergID — Emergency Medical Identification
      </div>
    </div>
  );
}
