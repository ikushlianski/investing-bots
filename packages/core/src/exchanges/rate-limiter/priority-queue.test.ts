import { describe, it, expect, beforeEach } from 'vitest'
import { PriorityQueue } from './priority-queue'
import type { QueuedRequest } from './types'

describe('PriorityQueue', () => {
  let queue: PriorityQueue<string>

  beforeEach(() => {
    queue = new PriorityQueue<string>()
  })

  const createRequest = (
    priority: QueuedRequest<string>['priority'],
    timestamp = Date.now(),
  ): QueuedRequest<string> => ({
    id: `${priority}-${timestamp}`,
    priority,
    weight: 1,
    execute: async () => 'result',
    resolve: () => {},
    reject: () => {},
    timestamp,
  })

  describe('enqueue and dequeue', () => {
    it('should enqueue and dequeue items', () => {
      const request = createRequest('normal')

      queue.enqueue(request)

      expect(queue.size()).toBe(1)
      expect(queue.dequeue()).toBe(request)
      expect(queue.size()).toBe(0)
    })

    it('should return undefined when dequeuing empty queue', () => {
      expect(queue.dequeue()).toBeUndefined()
    })
  })

  describe('priority ordering', () => {
    it('should prioritize critical requests', () => {
      const normal = createRequest('normal')
      const critical = createRequest('critical')
      const high = createRequest('high')

      queue.enqueue(normal)
      queue.enqueue(critical)
      queue.enqueue(high)

      expect(queue.dequeue()).toBe(critical)
      expect(queue.dequeue()).toBe(high)
      expect(queue.dequeue()).toBe(normal)
    })

    it('should use FIFO for same priority', () => {
      const first = createRequest('normal', 1000)
      const second = createRequest('normal', 2000)
      const third = createRequest('normal', 3000)

      queue.enqueue(third)
      queue.enqueue(first)
      queue.enqueue(second)

      expect(queue.dequeue()).toBe(first)
      expect(queue.dequeue()).toBe(second)
      expect(queue.dequeue()).toBe(third)
    })

    it('should handle all priority levels correctly', () => {
      const low = createRequest('low')
      const normal = createRequest('normal')
      const high = createRequest('high')
      const critical = createRequest('critical')

      queue.enqueue(low)
      queue.enqueue(normal)
      queue.enqueue(high)
      queue.enqueue(critical)

      expect(queue.dequeue()).toBe(critical)
      expect(queue.dequeue()).toBe(high)
      expect(queue.dequeue()).toBe(normal)
      expect(queue.dequeue()).toBe(low)
    })
  })

  describe('peek', () => {
    it('should return first item without removing', () => {
      const request = createRequest('normal')

      queue.enqueue(request)

      expect(queue.peek()).toBe(request)
      expect(queue.size()).toBe(1)
    })

    it('should return undefined for empty queue', () => {
      expect(queue.peek()).toBeUndefined()
    })
  })

  describe('size and isEmpty', () => {
    it('should track queue size correctly', () => {
      expect(queue.size()).toBe(0)
      expect(queue.isEmpty()).toBe(true)

      queue.enqueue(createRequest('normal'))

      expect(queue.size()).toBe(1)
      expect(queue.isEmpty()).toBe(false)

      queue.enqueue(createRequest('high'))

      expect(queue.size()).toBe(2)

      queue.dequeue()

      expect(queue.size()).toBe(1)
    })
  })

  describe('clear', () => {
    it('should remove all items', () => {
      queue.enqueue(createRequest('normal'))
      queue.enqueue(createRequest('high'))
      queue.enqueue(createRequest('critical'))

      queue.clear()

      expect(queue.size()).toBe(0)
      expect(queue.isEmpty()).toBe(true)
    })
  })

  describe('getQueueByPriority', () => {
    it('should count items by priority', () => {
      queue.enqueue(createRequest('critical'))
      queue.enqueue(createRequest('critical'))
      queue.enqueue(createRequest('high'))
      queue.enqueue(createRequest('normal'))
      queue.enqueue(createRequest('normal'))
      queue.enqueue(createRequest('normal'))
      queue.enqueue(createRequest('low'))

      const counts = queue.getQueueByPriority()

      expect(counts.critical).toBe(2)
      expect(counts.high).toBe(1)
      expect(counts.normal).toBe(3)
      expect(counts.low).toBe(1)
    })

    it('should return zeros for empty queue', () => {
      const counts = queue.getQueueByPriority()

      expect(counts.critical).toBe(0)
      expect(counts.high).toBe(0)
      expect(counts.normal).toBe(0)
      expect(counts.low).toBe(0)
    })
  })
})
