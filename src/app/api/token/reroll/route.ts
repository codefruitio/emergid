import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { generateToken, hash, encryptDEK } from "@/lib/crypto";
import { getSession, getSessionDEK } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await getSession();
  const dek = await getSessionDEK();
  if (!session || !dek) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the account's key salt
  const account = db
    .select({ keySalt: accounts.keySalt })
    .from(accounts)
    .where(eq(accounts.id, session.accountId))
    .get();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const token = generateToken();
  const tokenHash = hash(token);

  // Re-encrypt DEK with new token
  const encryptedDekToken = encryptDEK(dek, token, account.keySalt);

  db.update(accounts)
    .set({ tokenHash, encryptedDekToken })
    .where(eq(accounts.id, session.accountId))
    .run();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenUrl = `${baseUrl}/e/${token}`;

  return NextResponse.json({
    tokenUrl,
    message: "Token rerolled. Update your NFC tag with the new URL.",
  });
}
