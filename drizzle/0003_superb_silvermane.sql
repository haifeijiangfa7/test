CREATE TABLE `promotion_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`usedCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promotion_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotion_codes_code_unique` UNIQUE(`code`)
);
