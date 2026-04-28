import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { hash } from "@/lib/crypto";
import { isExpired } from "@/lib/ttl";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ConfirmAccess from "@/components/ConfirmAccess";

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

  return <ConfirmAccess token={token} />;
}
