import { rateLimit } from '@/lib/rate-limit'

// Remove variáveis Upstash para garantir fallback in-memory
delete process.env.UPSTASH_REDIS_REST_URL
delete process.env.UPSTASH_REDIS_REST_TOKEN

const unique = () => `test:${Math.random().toString(36).slice(2)}`

describe('rateLimit (in-memory fallback)', () => {
  it('permite a primeira requisição', async () => {
    const result = await rateLimit(unique(), { limit: 3, windowSeconds: 60 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('permite até o limite e bloqueia na excedente', async () => {
    const key = unique()
    const opts = { limit: 3, windowSeconds: 60 }

    const r1 = await rateLimit(key, opts)
    const r2 = await rateLimit(key, opts)
    const r3 = await rateLimit(key, opts)
    const r4 = await rateLimit(key, opts)

    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
    expect(r3.allowed).toBe(true)
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('retorna resetIn maior que zero', async () => {
    const result = await rateLimit(unique(), { limit: 5, windowSeconds: 30 })
    expect(result.resetIn).toBeGreaterThan(0)
  })

  it('chaves diferentes não interferem entre si', async () => {
    const opts = { limit: 1, windowSeconds: 60 }
    const r1 = await rateLimit(unique(), opts)
    const r2 = await rateLimit(unique(), opts)
    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
  })
})
