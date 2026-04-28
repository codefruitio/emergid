import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { daysUntilExpiry, sendExpiryWarning } from "@/lib/expiry-warning";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = db
    .select({
      apnsToken: accounts.apnsToken,
      ttlDeadline: accounts.ttlDeadline,
    })
    .from(accounts)
    .where(eq(accounts.id, session.accountId))
    .get();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!account.apnsToken) {
    return NextResponse.json(
      {
        error:
          "No device registered for push notifications. Open the iOS app to register.",
      },
      { status: 400 }
    );
  }

  const days = daysUntilExpiry(account.ttlDeadline);
  const result = await sendExpiryWarning(account.apnsToken, days);

  if (!result.success) {
    if (result.staleToken) {
      db.update(accounts)
        .set({ apnsToken: null })
        .where(eq(accounts.id, session.accountId))
        .run();
      return NextResponse.json(
        {
          error:
            "Device token was rejected by Apple and has been cleared. Re-register from the iOS app.",
        },
        { status: 410 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send notification. Check server logs." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, daysUntilExpiry: days });
}
