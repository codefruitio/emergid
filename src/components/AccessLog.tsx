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
      <p className="text-gray-400 text-sm">
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
            className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-2"
          >
            <div className="flex flex-col">
              <span
                className={`text-sm ${
                  entry.eventType === "token_rerolled"
                    ? "text-amber-600 font-medium"
                    : "text-gray-600"
                }`}
              >
                {eventLabels[entry.eventType] || entry.eventType}
              </span>
              {notificationLabel && (
                <span className="text-xs text-gray-400 mt-0.5">
                  {notificationLabel}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-900 font-medium">
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
