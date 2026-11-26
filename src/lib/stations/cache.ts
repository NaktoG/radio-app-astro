interface Entry<T> {
  value: T
  savedAt: number
}
/** Bounded process-local cache. Never stores authentication or profile data. */
export class TimedCache<T> {
  private readonly entries = new Map<string, Entry<T>>()
  constructor(
    private readonly capacity: number,
    private readonly now: () => number = Date.now
  ) {}
  get(key: string, maxAge: number): T | undefined {
    const entry = this.entries.get(key)
    return entry && this.now() - entry.savedAt < maxAge ? entry.value : undefined
  }
  set(key: string, value: T): void {
    this.entries.delete(key)
    this.entries.set(key, { value, savedAt: this.now() })
    if (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value
      if (oldest !== undefined) this.entries.delete(oldest)
    }
  }
}
