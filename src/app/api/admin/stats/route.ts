import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, accessLog } from "@/lib/db/schema";
import { sql, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/owner-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = await requireOwner(request);
  if (unauthorized) return unauthorized;

  // ───── Account aggregates ─────────────────────────────────────────────
  const accountTotals = db
    .select({
      total: sql<number>`count(*)`,
      withPush: sql<number>`sum(case when ${accounts.apnsToken} is not null then 1 else 0 end)`,
      activeLast24h: sql<number>`sum(case when ${accounts.lastUpdated} > datetime('now', '-1 day') then 1 else 0 end)`,
      activeLast7d: sql<number>`sum(case when ${accounts.lastUpdated} > datetime('now', '-7 days') then 1 else 0 end)`,
      activeLast30d: sql<number>`sum(case when ${accounts.lastUpdated} > datetime('now', '-30 days') then 1 else 0 end)`,
      expiringWithin30d: sql<number>`sum(case when ${accounts.ttlDeadline} > datetime('now') and ${accounts.ttlDeadline} <= datetime('now', '+30 days') then 1 else 0 end)`,
      expiringWithin60d: sql<number>`sum(case when ${accounts.ttlDeadline} > datetime('now') and ${accounts.ttlDeadline} <= datetime('now', '+60 days') then 1 else 0 end)`,
      expiringWithin90d: sql<number>`sum(case when ${accounts.ttlDeadline} > datetime('now') and ${accounts.ttlDeadline} <= datetime('now', '+90 days') then 1 else 0 end)`,
      pastExpiry: sql<number>`sum(case when ${accounts.ttlDeadline} <= datetime('now') then 1 else 0 end)`,
    })
    .from(accounts)
    .get();

  // ───── Access log aggregates ──────────────────────────────────────────
  const accessTotals = db
    .select({
      total: sql<number>`count(*)`,
      last24h: sql<number>`sum(case when ${accessLog.accessedAt} > datetime('now', '-1 day') then 1 else 0 end)`,
      last7d: sql<number>`sum(case when ${accessLog.accessedAt} > datetime('now', '-7 days') then 1 else 0 end)`,
      last30d: sql<number>`sum(case when ${accessLog.accessedAt} > datetime('now', '-30 days') then 1 else 0 end)`,
      notifSent: sql<number>`sum(case when ${accessLog.notificationStatus} = 'sent' then 1 else 0 end)`,
      notifCooldown: sql<number>`sum(case when ${accessLog.notificationStatus} = 'cooldown' then 1 else 0 end)`,
      notifNoToken: sql<number>`sum(case when ${accessLog.notificationStatus} = 'no_token' then 1 else 0 end)`,
    })
    .from(accessLog)
    .get();

  // ───── Recent access events (no PII — accountId is an internal int, not the secret) ─
  const recentEvents = db
    .select({
      accountId: accessLog.accountId,
      eventType: accessLog.eventType,
      notificationStatus: accessLog.notificationStatus,
      accessedAt: accessLog.accessedAt,
    })
    .from(accessLog)
    .orderBy(desc(accessLog.accessedAt))
    .limit(20)
    .all();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    accounts: {
      total: accountTotals?.total ?? 0,
      withPushEnabled: accountTotals?.withPush ?? 0,
      active: {
        last24h: accountTotals?.activeLast24h ?? 0,
        last7d: accountTotals?.activeLast7d ?? 0,
        last30d: accountTotals?.activeLast30d ?? 0,
      },
      expiring: {
        within30d: accountTotals?.expiringWithin30d ?? 0,
        within60d: accountTotals?.expiringWithin60d ?? 0,
        within90d: accountTotals?.expiringWithin90d ?? 0,
        pastDeadline: accountTotals?.pastExpiry ?? 0,
      },
    },
    access: {
      total: accessTotals?.total ?? 0,
      last24h: accessTotals?.last24h ?? 0,
      last7d: accessTotals?.last7d ?? 0,
      last30d: accessTotals?.last30d ?? 0,
      notifications: {
        sent: accessTotals?.notifSent ?? 0,
        cooldown: accessTotals?.notifCooldown ?? 0,
        noToken: accessTotals?.notifNoToken ?? 0,
      },
    },
    recentEvents,
  });
}
