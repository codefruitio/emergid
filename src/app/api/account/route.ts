import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import {
  generateAccountNumber,
  generateToken,
  generateDEK,
  hash,
  encryptDEK,
} from "@/lib/crypto";
import { newTtlDeadline } from "@/lib/ttl";

export async function POST() {
  const accountNumber = generateAccountNumber();
  const token = generateToken();
  const dek = generateDEK();

  const accountHash = hash(accountNumber);
  const tokenHash = hash(token);
  const ttlDeadline = newTtlDeadline();

  // Unique salt for PBKDF2 key derivation
  const keySalt = randomBytes(16).toString("hex");

  // Encrypt DEK under both credentials
  const encryptedDekAccount = encryptDEK(dek, accountNumber, keySalt);
  const encryptedDekToken = encryptDEK(dek, token, keySalt);

  db.insert(accounts)
    .values({
      accountHash,
      tokenHash,
      keySalt,
      encryptedDekAccount,
      encryptedDekToken,
      ttlDeadline,
    })
    .run();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const tokenUrl = `${baseUrl}/e/${token}`;

  return NextResponse.json({
    accountNumber,
    tokenUrl,
    message:
      "Save your account number now. It will not be shown again. There is no recovery option.",
  });
}
