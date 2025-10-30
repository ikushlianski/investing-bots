import type { QueuedRequest, RequestPriority } from './types'
import { PRIORITY_VALUES } from './types'

export class PriorityQueue<T> {
  private queue: Array<QueuedRequest<T>> = []

  enqueue(request: QueuedRequest<T>): void {
    this.queue.push(request)
    this.queue.sort((a, b) => {
      const priorityDiff =
        PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority]

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return a.timestamp - b.timestamp
    })
  }

  dequeue(): QueuedRequest<T> | undefined {
    return this.queue.shift()
  }

  peek(): QueuedRequest<T> | undefined {
    return this.queue[0]
  }

  size(): number {
    return this.queue.length
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }

  clear(): void {
    this.queue = []
  }

  getQueueByPriority(): Record<RequestPriority, number> {
    const counts: Record<RequestPriority, number> = {
      critical: 0,
      high: 0,
      normal: 0,
      low: 0,
    }

    for (const request of this.queue) {
      counts[request.priority]++
    }

    return counts
  }
}
