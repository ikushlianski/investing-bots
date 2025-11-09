CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_url" text NOT NULL,
	"websocket_url" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "exchanges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"exchange_id" integer NOT NULL,
	"api_key" text NOT NULL,
	"api_secret" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text,
	"exchange" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "instruments_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "bot_instruments" (
	"bot_id" integer NOT NULL,
	"instrument_id" integer NOT NULL,
	CONSTRAINT "bot_instruments_bot_id_instrument_id_pk" PRIMARY KEY("bot_id","instrument_id")
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"personality_name" text,
	"exchange_id" integer,
	"strategy_version_id" integer NOT NULL,
	"status" text DEFAULT 'inactive' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "strategies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategy_version_id" integer NOT NULL,
	"setup_id" integer,
	"signal_type" text NOT NULL,
	"indicator" text,
	"timestamp" timestamp NOT NULL,
	"processed_at" timestamp,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "strategy_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategy_id" integer NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"instrument_id" integer NOT NULL,
	"setup_id" integer,
	"signal_id" integer,
	"strategy_version_id" integer,
	"credential_id" integer,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"filled_quantity" numeric(20, 8) DEFAULT '0',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"instrument_id" integer NOT NULL,
	"setup_id" integer,
	"strategy_version_id" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"entry_price" numeric(20, 8) NOT NULL,
	"exit_price" numeric(20, 8),
	"size" numeric(20, 8) NOT NULL,
	"pnl" numeric(20, 8),
	"opened_at" timestamp NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "risk_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"max_position_size" numeric(20, 8),
	"stop_loss_percentage" numeric(10, 4),
	"take_profit_percentage" numeric(10, 4)
);
--> statement-breakpoint
CREATE TABLE "pnl_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"pnl" numeric(20, 8) NOT NULL,
	"timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer,
	"level" text NOT NULL,
	"event" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_regimes" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"timeframe" text NOT NULL,
	"regime_type" text NOT NULL,
	"still_active" boolean DEFAULT true NOT NULL,
	"trend_strength" numeric(12, 6),
	"price_vs_ma" numeric(12, 6),
	"volatility" numeric(12, 6),
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ended_at" timestamp,
	"parameters" jsonb
);
--> statement-breakpoint
CREATE TABLE "price_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"timeframe" text NOT NULL,
	"level_type" text NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"strength" integer DEFAULT 1 NOT NULL,
	"tests" integer DEFAULT 1 NOT NULL,
	"still_valid" boolean DEFAULT true NOT NULL,
	"first_tested_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"last_tested_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"invalidated_at" timestamp,
	"parameters" jsonb
);
--> statement-breakpoint
CREATE TABLE "setups" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"entry_timeframe" text NOT NULL,
	"context_timeframe" text,
	"setup_type" text NOT NULL,
	"direction" text NOT NULL,
	"state" text DEFAULT 'FORMING' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"activated_at" timestamp,
	"triggered_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"forming_duration_minutes" integer NOT NULL,
	"active_duration_minutes" integer NOT NULL,
	"candles_elapsed" integer DEFAULT 0 NOT NULL,
	"entry_zone_low" numeric(20, 8) NOT NULL,
	"entry_zone_high" numeric(20, 8) NOT NULL,
	"stop_loss" numeric(20, 8) NOT NULL,
	"take_profit_1" numeric(20, 8),
	"take_profit_2" numeric(20, 8),
	"take_profit_3" numeric(20, 8),
	"regime_id" integer,
	"context_regime_id" integer,
	"strategy_version_id" integer NOT NULL,
	"risk_reward_ratio" numeric(8, 4),
	"position_size_planned" numeric(20, 8),
	"required_confirmations" integer DEFAULT 3 NOT NULL,
	"parameters" jsonb,
	"invalidated_at" timestamp,
	"invalidation_reason" text
);
--> statement-breakpoint
CREATE TABLE "setup_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"setup_id" integer NOT NULL,
	"metric_id" integer,
	"signal_type" text NOT NULL,
	"signal_role" text NOT NULL,
	"detected_on_timeframe" text NOT NULL,
	"fired_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"value" numeric(12, 6),
	"threshold" numeric(12, 6),
	"confidence" numeric(6, 4),
	"still_valid" boolean DEFAULT true NOT NULL,
	"invalidated_at" timestamp,
	"requires_recheck" boolean DEFAULT true NOT NULL,
	"last_rechecked_at" timestamp,
	"parameters" jsonb
);
--> statement-breakpoint
CREATE TABLE "candles" (
	"instrument_id" integer NOT NULL,
	"timeframe" varchar(10) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"open" numeric(20, 8) NOT NULL,
	"high" numeric(20, 8) NOT NULL,
	"low" numeric(20, 8) NOT NULL,
	"close" numeric(20, 8) NOT NULL,
	"volume" numeric(20, 8) NOT NULL,
	"bb_upper" numeric(20, 8),
	"bb_middle" numeric(20, 8),
	"bb_lower" numeric(20, 8),
	"rsi" numeric(10, 2),
	"atr" numeric(20, 8),
	"volume_ma" numeric(20, 8),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "candles_instrument_id_timeframe_timestamp_pk" PRIMARY KEY("instrument_id","timeframe","timestamp")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"setup_id" integer NOT NULL,
	"instrument_id" integer NOT NULL,
	"entry_order_id" integer,
	"exit_order_id" integer,
	"position_id" integer,
	"direction" text NOT NULL,
	"entry_price" numeric(20, 8) NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"stop_loss" numeric(20, 8) NOT NULL,
	"take_profit_1" numeric(20, 8),
	"take_profit_2" numeric(20, 8),
	"entry_time" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"exit_time" timestamp,
	"exit_price" numeric(20, 8),
	"exit_reason" text,
	"realized_pnl" numeric(20, 8),
	"realized_pnl_percent" numeric(10, 4),
	"stop_moved_to_breakeven" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"trigger_signals" jsonb
);
--> statement-breakpoint
CREATE TABLE "portfolio_holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer NOT NULL,
	"exchange_id" integer NOT NULL,
	"asset" text NOT NULL,
	"free" numeric(20, 8) DEFAULT '0' NOT NULL,
	"locked" numeric(20, 8) DEFAULT '0' NOT NULL,
	"total" numeric(20, 8) DEFAULT '0' NOT NULL,
	"average_buy_price" numeric(20, 8),
	"current_price" numeric(20, 8),
	"exchange_metadata" jsonb,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_currency" text DEFAULT 'USDT' NOT NULL,
	"total_value" numeric(20, 8) DEFAULT '0' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_personalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"personality_name" text NOT NULL,
	"risk_appetite" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"stop_loss_tightness" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"take_profit_aggressiveness" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"entry_patience" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"entry_confidence_threshold" numeric(4, 2) DEFAULT '0.7' NOT NULL,
	"trail_stop_aggressiveness" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"max_position_size_percent" numeric(6, 2) DEFAULT '10' NOT NULL,
	"max_concurrent_positions" integer DEFAULT 3 NOT NULL,
	"min_setup_quality" numeric(4, 2) DEFAULT '0.6' NOT NULL,
	"preferred_setups" jsonb,
	"regime_preference" jsonb,
	"starting_capital" numeric(20, 8) DEFAULT '100' NOT NULL,
	"current_capital" numeric(20, 8) DEFAULT '100' NOT NULL,
	"partial_profit_taking" boolean DEFAULT false NOT NULL,
	"breakeven_movement" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"max_daily_trades" integer,
	"volatility_tolerance" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "bot_personalities_bot_id_unique" UNIQUE("bot_id")
);
--> statement-breakpoint
CREATE TABLE "bot_strategies" (
	"bot_id" integer NOT NULL,
	"strategy_version_id" integer NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"weight" numeric(6, 4) DEFAULT '1' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "bot_strategies_bot_id_strategy_version_id_pk" PRIMARY KEY("bot_id","strategy_version_id")
);
--> statement-breakpoint
CREATE TABLE "strategy_setup_types" (
	"strategy_version_id" integer NOT NULL,
	"setup_type" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "strategy_setup_types_strategy_version_id_setup_type_pk" PRIMARY KEY("strategy_version_id","setup_type")
);
--> statement-breakpoint
CREATE TABLE "setup_signal_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"setup_signal_id" integer NOT NULL,
	"metric_id" integer NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	"threshold_value" numeric(20, 8),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"unit" text NOT NULL,
	"min_value" numeric(20, 8),
	"max_value" numeric(20, 8),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "strategy_metrics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "strategy_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategy_version_id" integer NOT NULL,
	"bot_id" integer,
	"metric_type" text NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"calculated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "strategy_version_metrics" (
	"strategy_version_id" integer NOT NULL,
	"metric_id" integer NOT NULL,
	"threshold_value" numeric(20, 8),
	"operator" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "strategy_version_metrics_strategy_version_id_metric_id_pk" PRIMARY KEY("strategy_version_id","metric_id")
);
--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_exchange_id_exchanges_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_instruments" ADD CONSTRAINT "bot_instruments_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_instruments" ADD CONSTRAINT "bot_instruments_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_exchange_id_exchanges_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_versions" ADD CONSTRAINT "strategy_versions_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_credential_id_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credentials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_configs" ADD CONSTRAINT "risk_configs_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pnl_records" ADD CONSTRAINT "pnl_records_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_regimes" ADD CONSTRAINT "market_regimes_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_levels" ADD CONSTRAINT "price_levels_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setups" ADD CONSTRAINT "setups_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setups" ADD CONSTRAINT "setups_regime_id_market_regimes_id_fk" FOREIGN KEY ("regime_id") REFERENCES "public"."market_regimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setups" ADD CONSTRAINT "setups_context_regime_id_market_regimes_id_fk" FOREIGN KEY ("context_regime_id") REFERENCES "public"."market_regimes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setups" ADD CONSTRAINT "setups_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_signals" ADD CONSTRAINT "setup_signals_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_signals" ADD CONSTRAINT "setup_signals_metric_id_strategy_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."strategy_metrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candles" ADD CONSTRAINT "candles_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_setup_id_setups_id_fk" FOREIGN KEY ("setup_id") REFERENCES "public"."setups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_entry_order_id_orders_id_fk" FOREIGN KEY ("entry_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_exit_order_id_orders_id_fk" FOREIGN KEY ("exit_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_exchange_id_exchanges_id_fk" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_personalities" ADD CONSTRAINT "bot_personalities_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_strategies" ADD CONSTRAINT "bot_strategies_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_strategies" ADD CONSTRAINT "bot_strategies_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_setup_types" ADD CONSTRAINT "strategy_setup_types_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_signal_metrics" ADD CONSTRAINT "setup_signal_metrics_setup_signal_id_setup_signals_id_fk" FOREIGN KEY ("setup_signal_id") REFERENCES "public"."setup_signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_signal_metrics" ADD CONSTRAINT "setup_signal_metrics_metric_id_strategy_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."strategy_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_performance_metrics" ADD CONSTRAINT "strategy_performance_metrics_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_performance_metrics" ADD CONSTRAINT "strategy_performance_metrics_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_version_metrics" ADD CONSTRAINT "strategy_version_metrics_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_version_metrics" ADD CONSTRAINT "strategy_version_metrics_metric_id_strategy_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."strategy_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candles_instrument_timeframe_timestamp_idx" ON "candles" USING btree ("instrument_id","timeframe","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candles_timestamp_idx" ON "candles" USING btree ("timestamp" DESC NULLS LAST);
