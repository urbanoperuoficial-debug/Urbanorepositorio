import { getSettings, equalPin, signSession, setSecurityHeaders, sessionCookie } from '../lib/security.js';
import { loginClientIp, registerPinAttempt } from '../lib/login-limit.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const settings = getSettings();
  if (!settings) return res.status(503).json({ error: 'Portal pendiente de configuración segura' });
  const length = Number(req.headers['content-length'] || 0);
  if (length > 300) return res.status(413).json({ error: 'Solicitud demasiado grande' });
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const ip = loginClientIp(req.headers);
  if (!ip) return res.status(503).json({ error: 'No se pudo verificar la conexión segura' });
  const correct = !!body && typeof body === 'object' && equalPin(body.pin, settings.pin);
  let attempt;
  try {
    attempt = await registerPinAttempt({ ip, correct, secret: settings.secret });
  } catch {
    // Falla cerrada: no autenticar si Redis no está listo.
    return res.status(503).json({ error: 'Validación no disponible temporalmente' });
  }
  if (attempt.locked) {
    res.setHeader('Retry-After', String(attempt.retryAfter));
    return res.status(429).json({ error: 'Acceso bloqueado por 15 minutos tras 3 intentos fallidos.', remaining: 0, retryAfter: attempt.retryAfter });
  }
  if (!attempt.authorized) return res.status(401).json({ error: 'Clave incorrecta', remaining: attempt.remaining });
  res.setHeader('Set-Cookie', sessionCookie(signSession(settings.secret)));
  return res.status(200).json({ ok: true });
}
