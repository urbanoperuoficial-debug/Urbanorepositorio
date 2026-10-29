import { getSettings, validateSession, setSecurityHeaders, signSession, sessionCookie } from '../lib/security.js';

const WHATSAPP_URL = 'https://wa.me/51925374682';

export default function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'GET') return res.status(405).json({error:'Método no permitido'});
  const settings = getSettings();
  if (!settings) return res.status(503).json({error:'Portal pendiente de configuración segura'});
  if (!validateSession(req.headers.cookie, settings.secret)) {
    return res.status(401).json({error:'Ingresa la clave de URBANO para abrir WhatsApp'});
  }
  res.setHeader('Set-Cookie', sessionCookie(signSession(settings.secret)));
  return res.status(200).json({url:WHATSAPP_URL, nombre:'Urbano 349B Markata'});
}
