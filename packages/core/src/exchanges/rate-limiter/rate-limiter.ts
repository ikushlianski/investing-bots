import { TokenBucket } from "./token-bucket";
import { PriorityQueue } from "./priority-queue";
import type {
  RateLimiterConfig,
  RequestPriority,
  RateLimiterStats,
} from "./types";

export interface RateLimiterOptions extends RateLimiterConfig {
  maxQueueSize?: number;
  queueCheckIntervalMs?: number;
}

export class RateLimiter {
  private readonly tokenBucket: TokenBucket;
  private readonly queue: PriorityQueue<unknown>;
  private readonly maxQueueSize: number;
  private readonly queueCheckIntervalMs: number;
  private queueProcessInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(options: RateLimiterOptions) {
    this.tokenBucket = new TokenBucket({
      maxTokens: options.maxTokens,
      refillRate: options.refillRate,
      refillIntervalMs: options.refillIntervalMs,
    });
    this.queue = new PriorityQueue();
    this.maxQueueSize = options.maxQueueSize ?? 1000;
    this.queueCheckIntervalMs = options.queueCheckIntervalMs ?? 100;

    this.startQueueProcessing();
  }

  private startQueueProcessing(): void {
    this.queueProcessInterval = setInterval(() => {
      void this.processQueue();
    }, this.queueCheckIntervalMs);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.isEmpty()) {
      return;
    }

    this.isProcessing = true;

    while (!this.queue.isEmpty()) {
      const request = this.queue.peek();

      if (!request) break;

      if (this.tokenBucket.tryConsume(request.weight)) {
        this.queue.dequeue();

        try {
          const result = await request.execute();

          request.resolve(result);
        } catch (error) {
          request.reject(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      } else {
        break;
      }
    }

    this.isProcessing = false;
  }

  async execute<T>(
    fn: () => Promise<T>,
    priority: RequestPriority = "normal",
    weight = 1
  ): Promise<T> {
    if (this.queue.size() >= this.maxQueueSize) {
      throw new Error(
        `Rate limiter queue is full (max: ${this.maxQueueSize}). Request rejected.`
      );
    }

    return new Promise<T>((resolve, reject) => {
      const request = {
        id: `${Date.now()}-${Math.random()}`,
        priority,
        weight,
        execute: fn,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
      };

      this.queue.enqueue(request);
      void this.processQueue();
    });
  }

  getStats(): RateLimiterStats {
    const bucketStats = this.tokenBucket.getStats();

    return {
      ...bucketStats,
      queueSize: this.queue.size(),
    };
  }

  stop(): void {
    if (this.queueProcessInterval) {
      clearInterval(this.queueProcessInterval);
      this.queueProcessInterval = null;
    }

    this.tokenBucket.stop();
    this.queue.clear();
  }
}
