'use strict';
const $=id=>document.getElementById(id);
const form=$('access-form'),checking=$('checking'),panel=$('contact-panel'),message=$('message'),pin=$('pin'),login=$('login');
let autoAttempted=false;
async function request(url,opts={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opts});const data=await r.json().catch(()=>({}));return{r,data}}
function showLogin(text=''){checking.hidden=true;panel.hidden=true;form.hidden=false;message.textContent=text}
async function showContact(){
 const {r,data}=await request('/api/contacto');
 if(r.status===401){showLogin();return}
 if(!r.ok){showLogin(data.error||'No se pudo comprobar tu acceso.');return}
 checking.hidden=true;form.hidden=true;panel.hidden=false;
 // Un navegador puede impedir un lanzamiento automático; queda un botón para el cliente.
 // El endpoint VCF solo responde si el servidor confirma una sesión auténtica.
 if(!autoAttempted){autoAttempted=true;window.location.assign('/api/contacto-vcf')}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();login.disabled=true;message.textContent='';
 try{
  const {r,data}=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:pin.value})});
  pin.value='';
  if(!r.ok){message.textContent=r.status===429?'Límite de intentos alcanzado. Prueba más tarde.':(data.error||'No se pudo validar la clave.');return}
  await showContact();
 }catch{message.textContent='No se pudo conectar. Revisa tu conexión.'}
 finally{login.disabled=false}
});
pin.addEventListener('input',()=>{pin.value=pin.value.replace(/\D/g,'').slice(0,12);message.textContent=''});
showContact().catch(()=>showLogin('No se pudo comprobar tu acceso.'));
