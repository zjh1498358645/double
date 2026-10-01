CREATE TABLE `members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`slot` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_room_slot` ON `members` (`room_id`,`slot`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer NOT NULL,
	`invite_hash` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_invite_hash_unique` ON `rooms` (`invite_hash`);