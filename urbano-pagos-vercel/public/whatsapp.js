'use strict';
const byId = id => document.getElementById(id);
const form=byId('access-form'),checking=byId('checking'),redirecting=byId('redirecting'),msg=byId('message'),login=byId('login'),pin=byId('pin'),openWhatsApp=byId('open-whatsapp'),openBusiness=byId('open-business'),openWeb=byId('open-web');
let attemptedAutoOpen=false;

async function request(path,options={}) {
 const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
 const data=await response.json().catch(()=>({}));
 return {response,data};
}

function presentLogin(text='') {
 checking.hidden=true;
 redirecting.hidden=true;
 form.hidden=false;
 msg.textContent=text;
}

function makeIntent(number,packageName){
 return 'intent://send?phone='+number+'#Intent;scheme=whatsapp;package='+packageName+';end';
}

function presentChat(url){
 const match=/^https:\/\/wa\.me\/([0-9]{8,15})$/.exec(url);
 if(!match)return presentLogin('El enlace de WhatsApp no está disponible.');
 const number=match[1],isAndroid=/android/i.test(navigator.userAgent);
 const primary=isAndroid?makeIntent(number,'com.whatsapp'):url;
 openWhatsApp.href=primary;
 openBusiness.hidden=!isAndroid;
 if(isAndroid)openBusiness.href=makeIntent(number,'com.whatsapp.w4b');
 openWeb.href=url;
 checking.hidden=true;
 form.hidden=true;
 redirecting.hidden=false;
 // Chrome puede impedir abrir apps tras un fetch. El botón queda disponible
 // para continuar con un gesto directo y no se envía mensaje automáticamente.
 if(isAndroid&&!attemptedAutoOpen){
  attemptedAutoOpen=true;
  window.location.href=primary;
 }
}

async function openChat(){
 const {response,data}=await request('/api/whatsapp-chat');
 if(response.status===401){presentLogin();return;}
 if(!response.ok){presentLogin(data.error||'No se pudo verificar el acceso.');return;}
 presentChat(data.url);
}

form.addEventListener('submit',async(event)=>{
 event.preventDefault();login.disabled=true;msg.textContent='';
 try{
  const {response,data}=await request('/api/login',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pin.value})
  });
  pin.value='';
  if(!response.ok){
   msg.textContent=response.status===429?'Límite de 3 intentos por conexión. Intenta de nuevo más tarde.':(data.error||'No se pudo validar la clave.');
   return;
  }
  await openChat();
 }catch{msg.textContent='No se pudo conectar. Comprueba tu internet.'}
 finally{login.disabled=false;}
});
pin.addEventListener('input',()=>{
 msg.textContent='';
 pin.value=pin.value.replace(/[^0-9]/g,'').slice(0,12);
});
openChat().catch(()=>presentLogin('No se pudo verificar tu acceso.'));
