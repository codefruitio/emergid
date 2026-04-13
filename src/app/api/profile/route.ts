import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getSession, getSessionDEK } from "@/lib/session";
import { encryptProfile, decryptProfile } from "@/lib/medical-crypto";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  const dek = await getSessionDEK();
  if (!session || !dek) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = db
    .select({
      bloodType: accounts.bloodType,
      allergies: accounts.allergies,
      medications: accounts.medications,
      conditions: accounts.conditions,
      physicianName: accounts.physicianName,
      physicianPhone: accounts.physicianPhone,
      emergencyContactRelation: accounts.emergencyContactRelation,
      emergencyContactPhone: accounts.emergencyContactPhone,
      dnr: accounts.dnr,
      dnrNotes: accounts.dnrNotes,
      lastUpdated: accounts.lastUpdated,
      ttlDeadline: accounts.ttlDeadline,
    })
    .from(accounts)
    .where(eq(accounts.id, session.accountId))
    .get();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Decrypt medical fields
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
      dnr: account.dnr,
      dnrNotes: account.dnrNotes,
    },
    dek
  );

  return NextResponse.json({
    ...decrypted,
    lastUpdated: account.lastUpdated,
    ttlDeadline: account.ttlDeadline,
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  const dek = await getSessionDEK();
  if (!session || !dek) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Encrypt all medical fields before storage
  const encrypted = encryptProfile(
    {
      bloodType: body.bloodType || null,
      allergies: body.allergies ? JSON.stringify(body.allergies) : null,
      medications: body.medications ? JSON.stringify(body.medications) : null,
      conditions: body.conditions ? JSON.stringify(body.conditions) : null,
      physicianName: body.physicianName || null,
      physicianPhone: body.physicianPhone || null,
      emergencyContactRelation: body.emergencyContactRelation || null,
      emergencyContactPhone: body.emergencyContactPhone || null,
      dnr: body.dnr ?? false,
      dnrNotes: body.dnrNotes || null,
    },
    dek
  );

  db.update(accounts)
    .set({
      ...encrypted,
      lastUpdated: new Date().toISOString(),
    })
    .where(eq(accounts.id, session.accountId))
    .run();

  return NextResponse.json({ success: true });
}
