CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`token` text NOT NULL,
	`clientId` varchar(22) NOT NULL,
	`userId` varchar(50),
	`username` varchar(100),
	`tokenIssuedAt` timestamp,
	`tokenExpiresAt` timestamp,
	`uid` varchar(50),
	`membershipVersion` varchar(20),
	`membershipEndTime` timestamp,
	`subscriptionStatus` varchar(50),
	`totalCredits` int,
	`freeCredits` int,
	`periodicCredits` int,
	`refreshCredits` int,
	`inviteCode` varchar(30),
	`inviteUsedCount` int DEFAULT 0,
	`isBlocked` boolean DEFAULT false,
	`smsVerified` boolean DEFAULT false,
	`registeredAt` timestamp,
	`lastCheckedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mode` enum('invite_only','normal_account','vip_account') NOT NULL DEFAULT 'invite_only',
	`targetAccountId` int,
	`targetAccountType` enum('normal','vip'),
	`targetInviteCode` varchar(30) NOT NULL,
	`targetEmail` varchar(320),
	`targetPassword` varchar(255),
	`initialCredits` int NOT NULL,
	`targetCredits` int NOT NULL,
	`currentCredits` int,
	`requiredInvites` int NOT NULL,
	`completedInvites` int DEFAULT 0,
	`failedInvites` int DEFAULT 0,
	`status` enum('pending','running','completed','failed','paused') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deleted_normal_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`credits` int,
	`creditCategory` varchar(20),
	`sourceTable` varchar(50),
	`deleteReason` enum('manual','ineligible','blocked','extracted') DEFAULT 'manual',
	`deleteReasonDetail` text,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deleted_normal_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deleted_vip_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`credits` int,
	`creditCategory` varchar(20),
	`sourceTable` varchar(50),
	`deleteReason` enum('manual','ineligible','blocked','extracted') DEFAULT 'manual',
	`deleteReasonDetail` text,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deleted_vip_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extracted_normal_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`credits` int NOT NULL,
	`creditCategory` varchar(20),
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extracted_normal_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `extracted_vip_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`credits` int NOT NULL,
	`creditCategory` varchar(20),
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `extracted_vip_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inviterAccountId` int NOT NULL,
	`inviterEmail` varchar(320) NOT NULL,
	`inviteCode` varchar(30) NOT NULL,
	`inviteeId` int NOT NULL,
	`inviteeEmail` varchar(320) NOT NULL,
	`status` enum('success','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`inviterCreditsBefore` int,
	`inviterCreditsAfter` int,
	`inviteeCreditsBefore` int,
	`inviteeCreditsAfter` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`token` text NOT NULL,
	`clientId` varchar(22) NOT NULL,
	`userId` varchar(50),
	`username` varchar(100),
	`tokenIssuedAt` timestamp,
	`tokenExpiresAt` timestamp,
	`isBlocked` boolean DEFAULT false,
	`smsVerified` boolean DEFAULT false,
	`freeCredits` int,
	`inviteStatus` enum('pending','invited','failed','ineligible') NOT NULL DEFAULT 'pending',
	`eligibilityReason` text,
	`invitedByCode` varchar(30),
	`invitedAt` timestamp,
	`lastCheckedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `normal_account_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`targetCredits` int NOT NULL,
	`actualCredits` int,
	`inviteCount` int DEFAULT 0,
	`taskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `normal_account_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `normal_account_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`token` text,
	`clientId` varchar(22),
	`credits` int NOT NULL,
	`creditCategory` varchar(20) NOT NULL,
	`membershipVersion` varchar(20),
	`inviteCode` varchar(30),
	`inviteUsedCount` int DEFAULT 0,
	`tokenExpiresAt` timestamp,
	`batchId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `normal_account_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vip_account_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`targetCredits` int NOT NULL,
	`actualCredits` int,
	`inviteCount` int DEFAULT 0,
	`taskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vip_account_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vip_account_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`token` text,
	`clientId` varchar(22),
	`credits` int NOT NULL,
	`creditCategory` varchar(20) NOT NULL,
	`membershipVersion` varchar(20),
	`inviteCode` varchar(30),
	`inviteUsedCount` int DEFAULT 0,
	`tokenExpiresAt` timestamp,
	`batchId` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vip_account_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vip_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` varchar(255) NOT NULL,
	`token` text NOT NULL,
	`clientId` varchar(22) NOT NULL,
	`userId` varchar(50),
	`username` varchar(100),
	`tokenIssuedAt` timestamp,
	`tokenExpiresAt` timestamp,
	`uid` varchar(50),
	`membershipVersion` varchar(20),
	`membershipEndTime` timestamp,
	`subscriptionStatus` varchar(50),
	`totalCredits` int,
	`freeCredits` int,
	`periodicCredits` int,
	`refreshCredits` int,
	`inviteCode` varchar(30),
	`inviteUsedCount` int DEFAULT 0,
	`isBlocked` boolean DEFAULT false,
	`smsVerified` boolean DEFAULT false,
	`registeredAt` timestamp,
	`lastCheckedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vip_accounts_id` PRIMARY KEY(`id`)
);
