// Minimal in-process TTL cache. Deliberately not Redis: this is a single-node
// deploy, and the goal is to avoid repeating expensive, rarely-changing reads
// (e.g. Jira field discovery) within a short window. Values are cached in
// memory only, so they reset on restart — which is correct for derived data,
// never for the source of truth (Postgres stays authoritative).

class TTLCache {
  constructor({ defaultTtlMs = 60000, clock = Date.now } = {}) {
    this.store = new Map()
    this.defaultTtlMs = defaultTtlMs
    this.clock = clock
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (this.clock() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.store.set(key, { value, expiresAt: this.clock() + ttlMs })
    return value
  }

  delete(key) {
    return this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  // Cache-aside: return the cached value or run loader() once, cache, and return.
  // Concurrent callers for the same missing key share a single in-flight promise
  // so we never stampede the origin (e.g. duplicate Jira calls under load).
  async getOrLoad(key, loader, ttlMs = this.defaultTtlMs) {
    const cached = this.get(key)
    if (cached !== undefined) return cached

    if (this.store.has(`${key}::inflight`)) {
      return this.store.get(`${key}::inflight`).value
    }

    const promise = Promise.resolve()
      .then(loader)
      .then((value) => {
        this.set(key, value, ttlMs)
        this.store.delete(`${key}::inflight`)
        return value
      })
      .catch((err) => {
        this.store.delete(`${key}::inflight`)
        throw err
      })

    // Store the in-flight promise without a TTL guard so parallel callers reuse it.
    this.store.set(`${key}::inflight`, { value: promise, expiresAt: Infinity })
    return promise
  }
}

module.exports = { TTLCache }
