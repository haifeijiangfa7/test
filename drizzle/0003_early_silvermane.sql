ALTER TABLE `accounts` ADD `hasRedeemedCode` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `accounts` ADD `lastRedeemedAt` timestamp;--> statement-breakpoint
ALTER TABLE `vip_accounts` ADD `hasRedeemedCode` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `vip_accounts` ADD `lastRedeemedAt` timestamp;