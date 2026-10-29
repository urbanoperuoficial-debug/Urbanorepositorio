import { getSettings, validateSession, signSession, sessionCookie, setSecurityHeaders } from '../lib/security.js';
export default function handler(req,res){
 setSecurityHeaders(res);
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const settings=getSettings();
 if(!settings)return res.status(503).json({error:'Portal pendiente de configuración segura'});
 if(!validateSession(req.headers.cookie,settings.secret))return res.status(401).json({error:'Ingresa la clave de URBANO para guardar el contacto'});
 const lines=['BEGIN:VCARD','VERSION:3.0','N:Markata;Urbano 349B;;;','FN:Urbano 349B Markata','ORG:URBANO','TEL;TYPE=CELL:+51925374682','END:VCARD',''];
 res.setHeader('Content-Type','text/vcard; charset=utf-8');
 res.setHeader('Content-Disposition','attachment; filename="Urbano-349B-Markata.vcf"');
 res.setHeader('Set-Cookie',sessionCookie(signSession(settings.secret)));
 return res.status(200).send(lines.join('\r\n'));
}
