import { getSettings, validateSession, setSecurityHeaders, signSession, sessionCookie } from '../lib/security.js';

const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbCEzoHLY6dCZgrJTX2k';

export default function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const settings = getSettings();
  if (!settings) return res.status(503).json({ error: 'Portal pendiente de configuración segura' });
  if (!validateSession(req.headers.cookie, settings.secret)) {
    return res.status(401).json({ error: 'Ingresa la clave de URBANO para acceder al canal' });
  }
  // Comparte la misma cookie segura del portal de pagos; renueva su vigencia.
  res.setHeader('Set-Cookie', sessionCookie(signSession(settings.secret)));
  return res.status(200).json({ url: CHANNEL_URL, canal: 'URBANO Perú Oficial HOMBRE 349B' });
}
