import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "emergid.db");
const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Skip migrations during `next build` — volume isn't mounted at build time
if (process.env.NEXT_PHASE !== "phase-production-build") {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  // Safety net: apply any columns that may have been skipped due to stale migration tracking
  const accountColumns = sqlite.pragma("table_info(accounts)") as Array<{ name: string }>;
  if (!accountColumns.some((c) => c.name === "apns_token")) {
    sqlite.exec("ALTER TABLE accounts ADD COLUMN apns_token TEXT");
  }
}
