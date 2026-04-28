import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = db
    .select({ apnsToken: accounts.apnsToken })
    .from(accounts)
    .where(eq(accounts.id, session.accountId))
    .get();

  return NextResponse.json({ registered: !!row?.apnsToken });
}
