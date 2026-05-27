/**
 * Rate limiting com sliding window.
 * Usa Upstash Redis se UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN estiverem configurados.
 * Caso contrario, usa Map em memoria (funciona por instancia — adequado para dev e baixo volume).
 *
 * Setup Upstash (gratuito, 10k req/dia):
 *   1. Crie conta em upstash.com
 *   2. Crie um Redis database
 *   3. Adicione ao .env.local:
 *      UPSTASH_REDIS_REST_URL=https://...
 *      UPSTASH_REDIS_REST_TOKEN=AX...
 */

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetIn: number // ms
}

// ── In-memory fallback ──────────────────────────────────────────────
type Bucket = { count: number; resetAt: number }
const store = new Map<string, Bucket>()

function checkInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = store.get(key)
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }
  bucket.count++
  const remaining = Math.max(0, limit - bucket.count)
  return {
    allowed: bucket.count <= limit,
    remaining,
    resetIn: bucket.resetAt - now,
  }
}

// ── Upstash Redis via REST ──────────────────────────────────────────
async function checkUpstash(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  const now = Date.now()

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds, 'NX'],
      ['TTL', key],
    ]),
  })

  if (!res.ok) {
    // Se Redis indisponivel, permite a requisicao (fail open)
    return { allowed: true, remaining: limit, resetIn: windowSeconds * 1000 }
  }

  const data = await res.json()
  const count: number = data[0]?.result ?? 0
  const ttl: number = data[2]?.result ?? windowSeconds

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetIn: ttl * 1000,
  }
}

// ── Interface publica ───────────────────────────────────────────────
export async function rateLimit(
  identifier: string,
  options: { limit: number; windowSeconds: number } = { limit: 10, windowSeconds: 60 }
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = options
  const key = `rl:${identifier}`

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkUpstash(key, limit, windowSeconds)
  }

  return checkInMemory(key, limit, windowSeconds * 1000)
}

// Limites pre-configurados para cada endpoint critico
export const LIMITS = {
  cadastro:  { limit: 5,  windowSeconds: 60 },  // 5 cadastros/min por IP
  contrato:  { limit: 3,  windowSeconds: 60 },  // 3 contratos/min por IP
  quiz:      { limit: 30, windowSeconds: 60 },  // 30 respostas/min por usuario
  login:     { limit: 10, windowSeconds: 60 },  // 10 tentativas/min por IP
  otp:       { limit: 3,  windowSeconds: 300 }, // 3 OTPs por 5 min por usuario
}
