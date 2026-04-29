import { cookies } from "next/headers";
import { sign, verify, encrypt, decrypt } from "./crypto";
import { getSessionSecret } from "./session-secret";

const COOKIE_NAME = "emergid_session";
const DEK_COOKIE_NAME = "emergid_dek";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

interface Session {
  accountId: number;
}

/** Create a signed session cookie and store the encrypted DEK */
export async function createSession(accountId: number, dek: Buffer): Promise<void> {
  const secret = getSessionSecret();
  const timestamp = Date.now();
  const payload = `${accountId}:${timestamp}`;
  const signature = sign(payload, secret);
  const value = `${payload}:${signature}`;

  // Encrypt the DEK with the session secret for cookie storage
  const sessionKey = Buffer.from(secret.padEnd(32, "0").slice(0, 32));
  const encryptedDek = encrypt(dek.toString("hex"), sessionKey);

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };

  cookieStore.set(COOKIE_NAME, value, cookieOptions);
  cookieStore.set(DEK_COOKIE_NAME, encryptedDek, cookieOptions);
}

/** Read and verify the session cookie. Returns null if invalid. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  const parts = cookie.value.split(":");
  if (parts.length !== 3) return null;

  const [accountIdStr, timestampStr, signature] = parts;
  const payload = `${accountIdStr}:${timestampStr}`;

  if (!verify(payload, signature, getSessionSecret())) return null;

  const timestamp = parseInt(timestampStr, 10);
  if (Date.now() - timestamp > MAX_AGE * 1000) return null;

  const accountId = parseInt(accountIdStr, 10);
  if (isNaN(accountId)) return null;

  return { accountId };
}

/** Retrieve the DEK from the session cookie. Returns null if not available. */
export async function getSessionDEK(): Promise<Buffer | null> {
  const cookieStore = await cookies();
  const dekCookie = cookieStore.get(DEK_COOKIE_NAME);
  if (!dekCookie) return null;

  try {
    const secret = getSessionSecret();
    const sessionKey = Buffer.from(secret.padEnd(32, "0").slice(0, 32));
    const dekHex = decrypt(dekCookie.value, sessionKey);
    return Buffer.from(dekHex, "hex");
  } catch {
    return null;
  }
}

/** Destroy the session cookies */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(DEK_COOKIE_NAME);
}
