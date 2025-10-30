import {
  ExchangeCredentials,
  ExchangeCredentialsSchema,
  ExchangeEnvironment,
} from "./types";
import { ExchangeAuthenticationError } from "./errors";

export interface CredentialsSource {
  BINANCE_API_KEY?: string;
  BINANCE_API_SECRET?: string;
  BYBIT_API_KEY?: string;
  BYBIT_API_SECRET?: string;
}

export const getExchangeCredentials = (
  exchange: "binance" | "bybit",
  environment: ExchangeEnvironment,
  source: CredentialsSource
): ExchangeCredentials => {
  const exchangePrefix = exchange.toUpperCase();
  const apiKey = source[`${exchangePrefix}_API_KEY` as keyof CredentialsSource];
  const apiSecret =
    source[`${exchangePrefix}_API_SECRET` as keyof CredentialsSource];

  if (!apiKey || !apiSecret) {
    throw new ExchangeAuthenticationError(
      exchange,
      new Error(
        `Missing API credentials for ${exchange}. Please ensure ${exchangePrefix}_API_KEY and ${exchangePrefix}_API_SECRET are set in Cloudflare Secrets.`
      )
    );
  }

  const credentials: ExchangeCredentials = {
    apiKey,
    apiSecret,
    environment,
  };

  try {
    return ExchangeCredentialsSchema.parse(credentials);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : JSON.stringify(error);

    throw new ExchangeAuthenticationError(
      exchange,
      new Error(`Invalid credentials format for ${exchange}: ${message}`)
    );
  }
};
