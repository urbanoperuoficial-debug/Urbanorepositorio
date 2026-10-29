import { getSettings, validateSession, signSession, sessionCookie, setSecurityHeaders } from '../lib/security.js';

// Entrada NFC para contacto: si hay sesión válida, abrir directamente la ficha.
// Si no existe sesión, mostrar exclusivamente el formulario de acceso.
export default function handler(req,res){
  setSecurityHeaders(res);
  if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
  const settings=getSettings();
  if(!settings)return res.status(503).json({error:'Portal pendiente de configuración segura'});
  const ok=validateSession(req.headers.cookie,settings.secret);
  if(ok)res.setHeader('Set-Cookie',sessionCookie(signSession(settings.secret)));
  res.setHeader('Location',ok?'/api/contacto-vcf':'/contacto.html');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  return res.status(302).end();
}
