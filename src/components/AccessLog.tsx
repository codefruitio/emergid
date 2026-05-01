"use client";

interface AccessLogEntry {
  accessedAt: string;
  eventType: string;
  notificationStatus?: string | null;
}

const eventLabels: Record<string, string> = {
  tag_accessed: "Tag accessed",
  token_rerolled: "Token rerolled",
};

const notificationLabels: Record<string, string> = {
  sent: "Notification sent",
  cooldown: "Notification suppressed (cooldown)",
  no_token: "No device registered",
};

export default function AccessLog({ entries }: { entries: AccessLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-zinc-600 text-sm">
        No access log entries yet. Entries appear when someone taps your NFC tag.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const notificationLabel =
          entry.eventType === "tag_accessed" && entry.notificationStatus
            ? notificationLabels[entry.notificationStatus]
            : null;

        return (
          <div
            key={i}
            className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-2.5 border border-zinc-700/50"
          >
            <div className="flex flex-col">
              <span
                className={`text-sm ${
                  entry.eventType === "token_rerolled"
                    ? "text-amber-400 font-medium"
                    : "text-zinc-400"
                }`}
              >
                {eventLabels[entry.eventType] || entry.eventType}
              </span>
              {notificationLabel && (
                <span className="text-xs text-zinc-600 mt-0.5">
                  {notificationLabel}
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-300 font-medium tabular-nums">
              {new Date(entry.accessedAt).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
