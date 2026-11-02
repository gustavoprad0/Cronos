import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/package.json');
const WebSocket = require('ws');
const base = 'http://localhost:3001/api';
let token, machine, automation, socket;
async function request(path, method='GET', body) {
 const r = await fetch(base + path, {method, headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
 const data = await r.json(); if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${data.error}`); return data.data ?? data;
}
function connect(machineName, secret) {
 return new Promise((resolve,reject) => {
  const ws = new WebSocket('ws://localhost:3002/socket.io/?EIO=4&transport=websocket');
  const timer = setTimeout(() => reject(new Error('Socket timeout')),5000);
  ws.on('error',reject);
  ws.on('message', raw => {
   const msg=raw.toString();
   if(msg.startsWith('0')) ws.send('40');
   else if(msg.startsWith('40')) ws.send('42'+JSON.stringify(['register',{machine_name:machineName,secret,client_name:'Teste temporário'}]));
   else if(msg==='2') ws.send('3');
   else if(msg.startsWith('42')) { const [event,data]=JSON.parse(msg.slice(2)); if(event==='auth_success'){clearTimeout(timer);resolve(ws)} else if(event==='auth_error') reject(new Error(data.message)); }
  });
 });
}
try {
 const auth=await request('/auth/login','POST',{email:process.env.CRONOS_TEST_EMAIL || 'admin@cronos.com',password:process.env.CRONOS_TEST_PASSWORD || 'admin123'}); token=auth.token;
 const suffix=Date.now().toString(36);
 machine=await request('/maquinas','POST',{nome:`teste-${suffix}`});
 automation=await request('/automacoes','POST',{nome:`Teste ${suffix}`,caminho_exe:'teste.exe',departamento:'Teste'});
 socket=await connect(machine.nome,machine.secret);
 let done;
 const completed=new Promise(resolve => {done=resolve});
 socket.on('message',raw=>{const msg=raw.toString(); if(!msg.startsWith('42')) return; const [event,data]=JSON.parse(msg.slice(2)); if(event==='start_process') socket.send('42'+JSON.stringify(['process_finished',{automation_id:data.automation_id,status:'sucesso',return_code:0}])); if(event==='historico_updated') done(data);});
 const dispatched=await request('/execucoes/disparar','POST',{automacao_id:automation.id,maquina_id:machine.id});
 const result=await Promise.race([completed,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Finalização não recebida')),5000))]);
 if(result.status !== 'sucesso' || String(result.id)!==String(dispatched.historico.id)) throw new Error('Histórico incorreto');
 const r=await fetch(base+'/execucoes/interromper',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({historico_id:result.id})});
 if(r.status!==409) throw new Error(`Interrupção após conclusão: HTTP ${r.status}`);
 console.log('OK: cadastro, autenticação da máquina, disparo, conclusão e proteção de execução encerrada.');
} finally {
 socket?.close();
 if (automation) await request(`/automacoes/${automation.id}`,'DELETE');
 if (machine) await request(`/maquinas/${machine.id}`,'DELETE');
}
