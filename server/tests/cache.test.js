const { TTLCache } = require('../lib/cache')

describe('TTLCache', () => {
  test('stores and retrieves a value within its TTL', () => {
    let now = 1000
    const cache = new TTLCache({ defaultTtlMs: 100, clock: () => now })
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
    now = 1050
    expect(cache.get('k')).toBe('v')
  })

  test('expires a value after its TTL', () => {
    let now = 1000
    const cache = new TTLCache({ defaultTtlMs: 100, clock: () => now })
    cache.set('k', 'v')
    now = 1101
    expect(cache.get('k')).toBeUndefined()
  })

  test('getOrLoad runs the loader once and caches the result', async () => {
    const cache = new TTLCache({ defaultTtlMs: 1000 })
    let calls = 0
    const loader = async () => {
      calls += 1
      return 'loaded'
    }
    const a = await cache.getOrLoad('key', loader)
    const b = await cache.getOrLoad('key', loader)
    expect(a).toBe('loaded')
    expect(b).toBe('loaded')
    expect(calls).toBe(1)
  })

  test('getOrLoad shares a single in-flight promise (no stampede)', async () => {
    const cache = new TTLCache({ defaultTtlMs: 1000 })
    let calls = 0
    const loader = () => {
      calls += 1
      return new Promise((resolve) => setTimeout(() => resolve('x'), 20))
    }
    const [a, b] = await Promise.all([
      cache.getOrLoad('k', loader),
      cache.getOrLoad('k', loader),
    ])
    expect(a).toBe('x')
    expect(b).toBe('x')
    expect(calls).toBe(1)
  })

  test('a failing loader is not cached', async () => {
    const cache = new TTLCache({ defaultTtlMs: 1000 })
    await expect(
      cache.getOrLoad('k', async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
    // Next call retries (previous failure was not cached)
    const value = await cache.getOrLoad('k', async () => 'ok')
    expect(value).toBe('ok')
  })

  test('delete and clear remove entries', () => {
    const cache = new TTLCache()
    cache.set('a', 1)
    cache.set('b', 2)
    cache.delete('a')
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    cache.clear()
    expect(cache.get('b')).toBeUndefined()
  })
})
