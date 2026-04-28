import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { lt } from "drizzle-orm";
import { checkCronAuth } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  const unauthorized = checkCronAuth(request);
  if (unauthorized) return unauthorized;

  const now = new Date().toISOString();

  const result = db
    .delete(accounts)
    .where(lt(accounts.ttlDeadline, now))
    .run();

  return NextResponse.json({
    deleted: result.changes,
    timestamp: now,
  });
}
