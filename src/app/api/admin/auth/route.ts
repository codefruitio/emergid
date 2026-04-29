import { NextRequest, NextResponse } from "next/server";
import {
  checkOwnerPassword,
  createOwnerSession,
  destroyOwnerSession,
} from "@/lib/owner-auth";

export async function POST(request: NextRequest) {
  if (!process.env.OWNER_PASSWORD) {
    console.error(
      "[admin/auth] OWNER_PASSWORD is not set — owner login is disabled."
    );
    return NextResponse.json(
      { error: "Owner login is not configured on this server." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json(
      { error: "Password is required." },
      { status: 400 }
    );
  }

  if (!checkOwnerPassword(password)) {
    return NextResponse.json(
      { error: "Invalid password." },
      { status: 401 }
    );
  }

  await createOwnerSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await destroyOwnerSession();
  return NextResponse.json({ success: true });
}
