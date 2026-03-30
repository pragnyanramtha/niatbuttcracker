/**
 * Concurrency limiter using a semaphore pattern.
 * Allows running a maximum number of async operations in parallel.
 */
export class ConcurrencyLimiter {
  private readonly maxConcurrent: number;
  private activeCount: number = 0;
  private queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  /**
   * Execute a function with concurrency control.
   * Waits if max concurrent limit is reached.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      const resolver = this.queue.shift();
      if (resolver) resolver();
    }
  }

  /**
   * Execute an array of async functions with concurrency control.
   * Returns results in the same order as input.
   * Uses Promise.allSettled to continue even if some tasks fail.
   */
  async runAll<T>(fns: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]> {
    return Promise.allSettled(fns.map((fn) => this.run(fn)));
  }
}
