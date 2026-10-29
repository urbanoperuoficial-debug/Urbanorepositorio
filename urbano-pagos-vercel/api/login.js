import { getSettings, equalPin, signSession, setSecurityHeaders, sessionCookie } from '../lib/security.js';

// WAF de Vercel habilitado para /api/login: 3 solicitudes por IP/10 minutos.
// No se acepta iniciar sesión si faltan las variables de servidor.
// Nunca se devuelven cuentas bancarias en este endpoint.
export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
  const settings=getSettings();
  if(!settings)return res.status(503).json({error:'Portal pendiente de configuración segura'});
  if(Number(req.headers['content-length']||0)>300)return res.status(413).json({error:'Solicitud demasiado grande'});
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{body=null}}
  if(!body||typeof body!=='object'||!equalPin(body.pin,settings.pin))
    return res.status(401).json({error:'Clave incorrecta. Verifica los datos e inténtalo nuevamente.'});
  res.setHeader('Set-Cookie',sessionCookie(signSession(settings.secret)));
  return res.status(200).json({ok:true});
}
