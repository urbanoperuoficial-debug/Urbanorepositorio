'use strict';
const get=id=>document.getElementById(id);
const form=get('access-form'),checking=get('checking'),redirecting=get('redirecting'),message=get('message'),pin=get('pin'),login=get('login'),openWeb=get('open-web');
async function request(url,opts={}){
 const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});
 return {response,data:await response.json().catch(()=>({}))};
}
function showLogin(text=''){
 checking.hidden=true;redirecting.hidden=true;form.hidden=false;message.textContent=text;
}
async function openCatalog(){
 const {response,data}=await request('/api/cliente-web');
 if(response.status===401)return showLogin();
 if(!response.ok)return showLogin(data.error||'No se pudo verificar el acceso.');
 // Solo seguir el destino oficial que proporciona el servidor.
 if(data.url!=='https://urbanoficialperu.aaaangeldiaz.chatgpt.site/catalogo')
  return showLogin('Enlace no disponible.');
 form.hidden=true;checking.hidden=true;redirecting.hidden=false;
 openWeb.href=data.url;
 // El navegador puede solicitar una confirmación; queda el botón manual.
 window.location.replace(data.url);
}
form.addEventListener('submit',async event=>{
 event.preventDefault();login.disabled=true;message.textContent='';
 try{
  const {response,data}=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pin.value})});
  pin.value='';
  if(!response.ok){
   message.textContent=response.status===429?'Límite de 3 intentos por conexión. Intenta de nuevo más tarde.':(data.error||'No se pudo validar la clave.');
   return;
  }
  await openCatalog();
 }catch{message.textContent='No se pudo conectar. Comprueba tu internet.'}
 finally{login.disabled=false;}
});
pin.addEventListener('input',()=>{pin.value=pin.value.replace(/\D/g,'').slice(0,12);message.textContent=''});
openCatalog().catch(()=>showLogin('No se pudo verificar el acceso.'));
