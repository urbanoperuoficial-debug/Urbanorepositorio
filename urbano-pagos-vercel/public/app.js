'use strict';
const $=id=>document.getElementById(id);let accounts=null,current='Yape';
const labels={
Yape:'Copia el número y búscalo como destinatario en Yape. Confirma el nombre antes de autorizar el pago.',
Plin:'Copia el número y búscalo desde tu aplicación con Plin. Confirma el nombre antes de autorizar el pago.',
BBVA:'Copia el número de cuenta BBVA. No es un código interbancario (CCI).',
BCP:'Copia el número de cuenta BCP. No es un código interbancario (CCI).',
Interbank:'Copia el número de cuenta Interbank. No es un código interbancario (CCI).',
Scotiabank:'Copia el número de cuenta Scotiabank. No es un código interbancario (CCI).'};
async function api(url,options={}){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await response.json().catch(()=>({}));return{response,data};}
function showLogin(msg=''){accounts=null;$('panel').hidden=true;$('gate').hidden=false;$('error').textContent=msg;}
function showPayment(method){
 if(!accounts||!(method in accounts))return;current=method;
 $('selected-name').textContent=method;
 $('selected-logo').src='/logos/'+method.toLowerCase()+'.svg';
 $('field-label').textContent=method==='Yape'||method==='Plin'?'Número de celular':'Número de cuenta';
 const number=accounts[method];
 $('account-number').textContent=method==='Yape'||method==='Plin'?number.replace(/^(\d{3})(\d{3})(\d{3})$/,'$1 $2 $3'):number;
 $('hint').textContent=labels[method];$('copy').textContent='Copiar ⧉';
 document.querySelectorAll('.method').forEach(b=>{const selected=b.dataset.method===method;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
}
async function loadPayments(){const{response,data}=await api('/api/payments');if(!response.ok){showLogin(response.status===503?'Portal pendiente de configuración segura.':'');return;}accounts=data.cuentas;$('gate').hidden=true;$('panel').hidden=false;showPayment(current);}
$('access-form').addEventListener('submit',async e=>{e.preventDefault();const pin=$('pin').value;$('error').textContent='';$('login').disabled=true;
 try{const{response,data}=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
 $('pin').value='';if(!response.ok){
 if(response.status===429){
  const mins=Math.max(1,Math.ceil((data.retryAfter||900)/60));
  $('error').textContent='3 intentos agotados. Intenta de nuevo en '+mins+' minuto'+(mins===1?'':'s')+'.';
 } else if(response.status===401 && Number.isInteger(data.remaining)){
  $('error').textContent='Clave incorrecta. Te quedan '+data.remaining+' intento'+(data.remaining===1?'':'s')+'.';
 } else {$('error').textContent=data.error||'No se pudo validar la clave.';}
 return;
}await loadPayments();}
 catch{$('error').textContent='No se pudo conectar con el servidor.'}finally{$('login').disabled=false;}
});
$('pin').addEventListener('input',()=>{$('error').textContent='';});
document.querySelectorAll('.method').forEach(b=>b.addEventListener('click',()=>showPayment(b.dataset.method)));
$('copy').addEventListener('click',async()=>{if(!accounts)return;const value=accounts[current];try{await navigator.clipboard.writeText(value);$('copy').textContent='¡Copiado! ✓';}catch{const t=document.createElement('textarea');t.value=value;document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();$('copy').textContent=ok?'¡Copiado! ✓':'Copia el número';}setTimeout(()=>$('copy').textContent='Copiar ⧉',2200);});
$('logout').addEventListener('click',async()=>{await api('/api/logout',{method:'POST'});showLogin();});
loadPayments().catch(()=>showLogin('No se pudo conectar con el servidor.'));