import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
export const COOKIE_NAME = 'urbano_pay';
export const SESSION_SECONDS = 30 * 60;
export function getSettings() {
 const pin=process.env.URBANO_PAYMENT_PIN||'';
 const secret=process.env.URBANO_SESSION_SECRET||'';
 const data=process.env.URBANO_PAYMENT_ACCOUNTS_JSON||'';
 if (!/^\d{4,12}$/.test(pin)||secret.length<32||!data)return null;
 let accounts;
 try {
  const parsed=JSON.parse(data);
  const allowed=['Yape','Plin','BBVA','BCP','Interbank','Scotiabank'];
  if(!parsed||typeof parsed!=='object'||allowed.some(k=>typeof parsed[k]!=='string'||!/^\d{6,30}$/.test(parsed[k])))return null;
  accounts=Object.fromEntries(allowed.map(k=>[k,parsed[k]]));
 }catch{return null;}
 return{pin,secret,accounts};
}
export function equalPin(candidate,expected){
 if(typeof candidate!=='string')return false;
 const a=createHash('sha256').update(candidate).digest(),b=createHash('sha256').update(expected).digest();
 return timingSafeEqual(a,b);
}
export function signSession(secret,issuedAt=Date.now()){
 const expiry=issuedAt+SESSION_SECONDS*1000,payload='v1.'+expiry;
 const mac=createHmac('sha256',secret).update(payload).digest('base64url');
 return payload+'.'+mac;
}
export function validateSession(cookieHeader,secret,now=Date.now()){
 if(!cookieHeader||!secret)return false;
 const matched=cookieHeader.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+'='));
 if(!matched)return false;
 const found=/^v1\.(\d{13})\.([\w-]{40,50})$/.exec(matched.slice(COOKIE_NAME.length+1));
 if(!found)return false;
 const expiry=Number(found[1]);
 if(!Number.isSafeInteger(expiry)||expiry<now||expiry>now+SESSION_SECONDS*1000)return false;
 const expected=createHmac('sha256',secret).update('v1.'+found[1]).digest('base64url');
 const supplied=Buffer.from(found[2]),correct=Buffer.from(expected);
 return supplied.length===correct.length&&timingSafeEqual(supplied,correct);
}
export function setSecurityHeaders(res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Type','application/json; charset=utf-8');
}
export function sessionCookie(session){
 return COOKIE_NAME+'='+session+'; Path=/; Max-Age='+SESSION_SECONDS+'; HttpOnly; Secure; SameSite=Strict';
}
export function clearSessionCookie(){
 return COOKIE_NAME+'=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict';
}