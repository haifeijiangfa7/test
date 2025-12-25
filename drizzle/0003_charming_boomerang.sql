CREATE TABLE `promotion_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`status` enum('available','used','invalid') NOT NULL DEFAULT 'available',
	`usedByAccountId` int,
	`usedByAccountType` enum('normal','vip'),
	`usedByEmail` varchar(320),
	`usedAt` timestamp,
	`creditsBefore` int,
	`creditsAfter` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotion_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotion_codes_code_unique` UNIQUE(`code`)
);
