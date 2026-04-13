CREATE TABLE `access_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`accessed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_hash` text NOT NULL,
	`token_hash` text NOT NULL,
	`key_salt` text NOT NULL,
	`encrypted_dek_account` text NOT NULL,
	`encrypted_dek_token` text NOT NULL,
	`blood_type` text,
	`allergies` text,
	`medications` text,
	`conditions` text,
	`physician_name` text,
	`physician_phone` text,
	`emergency_contact_relation` text,
	`emergency_contact_phone` text,
	`dnr` text,
	`dnr_notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_updated` text DEFAULT (datetime('now')) NOT NULL,
	`ttl_deadline` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_account_hash_unique` ON `accounts` (`account_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_token_hash_unique` ON `accounts` (`token_hash`);