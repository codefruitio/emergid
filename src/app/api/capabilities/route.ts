import { NextResponse } from "next/server";
import { isApnsConfigured } from "@/lib/apns";

export function GET() {
  return NextResponse.json({
    pushNotifications: isApnsConfigured(),
    cronAuthorized: !!process.env.CRON_SECRET,
  });
}
