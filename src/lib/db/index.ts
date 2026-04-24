import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

type DB = BetterSQLite3Database<typeof schema>;

function openDb(): DB {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "emergid.db");
  const sqlite = new Database(dbPath);

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const drizzleDb = drizzle(sqlite, { schema });

  migrate(drizzleDb, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  // Safety net: apply any columns that may have been skipped due to stale migration tracking
  const accountColumns = sqlite.pragma("table_info(accounts)") as Array<{ name: string }>;
  if (!accountColumns.some((c) => c.name === "apns_token")) {
    sqlite.exec("ALTER TABLE accounts ADD COLUMN apns_token TEXT");
  }
  if (!accountColumns.some((c) => c.name === "last_notification_sent_at")) {
    sqlite.exec("ALTER TABLE accounts ADD COLUMN last_notification_sent_at TEXT");
  }

  const accessLogColumns = sqlite.pragma("table_info(access_log)") as Array<{ name: string }>;
  if (!accessLogColumns.some((c) => c.name === "notification_status")) {
    sqlite.exec("ALTER TABLE access_log ADD COLUMN notification_status TEXT");
  }

  return drizzleDb;
}

// Lazy-init. During `next build` Next imports route modules across parallel workers
// to collect page data; opening SQLite at import time races those workers on the same
// file and throws SQLITE_BUSY. Defer the open until the first runtime call.
let _db: DB | null = null;

export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    if (!_db) {
      if (process.env.NEXT_PHASE === "phase-production-build") {
        throw new Error("db accessed during next build — handlers must not run at build time");
      }
      _db = openDb();
    }
    return Reflect.get(_db, prop, receiver);
  },
});
