import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessLog } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = db
    .select({
      accessedAt: accessLog.accessedAt,
      eventType: accessLog.eventType,
      notificationStatus: accessLog.notificationStatus,
    })
    .from(accessLog)
    .where(eq(accessLog.accountId, session.accountId))
    .orderBy(desc(accessLog.accessedAt))
    .limit(100)
    .all();

  return NextResponse.json(logs);
}
