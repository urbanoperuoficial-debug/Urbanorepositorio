import{getSettings,validateSession,setSecurityHeaders}from'../lib/security.js';
export default function handler(req,res){
 setSecurityHeaders(res);
 if(req.method!=='GET')return res.status(405).json({error:'Método no permitido'});
 const s=getSettings();if(!s)return res.status(503).json({error:'Portal pendiente de configuración segura'});
 if(!validateSession(req.headers.cookie,s.secret))return res.status(401).json({error:'Introduce la clave para continuar'});
 return res.status(200).json({titular:'Andrés Díaz',cuentas:s.accounts});
}