export class ExchangeError extends Error {
  constructor(
    message: string,
    public readonly exchange: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'ExchangeError'
  }
}

export class ExchangeAuthenticationError extends ExchangeError {
  constructor(exchange: string, originalError?: unknown) {
    super('Authentication failed', exchange, originalError)
    this.name = 'ExchangeAuthenticationError'
  }
}

export class ExchangeNetworkError extends ExchangeError {
  constructor(exchange: string, originalError?: unknown) {
    super('Network request failed', exchange, originalError)
    this.name = 'ExchangeNetworkError'
  }
}

export class ExchangeRateLimitError extends ExchangeError {
  constructor(exchange: string, originalError?: unknown) {
    super('Rate limit exceeded', exchange, originalError)
    this.name = 'ExchangeRateLimitError'
  }
}

export class ExchangeInvalidOrderError extends ExchangeError {
  constructor(exchange: string, reason: string, originalError?: unknown) {
    super(`Invalid order: ${reason}`, exchange, originalError)
    this.name = 'ExchangeInvalidOrderError'
  }
}

export class ExchangeInsufficientBalanceError extends ExchangeError {
  constructor(exchange: string, originalError?: unknown) {
    super('Insufficient balance', exchange, originalError)
    this.name = 'ExchangeInsufficientBalanceError'
  }
}

export class ExchangeOrderNotFoundError extends ExchangeError {
  constructor(exchange: string, orderId: string, originalError?: unknown) {
    super(`Order not found: ${orderId}`, exchange, originalError)
    this.name = 'ExchangeOrderNotFoundError'
  }
}

export class ExchangeTimeoutError extends ExchangeError {
  constructor(exchange: string, originalError?: unknown) {
    super('Request timeout', exchange, originalError)
    this.name = 'ExchangeTimeoutError'
  }
}
