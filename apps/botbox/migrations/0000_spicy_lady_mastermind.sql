CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY NOT NULL,
	`bot_id` integer,
	`level` text NOT NULL,
	`event` text NOT NULL,
	`message` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bot_instruments` (
	`bot_id` integer NOT NULL,
	`instrument_id` integer NOT NULL,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bots_name_unique` ON `bots` (`name`);--> statement-breakpoint
CREATE TABLE `credentials` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`exchange_id` integer NOT NULL,
	`api_key` text NOT NULL,
	`api_secret` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exchange_id`) REFERENCES `exchanges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exchanges` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`api_url` text NOT NULL,
	`websocket_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchanges_name_unique` ON `exchanges` (`name`);--> statement-breakpoint
CREATE TABLE `instruments` (
	`id` integer PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`name` text,
	`exchange` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instruments_symbol_unique` ON `instruments` (`symbol`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY NOT NULL,
	`bot_id` integer NOT NULL,
	`instrument_id` integer NOT NULL,
	`exchange_order_id` text,
	`status` text NOT NULL,
	`side` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_exchange_order_id_unique` ON `orders` (`exchange_order_id`);--> statement-breakpoint
CREATE TABLE `pnl_records` (
	`id` integer PRIMARY KEY NOT NULL,
	`bot_id` integer NOT NULL,
	`pnl` real NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY NOT NULL,
	`bot_id` integer NOT NULL,
	`instrument_id` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`entry_price` real NOT NULL,
	`exit_price` real,
	`size` real NOT NULL,
	`pnl` real,
	`opened_at` text NOT NULL,
	`closed_at` text,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `risk_configs` (
	`id` integer PRIMARY KEY NOT NULL,
	`bot_id` integer NOT NULL,
	`max_position_size` real,
	`stop_loss_percentage` real,
	`take_profit_percentage` real,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` integer PRIMARY KEY NOT NULL,
	`strategy_version_id` integer NOT NULL,
	`signal_type` text NOT NULL,
	`indicator` text,
	`timestamp` text NOT NULL,
	`processed_at` text,
	`payload` text,
	FOREIGN KEY (`strategy_version_id`) REFERENCES `strategy_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `strategies_name_unique` ON `strategies` (`name`);--> statement-breakpoint
CREATE TABLE `strategy_versions` (
	`id` integer PRIMARY KEY NOT NULL,
	`strategy_id` integer NOT NULL,
	`version` integer NOT NULL,
	`config` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` integer PRIMARY KEY NOT NULL,
	`order_id` integer NOT NULL,
	`position_id` integer NOT NULL,
	`price` real NOT NULL,
	`quantity` real NOT NULL,
	`fee` real,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);