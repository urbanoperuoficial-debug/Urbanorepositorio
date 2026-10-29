import test from 'node:test';
import assert from 'node:assert/strict';
import { loginClientIp, registerPinAttempt, MAX_ATTEMPTS, LOCK_SECONDS } from './lib/login-limit.js';
process.env.UPSTASH_REDIS_REST_URL='https://redis.test.invalid';
process.env.UPSTASH_REDIS_REST_TOKEN='test-only';
function mockRedis() {
 const state=new Map();
 return async (_url,request)=>{
  const [command,code,n,key,correct,max,seconds]=JSON.parse(request.body);
  assert.equal(command,'EVAL');assert.match(code,/redis\.call\('INCR'/);assert.equal(n,1);
  assert.equal(max,MAX_ATTEMPTS);assert.equal(seconds,LOCK_SECONDS);
  const count=state.get(key)||0;
  let result;
  if(count>=max)result=[0,0,seconds];
  else if(correct==='1'){state.delete(key);result=[1,max,0]}
  else{state.set(key,count+1);result=[0,max-count-1,seconds]}
  return {ok:true,json:async()=>({result})};
 };
}
test('3 errores bloquean incluso una clave correcta; IP independiente',async()=>{
 const fetcher=mockRedis(),secret='long-secret-for-tests',ip='203.0.113.10';
 const args={fetcher,secret,ip};
 assert.equal((await registerPinAttempt({...args,correct:false})).remaining,2);
 assert.equal((await registerPinAttempt({...args,correct:false})).remaining,1);
 assert.equal((await registerPinAttempt({...args,correct:false})).locked,true);
 assert.equal((await registerPinAttempt({...args,correct:true})).authorized,false);
 assert.equal((await registerPinAttempt({...args,ip:'198.51.100.11',correct:true})).authorized,true);
});
test('acierto previo reinicia contador',async()=>{
 const a={fetcher:mockRedis(),secret:'test-secret',ip:'198.51.100.15'};
 await registerPinAttempt({...a,correct:false});
 assert.equal((await registerPinAttempt({...a,correct:true})).authorized,true);
 assert.equal((await registerPinAttempt({...a,correct:false})).remaining,2);
});
test('se exige IP de proxy',()=>{
 assert.equal(loginClientIp({}),null);
 assert.equal(loginClientIp({'x-forwarded-for':'203.0.113.10'}),'203.0.113.10');
});
