import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { apnsToken } = body;

  // APNs device tokens are 32 bytes encoded as 64 hex chars
  if (typeof apnsToken !== "string" || !/^[0-9a-f]{64}$/i.test(apnsToken)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  db.update(accounts)
    .set({ apnsToken })
    .where(eq(accounts.id, session.accountId))
    .run();

  return NextResponse.json({ success: true });
}
