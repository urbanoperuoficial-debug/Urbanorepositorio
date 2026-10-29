'use strict';
const byId=id=>document.getElementById(id);
const form=byId('access-form'),checking=byId('checking'),redirecting=byId('redirecting'),msg=byId('message'),login=byId('login'),pin=byId('pin');
async function request(url, options={}) {
 const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
 const data=await response.json().catch(()=>({}));
 return {response,data};
}
function presentLogin(message='') {
 checking.hidden=true;redirecting.hidden=true;form.hidden=false;msg.textContent=message;
}
async function openChannel() {
 const {response,data}=await request('/api/channel-mujer');
 if(response.status===401) {presentLogin();return;}
 if(!response.ok) {presentLogin(data.error||'No se pudo verificar el acceso.');return;}
 if(typeof data.url!=='string' || !/^https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9]+$/.test(data.url)) {
  presentLogin('Enlace de canal no disponible.');return;
 }
 checking.hidden=true;form.hidden=true;redirecting.hidden=false;
 window.location.assign(data.url);
}
form.addEventListener('submit',async(event)=>{
 event.preventDefault();
 login.disabled=true;msg.textContent='';
 try{
  const {response,data}=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pin.value})});
  pin.value='';
  if(!response.ok){
   if(response.status===429)msg.textContent='Límite de 3 intentos por conexión. Intenta de nuevo más tarde.';
   else msg.textContent=data.error||'No se pudo validar la clave.';
   return;
  }
  await openChannel();
 }catch{msg.textContent='No se pudo conectar. Comprueba tu internet.'}
 finally{login.disabled=false;}
});
pin.addEventListener('input',()=>{msg.textContent='';pin.value=pin.value.replace(/[^0-9]/g,'').slice(0,12)});
openChannel().catch(()=>presentLogin('No se pudo verificar tu acceso.'));
