CREATE TABLE `promotion_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`isUsed` boolean NOT NULL DEFAULT false,
	`usedByEmail` varchar(320),
	`usedByAccountType` enum('normal','vip'),
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promotion_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotion_codes_code_unique` UNIQUE(`code`)
);
