import { db } from "@/lib/db";
import { accounts, accessLog } from "@/lib/db/schema";
import { sendPushNotification } from "@/lib/apns";
import { and, eq, isNull, or, sql } from "drizzle-orm";

const NOTIFICATION_COOLDOWN = "-60 minutes";

// Records a tag access: atomically claims the notification cooldown slot so
// repeat accesses within the window don't re-notify, fires APNs if claimed,
// and writes an access_log row stamped with the notification outcome.
export function recordTagAccess(accountId: number, apnsToken: string | null): void {
  let notificationStatus: "sent" | "cooldown" | "no_token";

  if (!apnsToken) {
    notificationStatus = "no_token";
  } else {
    const claimed = db
      .update(accounts)
      .set({ lastNotificationSentAt: sql`(datetime('now'))` })
      .where(
        and(
          eq(accounts.id, accountId),
          or(
            isNull(accounts.lastNotificationSentAt),
            sql`${accounts.lastNotificationSentAt} < datetime('now', ${NOTIFICATION_COOLDOWN})`
          )
        )
      )
      .run();

    if (claimed.changes > 0) {
      notificationStatus = "sent";
      sendPushNotification(apnsToken, new Date().toISOString())
        .then((result) => {
          if (!result.success && result.staleToken) {
            db.update(accounts).set({ apnsToken: null }).where(eq(accounts.id, accountId)).run();
          }
        })
        .catch(() => {});
    } else {
      notificationStatus = "cooldown";
    }
  }

  db.insert(accessLog).values({ accountId, notificationStatus }).run();
}
