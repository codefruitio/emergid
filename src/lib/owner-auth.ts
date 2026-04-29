import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { sign, verify } from "./crypto";
import { getSessionSecret } from "./session-secret";

const COOKIE_NAME = "emergid_owner";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * True if the supplied password matches OWNER_PASSWORD using constant-time
 * comparison. False if OWNER_PASSWORD is unset (fail-closed) or mismatched.
 */
export function checkOwnerPassword(password: string): boolean {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

/** Create a signed owner-session cookie. Caller must have already validated the password. */
export async function createOwnerSession(): Promise<void> {
  const timestamp = Date.now();
  const payload = `owner:${timestamp}`;
  const signature = sign(payload, getSessionSecret());
  const value = `${payload}:${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroyOwnerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** True iff the request has a valid emergid_owner cookie. */
async function hasValidOwnerCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return false;

  const parts = cookie.value.split(":");
  if (parts.length !== 3) return false;
  const [tag, timestampStr, signature] = parts;
  if (tag !== "owner") return false;

  const payload = `${tag}:${timestampStr}`;
  if (!verify(payload, signature, getSessionSecret())) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp)) return false;
  if (Date.now() - timestamp > MAX_AGE * 1000) return false;

  return true;
}

/**
 * Verify the request is from the owner. Accepts either:
 *   - Authorization: Bearer <OWNER_PASSWORD>   (machine clients, iOS app)
 *   - emergid_owner cookie set by /api/admin/auth (browser dashboard)
 *
 * Fails closed when OWNER_PASSWORD is unset on the server.
 *
 * Returns null when authorized, or a 401 NextResponse the caller should return.
 */
export async function requireOwner(
  request: NextRequest
): Promise<NextResponse | null> {
  if (!process.env.OWNER_PASSWORD) {
    console.error(
      "[owner-auth] OWNER_PASSWORD is not set — refusing all owner requests."
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bearer header path
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const provided = header.slice("Bearer ".length);
    if (checkOwnerPassword(provided)) return null;
  }

  // Cookie path
  if (await hasValidOwnerCookie()) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
