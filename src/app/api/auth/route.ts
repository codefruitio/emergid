import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { hash, decryptDEK } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { newTtlDeadline } from "@/lib/ttl";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { accountNumber } = body;

  if (!accountNumber) {
    return NextResponse.json({ error: "Account number required" }, { status: 400 });
  }

  const accountHash = hash(accountNumber);
  const account = db
    .select({
      id: accounts.id,
      keySalt: accounts.keySalt,
      encryptedDekAccount: accounts.encryptedDekAccount,
    })
    .from(accounts)
    .where(eq(accounts.accountHash, accountHash))
    .get();

  if (!account) {
    return NextResponse.json({ error: "Invalid account number" }, { status: 401 });
  }

  // Decrypt DEK using account number
  const dek = decryptDEK(account.encryptedDekAccount, accountNumber, account.keySalt);

  // Reset TTL on admin login
  db.update(accounts)
    .set({ ttlDeadline: newTtlDeadline() })
    .where(eq(accounts.id, account.id))
    .run();

  // Store DEK in session so subsequent admin requests can decrypt data
  await createSession(account.id, dek);

  return NextResponse.json({ success: true });
}
