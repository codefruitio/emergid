import MedicalCard, { MedicalData } from "@/components/MedicalCard";
import { db } from "@/lib/db";
import { accounts, accessLog } from "@/lib/db/schema";
import { hash, decryptDEK } from "@/lib/crypto";
import { decryptProfile } from "@/lib/medical-crypto";
import { isExpired } from "@/lib/ttl";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// No caching — always fresh data
export const dynamic = "force-dynamic";

export default async function EmergencyCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
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
      dnr: accounts.dnr,
      dnrNotes: accounts.dnrNotes,
      lastUpdated: accounts.lastUpdated,
      ttlDeadline: accounts.ttlDeadline,
    })
    .from(accounts)
    .where(eq(accounts.tokenHash, tokenHash))
    .get();

  if (!account) {
    notFound();
  }

  if (isExpired(account.ttlDeadline)) {
    db.delete(accounts).where(eq(accounts.id, account.id)).run();
    notFound();
  }

  // Log access
  db.insert(accessLog).values({ accountId: account.id }).run();

  // Decrypt DEK using token, then decrypt medical data
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
      dnr: account.dnr,
      dnrNotes: account.dnrNotes,
    },
    dek
  );

  const medicalData: MedicalData = {
    ...decrypted,
    lastUpdated: account.lastUpdated,
  };

  return <MedicalCard data={medicalData} />;
}
