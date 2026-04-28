import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { and, eq, gt, isNotNull, isNull, lt, sql } from "drizzle-orm";
import {
  EXPIRY_WARNING_THRESHOLD_DAYS,
  daysUntilExpiry,
  sendExpiryWarning,
} from "@/lib/expiry-warning";
import { checkCronAuth } from "@/lib/cron-auth";

// Daily cron: notify accounts whose ttlDeadline is within
// EXPIRY_WARNING_THRESHOLD_DAYS days, that have a registered apnsToken,
// and that haven't already been warned (since their last login).
export async function GET(request: NextRequest) {
  const unauthorized = checkCronAuth(request);
  if (unauthorized) return unauthorized;

  const now = new Date().toISOString();
  // SQLite datetime arithmetic — `+N days` from now.
  const threshold = sql<string>`datetime('now', ${`+${EXPIRY_WARNING_THRESHOLD_DAYS} days`})`;

  const candidates = db
    .select({
      id: accounts.id,
      apnsToken: accounts.apnsToken,
      ttlDeadline: accounts.ttlDeadline,
    })
    .from(accounts)
    .where(
      and(
        isNotNull(accounts.apnsToken),
        isNull(accounts.expiryWarningSentAt),
        gt(accounts.ttlDeadline, now), // not already expired
        lt(accounts.ttlDeadline, threshold) // within the warning window
      )
    )
    .all();

  let notified = 0;
  let failed = 0;

  for (const acct of candidates) {
    if (!acct.apnsToken) continue;
    const days = daysUntilExpiry(acct.ttlDeadline);
    const result = await sendExpiryWarning(acct.apnsToken, days);

    if (result.success) {
      db.update(accounts)
        .set({ expiryWarningSentAt: sql`(datetime('now'))` })
        .where(eq(accounts.id, acct.id))
        .run();
      notified++;
    } else if (result.staleToken) {
      // 410 from APNs — drop the dead token so we stop trying.
      db.update(accounts)
        .set({ apnsToken: null })
        .where(eq(accounts.id, acct.id))
        .run();
      failed++;
    } else {
      // Transient failure — leave expiryWarningSentAt null so the next
      // cron run retries.
      failed++;
    }
  }

  return NextResponse.json({
    checked: candidates.length,
    notified,
    failed,
    timestamp: now,
  });
}
