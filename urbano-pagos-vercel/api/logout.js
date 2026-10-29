import{clearSessionCookie,setSecurityHeaders}from'../lib/security.js';
export default function handler(req,res){
 setSecurityHeaders(res);
 if(req.method!=='POST')return res.status(405).json({error:'Método no permitido'});
 res.setHeader('Set-Cookie',clearSessionCookie());
 return res.status(200).json({ok:true});
}