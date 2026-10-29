import { getSettings, validateSession, setSecurityHeaders, signSession, sessionCookie } from '../lib/security.js';

export default function handler(req, res) {
 setSecurityHeaders(res);
 if (req.method !== 'GET') return res.status(405).json({error:'Método no permitido'});
 const settings=getSettings();
 if (!settings) return res.status(503).json({error:'Portal pendiente de configuración segura'});
 if (!validateSession(req.headers.cookie, settings.secret)) return res.status(401).json({error:'Introduce la clave para continuar'});
 // Renueva automáticamente la sesión para que los clientes que regresen en el
 // mismo navegador no necesiten escribir de nuevo el PIN.
 res.setHeader('Set-Cookie', sessionCookie(signSession(settings.secret)));
 return res.status(200).json({titular:'Andrés Díaz', cuentas:settings.accounts});
}
