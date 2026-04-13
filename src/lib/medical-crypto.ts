import { encrypt, decrypt } from "./crypto";

/** The medical fields that get encrypted */
export interface MedicalProfile {
  bloodType: string | null;
  allergies: string | null; // JSON array string
  medications: string | null;
  conditions: string | null;
  physicianName: string | null;
  physicianPhone: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  dnr: boolean;
  dnrNotes: string | null;
}

/** Encrypt a single field — returns null if value is null/empty */
function encryptField(value: string | null | undefined, dek: Buffer): string | null {
  if (!value) return null;
  return encrypt(value, dek);
}

/** Decrypt a single field — returns null if ciphertext is null */
function decryptField(ciphertext: string | null, dek: Buffer): string | null {
  if (!ciphertext) return null;
  return decrypt(ciphertext, dek);
}

/** Encrypt all medical fields for storage */
export function encryptProfile(
  profile: MedicalProfile,
  dek: Buffer
): Record<string, string | null> {
  return {
    bloodType: encryptField(profile.bloodType, dek),
    allergies: encryptField(profile.allergies, dek),
    medications: encryptField(profile.medications, dek),
    conditions: encryptField(profile.conditions, dek),
    physicianName: encryptField(profile.physicianName, dek),
    physicianPhone: encryptField(profile.physicianPhone, dek),
    emergencyContactRelation: encryptField(profile.emergencyContactRelation, dek),
    emergencyContactPhone: encryptField(profile.emergencyContactPhone, dek),
    dnr: encryptField(String(profile.dnr), dek),
    dnrNotes: encryptField(profile.dnrNotes, dek),
  };
}

/** Decrypt all medical fields from storage */
export function decryptProfile(
  encrypted: Record<string, string | null>,
  dek: Buffer
): MedicalProfile {
  return {
    bloodType: decryptField(encrypted.bloodType, dek),
    allergies: decryptField(encrypted.allergies, dek),
    medications: decryptField(encrypted.medications, dek),
    conditions: decryptField(encrypted.conditions, dek),
    physicianName: decryptField(encrypted.physicianName, dek),
    physicianPhone: decryptField(encrypted.physicianPhone, dek),
    emergencyContactRelation: decryptField(encrypted.emergencyContactRelation, dek),
    emergencyContactPhone: decryptField(encrypted.emergencyContactPhone, dek),
    dnr: decryptField(encrypted.dnr, dek) === "true",
    dnrNotes: decryptField(encrypted.dnrNotes, dek),
  };
}
