import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { hash, decryptDEK } from "@/lib/crypto";
import { decryptProfile } from "@/lib/medical-crypto";
import { isExpired } from "@/lib/ttl";
import { recordTagAccess } from "@/lib/access";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const tokenHash = hash(token);

  const account = db
    .select({
      id: accounts.id,
      keySalt: accounts.keySalt,
      encryptedDekToken: accounts.encryptedDekToken,
      bloodType: accounts.bloodType,
      allergies: accounts.allergies,
      medications: accounts.medications,
      conditions: accounts.conditions,
      physicianName: accounts.physicianName,
      physicianPhone: accounts.physicianPhone,
      emergencyContactRelation: accounts.emergencyContactRelation,
      emergencyContactPhone: accounts.emergencyContactPhone,
      lastUpdated: accounts.lastUpdated,
      ttlDeadline: accounts.ttlDeadline,
      apnsToken: accounts.apnsToken,
    })
    .from(accounts)
    .where(eq(accounts.tokenHash, tokenHash))
    .get();

  if (!account) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  if (isExpired(account.ttlDeadline)) {
    db.delete(accounts).where(eq(accounts.id, account.id)).run();
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  recordTagAccess(account.id, account.apnsToken);

  // Decrypt DEK using the token from the URL, then decrypt medical data
  const dek = decryptDEK(account.encryptedDekToken, token, account.keySalt);
  const decrypted = decryptProfile(
    {
      bloodType: account.bloodType,
      allergies: account.allergies,
      medications: account.medications,
      conditions: account.conditions,
      physicianName: account.physicianName,
      physicianPhone: account.physicianPhone,
      emergencyContactRelation: account.emergencyContactRelation,
      emergencyContactPhone: account.emergencyContactPhone,
    },
    dek
  );

  return NextResponse.json({
    ...decrypted,
    lastUpdated: account.lastUpdated,
  });
}
