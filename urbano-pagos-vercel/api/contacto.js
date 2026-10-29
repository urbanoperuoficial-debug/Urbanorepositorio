import { getSettings, validateSession, signSession, sessionCookie, setSecurityHeaders } from '../lib/security.js';
export default function handler(req,res) {
 setSecurityHeaders(res);
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const settings=getSettings();
 if(!settings)return res.status(503).json({error:'Portal pendiente de configuración segura'});
 if(!validateSession(req.headers.cookie,settings.secret))return res.status(401).json({error:'Ingresa la clave de URBANO para guardar el contacto'});
 res.setHeader('Set-Cookie',sessionCookie(signSession(settings.secret)));
 return res.status(200).json({nombre:'Urbano 349B Markata',telefono:'+51925374682'});
}
