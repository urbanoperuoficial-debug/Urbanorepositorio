import{getSettings,equalPin,signSession,setSecurityHeaders,sessionCookie}from'../lib/security.js';
export default async function handler(req,res){
 setSecurityHeaders(res);
 if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
 const s=getSettings();if(!s)return res.status(503).json({error:'Portal pendiente de configuración segura'});
 if(Number(req.headers['content-length']||0)>300)return res.status(413).json({error:'Solicitud demasiado grande'});
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch{body=null}}
 if(!body||typeof body!=='object'||!equalPin(body.pin,s.pin))return res.status(401).json({error:'Clave incorrecta'});
 res.setHeader('Set-Cookie',sessionCookie(signSession(s.secret)));
 return res.status(200).json({ok:true});
}