import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountHash: text("account_hash").notNull().unique(),
  tokenHash: text("token_hash").notNull().unique(),

  // Envelope encryption: DEK encrypted under both credentials
  keySalt: text("key_salt").notNull(), // PBKDF2 salt for key derivation
  encryptedDekAccount: text("encrypted_dek_account").notNull(), // DEK encrypted with account-derived key
  encryptedDekToken: text("encrypted_dek_token").notNull(), // DEK encrypted with token-derived key

  // Medical profile — all encrypted with DEK, stored as AES-256-GCM ciphertext
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medications: text("medications"),
  conditions: text("conditions"),
  physicianName: text("physician_name"),
  physicianPhone: text("physician_phone"),
  emergencyContactRelation: text("emergency_contact_relation"),
  emergencyContactPhone: text("emergency_contact_phone"),

  // Metadata
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  lastUpdated: text("last_updated")
    .notNull()
    .default(sql`(datetime('now'))`),
  ttlDeadline: text("ttl_deadline").notNull(),
});

export const accessLog = sqliteTable("access_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull().default("tag_accessed"),
  accessedAt: text("accessed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
