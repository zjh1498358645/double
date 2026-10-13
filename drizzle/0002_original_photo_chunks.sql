CREATE TABLE `photo_chunks` (
	`key` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`chunk_count` integer NOT NULL,
	`total_bytes` integer NOT NULL,
	`data` blob NOT NULL,
	PRIMARY KEY(`key`, `chunk_index`)
);
