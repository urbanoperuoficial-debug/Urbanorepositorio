import { createHmac } from 'node:crypto';

export const MAX_ATTEMPTS = 3;
export const LOCK_SECONDS = 15 * 60;

// El conteo reside en Redis (compartido entre todas las funciones de Vercel).
// El script Lua comprueba y registra el intento en una única operación atómica.
const ATOMIC_CHECK = `
local key = KEYS[1]
local correct = ARGV[1] == '1'
local max = tonumber(ARGV[2])
local window = tonumber(ARGV[3])
local count = tonumber(redis.call('GET', key) or '0')
if count >= max then
  return {0, 0, math.max(1, redis.call('TTL', key))}
end
if correct then
  redis.call('DEL', key)
  return {1, max, 0}
end
count = redis.call('INCR', key)
if count == 1 or count == max then redis.call('EXPIRE', key, window) end
return {0, math.max(0, max-count), math.max(1, redis.call('TTL', key))}
`;

export function loginClientIp(headers) {
  // En Vercel, x-forwarded-for es sobrescrito por su proxy (evita suplantación).
  const forwarded = headers?.['x-forwarded-for'];
  if (typeof forwarded !== 'string') return null;
  const ip = forwarded.split(',')[0].trim();
  return ip && ip.length <= 64 && /^[0-9a-fA-F.:]+$/.test(ip) ? ip : null;
}

export function hasRateLimitStorage() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function registerPinAttempt({ ip, correct, secret, fetcher = fetch }) {
  if (!ip || !secret || !hasRateLimitStorage()) throw new Error('Control de intentos no configurado');
  const endpoint = process.env.UPSTASH_REDIS_REST_URL;
  if (!/^https:\/\//.test(endpoint)) throw new Error('Conexión de intentos insegura');
  const key = 'urbano:pagos:pin:' + createHmac('sha256', secret).update(ip).digest('hex');
  const result = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['EVAL', ATOMIC_CHECK, 1, key, correct ? '1' : '0', MAX_ATTEMPTS, LOCK_SECONDS]),
    signal: AbortSignal.timeout(5000)
  });
  if (!result.ok) throw new Error('No se pudo consultar el control de intentos');
  const payload = await result.json();
  const [authorized, remaining, retryAfter] = payload?.result || [];
  if (![authorized, remaining, retryAfter].every(Number.isSafeInteger) || ![0,1].includes(authorized) || remaining < 0 || remaining > MAX_ATTEMPTS || retryAfter < 0) {
    throw new Error('Respuesta inválida del control de intentos');
  }
  return { authorized: authorized === 1, remaining, retryAfter, locked: authorized !== 1 && remaining === 0 };
}
