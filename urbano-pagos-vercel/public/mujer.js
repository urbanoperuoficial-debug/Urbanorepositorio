'use strict';
const byId = id => document.getElementById(id);
const form = byId('access-form');
const checking = byId('checking');
const redirecting = byId('redirecting');
const msg = byId('message');
const login = byId('login');
const pin = byId('pin');
const openWhatsApp = byId('open-whatsapp');
const openBusiness = byId('open-business');
const openWeb = byId('open-web');
let attemptedAutoOpen = false;
async function request(url, options={}) {
 const response = await fetch(url, {credentials:'same-origin',cache:'no-store',...options});
 const data = await response.json().catch(()=>({}));
 return {response,data};
}
function presentLogin(message='') {
 checking.hidden=true;redirecting.hidden=true;form.hidden=false;msg.textContent=message;
}
function appIntent(channelUrl, packageName) {
 // Android intent:// selecciona expresamente la aplicación; nunca
 // usa una URL de respaldo automática que abra whatsapp.com.
 const safe = new URL(channelUrl);
 return 'intent://' + safe.host + safe.pathname + '#Intent;scheme=https;package=' + packageName + ';end';
}
function presentChannel(channelUrl) {
 // El navegador no puede lanzar apps mediante un redirect sin un gesto del usuario
 // en muchos dispositivos. Conservamos un botón nativo que se toca directamente.
 const idMatch = /^https:\/\/whatsapp\.com\/channel\/([A-Za-z0-9]+)$/.exec(channelUrl);
 if (!idMatch) return presentLogin('Enlace de canal no disponible.');
 const isAndroid = /android/i.test(navigator.userAgent);
 const main = isAndroid ? appIntent(channelUrl,'com.whatsapp') : channelUrl;
 openWhatsApp.href = main;
 openBusiness.hidden = !isAndroid;
 if (isAndroid) openBusiness.href = appIntent(channelUrl,'com.whatsapp.w4b');
 openWeb.href = channelUrl;
 checking.hidden=true;form.hidden=true;redirecting.hidden=false;
 // Primer intento automático: algunos navegadores lo permiten; otros requieren
 // que el cliente pulse el botón. No se redirige automáticamente a la web.
 if (isAndroid && !attemptedAutoOpen) {
  attemptedAutoOpen = true;
  window.location.href = main;
 }
}
async function openChannel() {
 const {response,data} = await request('/api/channel-mujer');
 if (response.status===401) {presentLogin();return;}
 if (!response.ok) {presentLogin(data.error||'No se pudo verificar el acceso.');return;}
 presentChannel(data.url);
}
form.addEventListener('submit',async(event)=>{
 event.preventDefault();
 login.disabled=true;msg.textContent='';
 try{
  const {response,data}=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pin.value})});
  pin.value='';
  if (!response.ok) {
   msg.textContent=response.status===429?'Límite de 3 intentos por conexión. Intenta de nuevo más tarde.':(data.error||'No se pudo validar la clave.');
   return;
  }
  await openChannel();
 }catch{msg.textContent='No se pudo conectar. Comprueba tu internet.'}
 finally{login.disabled=false;}
});
pin.addEventListener('input',()=>{msg.textContent='';pin.value=pin.value.replace(/[^0-9]/g,'').slice(0,12)});
openChannel().catch(()=>presentLogin('No se pudo verificar tu acceso.'));
