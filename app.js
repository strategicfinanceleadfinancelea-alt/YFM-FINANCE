const MON=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];let M=[],KEYS=[];
let IN=[],OUT=[];
let SALDO=0;

let TX=[];
const $=s=>document.querySelector(s), sum=a=>a.reduce((x,y)=>x+y,0);
const R=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const R0=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const pc=(a,b)=>b?(a-b)/b*100:null;
const st={view:'Visão geral',n:1,q:''};
const BASE=['Visão geral','Movimentações','DRE','Fluxo de caixa','Contas a pagar','Contas a receber'];
const views=()=>S?[...BASE,...(S.admin?['Novo lançamento','Clientes','Empresas','Segurança']:[]),...(A.tmp?[]:['Minha conta']),]:BASE;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('s');clearTimeout(toast.k);toast.k=setTimeout(()=>t.classList.remove('s'),2600)}
function rng(n){const e=6,s=e-n;return{i:IN.slice(s),o:OUT.slice(s),m:M.slice(s),pi:s-n>=0?IN.slice(s-n,s):null,po:s-n>=0?OUT.slice(s-n,s):null}}
function chip(p,bad){if(p===null)return '<span class="chip n">sem comparação</span>';const up=p>=0,good=bad?!up:up;return `<span class="chip ${Math.abs(p)<.05?'n':good?'g':'r'}">${up?'▲':'▼'} ${Math.abs(p).toFixed(1).replace('.',',')}%</span>`}
function chart(r){
 const W=700,H=250,l=44,b=28,t=10,ih=H-t-b,mx=Math.max(5000,Math.ceil(Math.max(...IN,...OUT)/5000)*5000),gw=(W-l-8)/r.m.length;let s='';
 for(let v=0;v<=mx;v+=mx/5){const y=t+ih-v/mx*ih;s+=`<line x1="${l}" x2="${W-8}" y1="${y}" y2="${y}" stroke="#e6e6e6"/><text x="${l-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#6b6b6b">${Math.round(v/1000)}k</text>`}
 r.m.forEach((m,k)=>{const x=l+k*gw,bw=Math.min(30,gw/3);
  [[r.i[k],'#111','Entradas'],[r.o[k],'#FFC800','Saídas']].forEach(([v,c,n],j)=>{const h=v/mx*ih;s+=`<rect x="${x+gw/2-bw-2+j*(bw+4)}" y="${t+ih-h}" width="${bw}" height="${h}" rx="4" fill="${c}"><title>${m} · ${n}: ${R(v)}</title></rect>`});
  s+=`<text x="${x+gw/2}" y="${H-8}" text-anchor="middle" font-size="12" fill="#6b6b6b">${m}</text>`});
 return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Entradas e saídas por mês">${s}</svg>`}
function overview(){
 const r=rng(st.n),ti=sum(r.i),to=sum(r.o),tn=ti-to,pi=r.pi&&sum(r.pi),po=r.po&&sum(r.po);
 const pn=r.pi?pc(tn,pi-po):null,mg=ti?tn/ti*100:0;
 const pag=TX.filter(x=>x.t==='out'&&x.s==='pendente'),rec=TX.filter(x=>x.t==='in'&&x.s==='pendente');
 const label=st.n===1?M[5]+'/'+KEYS[5].slice(0,4):`Últimos ${st.n} meses`;
 return `<div class="head"><div><h1>Visão geral</h1><p class="sub">${label} · atualizado em ${new Date().toLocaleDateString('pt-BR')}</p></div>
 <div class="seg" role="group" aria-label="Período">${[[1,'Este mês'],[3,'3 meses'],[6,'6 meses']].map(([n,t])=>`<button data-n="${n}" class="${st.n===n?'on':''}">${t}</button>`).join('')}</div></div>
 <section class="hero"><div><small>Saldo em caixa</small><div class="big num">${R(SALDO)}</div></div>
 <div class="side"><div>A receber<b class="num in" style="color:#5fe3b0">${R0(sum(rec.map(x=>x.v)))}</b></div><div>A pagar<b class="num" style="color:#ff8f94">${R0(sum(pag.map(x=>x.v)))}</b></div></div></section>
 <div class="grid4">
 <div class="card kpi"><small>Entradas</small><div class="v num">${R(ti)}</div>${chip(r.pi?pc(ti,pi):null)} <span class="sub">vs. período anterior</span></div>
 <div class="card kpi"><small>Saídas</small><div class="v num">${R(to)}</div>${chip(r.po?pc(to,po):null,true)} <span class="sub">vs. período anterior</span></div>
 <div class="card kpi"><small>Resultado · margem ${mg.toFixed(1).replace('.',',')}%</small><div class="v num">${R(tn)}</div>${chip(pn)} <span class="sub">vs. período anterior</span></div></div>
 <div class="cols"><section class="card"><h2>Fluxo de caixa</h2><p class="sub">Entradas e saídas por mês</p>
 <div class="leg"><span><i style="background:#111"></i>Entradas</span><span><i style="background:#FFC800"></i>Saídas</span></div>${chart(rng(6))}
 <div class="sumrow"><div>Total de entradas · 6 meses<b class="num">${R(sum(IN))}</b></div><div>Resultado acumulado · 6 meses<b class="num">${R(sum(IN)-sum(OUT))}</b></div></div>
 <button class="btn o" id="csv">Exportar CSV</button></section>
 <div class="stack"><section class="card"><h2>Últimas movimentações</h2>${TX.filter(x=>x.s==='pago').slice(0,4).map(row).join('')||'<div class="empty">Nenhum lançamento ainda. '+(S.admin?'Use "Novo lançamento".':'')+'</div>'}<p style="margin:14px 0 0"><button class="btn" data-go="Movimentações">Ver todas</button></p></section></div></div>
 ${cur().demo?'<p class="note">Dados ilustrativos para demonstração. Não representam movimentações reais.</p>':''}`}
function row(x){return `<div class="row"><span class="ic ${x.t}">${x.t==='in'?'+':'−'}</span><div class="t"><b>${x.n}</b><span>${x.d} · ${x.c}</span></div><b class="num ${x.t}">${x.t==='in'?'+':'−'} ${R(x.v)}</b></div>`}
function list(title,items,sub){
 const q=st.q.toLowerCase(),f=items.filter(x=>(x.n+x.c).toLowerCase().includes(q));
 const tot=sum(f.map(x=>x.t==='in'?x.v:-x.v));
 return `<div class="head"><div><h1>${title}</h1><p class="sub">${sub}</p></div></div>
 <div class="tools"><input id="q" placeholder="Buscar por descrição ou categoria" value="${st.q}" aria-label="Buscar"></div>
 <section class="card scroll">${f.length?`<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Status</th><th class="r">Valor</th>${S.admin?'<th></th>':''}</tr></thead><tbody>${f.map(x=>`<tr><td>${x.d}</td><td><b>${x.n}</b></td><td>${x.c}</td><td><span class="pill ${x.s}">${x.s==='pago'?'Pago':'Pendente'}</span></td><td class="r num ${x.t}">${x.t==='in'?'+':'−'} ${R(x.v)}</td>${S.admin?`<td class="r" style="white-space:nowrap">${x.s==='pendente'?`<button class="btn o sm" data-act="pay" data-id="${x.id}">Dar baixa</button> `:''}<button class="btn d sm" data-act="deltx" data-id="${x.id}" aria-label="Excluir lançamento">Excluir</button></td>`:''}</tr>`).join('')}<tr class="tot"><td colspan="4">Total</td><td class="r num">${R(tot)}</td>${S.admin?'<td></td>':''}</tr></tbody></table>`:'<div class="empty">Nenhum lançamento encontrado. Tente outro termo de busca.</div>'}</section>`}
function render(){
 if(!S)return;
 $('#uName').textContent=U().u+(S.admin?' · Administrador':' · '+cur().name);const sel=$('#coSel');sel.hidden=!S.admin;sel.innerHTML=A.co.map(c=>`<option value="${c.id}"${c.id===S.co?' selected':''}>${esc(c.name)}</option>`).join('');
 $('#nav').innerHTML=views().map(v=>`<button class="${v===st.view?'on':''}" data-v="${v}">${v}</button>`).join('');
 const v=st.view;
 $('#app').innerHTML=`<div class="printhead">YFM Finance · ${esc(cur().name)} · ${esc(v)} · gerado em ${new Date().toLocaleDateString('pt-BR')}</div>`+(!S.admin?`<div class="demo">Acesso somente para visualização${cur().snap?' · dados de '+new Date(cur().snap).toLocaleDateString('pt-BR'):''}. Dúvidas? Use o botão Suporte.</div>`:'')+(v==='Visão geral'&&cur().demo?'<div class="demo">Você está vendo <b>dados de demonstração</b>. Os valores são fictícios.</div>':'')+
  (v==='Visão geral'?overview():v==='Movimentações'?list('Movimentações',TX,'Todos os lançamentos da empresa'):v==='DRE'?dreView():v==='Fluxo de caixa'?dfcView():v==='Empresas'&&S.admin?adminView():v==='Segurança'&&S.admin?secView():v==='Minha conta'?acctView():v==='Novo lançamento'&&S.admin?newTxView():v==='Clientes'&&S.admin?clientsView():
  v==='Contas a pagar'?list('Contas a pagar',TX.filter(x=>x.t==='out'&&x.s==='pendente'),'Compromissos pendentes'):
  list('Contas a receber',TX.filter(x=>x.t==='in'&&x.s==='pendente'),'Recebimentos pendentes'));
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-v],[data-n],[data-go],#csv');if(!b)return;
 if(b.dataset.v||b.dataset.go){st.view=b.dataset.v||b.dataset.go;st.q='';scrollTo(0,0)}
 if(b.dataset.n)st.n=+b.dataset.n;
 if(b.id==='csv'){const rows=[['Mês','Entradas','Saídas','Resultado'],...M.map((m,i)=>[m,IN[i],OUT[i],IN[i]-OUT[i]])];
  const u=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.join(';')).join('\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download='yfm-fluxo-de-caixa.csv';a.click();URL.revokeObjectURL(u);toast('Arquivo CSV baixado.');return}
 render()});
document.addEventListener('input',e=>{if(e.target.id==='q'){st.q=e.target.value;const p=e.target.selectionStart;render();const q=$('#q');q.focus();q.setSelectionRange(p,p)}});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
addEventListener('error',e=>{const L=document.getElementById('lock');if(L){L.hidden=false;L.innerHTML='<div class="lk"><h1>Algo deu errado</h1><p class="sub">'+String(e.message).replace(/</g,'&lt;')+'</p><p class="sub">Tire um print desta tela e envie ao suporte.</p></div>'}});
const DEF_MAIL='strategicfinanceleadfinancelea@gmail.com',IDLE=15*60*1000;
const CFG=(()=>{try{return JSON.parse(document.getElementById('cfg').textContent)||{}}catch(e){return{}}})();
const configured=()=>/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(CFG.url||'')&&!!CFG.key&&!/COLE/i.test(CFG.key)&&!!(window.supabase&&window.supabase.createClient);
let A=null,S=null,last=0,fails=0,until=0,sb=null,PEND=null,showLogin=false;
const U=()=>A.us.find(x=>x.id===S.u),cur=()=>A.co.find(c=>c.id===S.co);
const okMail=m=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
const mkClient=main=>window.supabase.createClient(CFG.url,CFG.key,{auth:{persistSession:false,autoRefreshToken:main,detectSessionInUrl:main}});

const CATS={in:['Receita de vendas'],out:['Impostos sobre vendas','CMV','Despesa com pessoal','Despesa administrativa','Despesa financeira']};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
function derive(){const d0=new Date(),co=cur();KEYS=[...Array(6)].map((_,i)=>iso(new Date(d0.getFullYear(),d0.getMonth()-5+i,1)));M=KEYS.map(k=>MON[+k.slice(5)-1]);
 const pg=co.tx.filter(x=>x.s==='pago'),mo=(m,t)=>sum(pg.filter(x=>x.t===t&&x.d.slice(0,7)===m).map(x=>x.v));
 IN=KEYS.map(m=>mo(m,'in'));OUT=KEYS.map(m=>mo(m,'out'));SALDO=(co.s0||0)+sum(pg.map(x=>x.t==='in'?x.v:-x.v));
 TX=[...co.tx].sort((a,b)=>b.d.localeCompare(a.d)).map(x=>({...x,d:x.d.slice(8)+'/'+x.d.slice(5,7)+'/'+x.d.slice(0,4)}))}
function seedCo(id,name,k,demo){const f=v=>Math.round(v*k*100)/100,tx=[];let n=0;
 const add=(d,nm,c,v,t,s)=>{if(v)tx.push({id:id+'_'+(n++),d,n:nm,c,v:f(v),t,s})};
 SB.i.forEach((v,i)=>{const d='2026-'+String(5+i).padStart(2,'0')+'-05';add(d,'Vendas do mês','Receita de vendas',v,'in','pago');
  [['Impostos sobre vendas',.08,'Simples Nacional (DAS)'],['CMV',.42,'Compra de insumos'],['Despesa com pessoal',.28,'Folha de pagamento'],['Despesa administrativa',.14,'Aluguel, energia e outros'],['Despesa financeira',.08,'Tarifas e juros']].forEach(([c,p,nm])=>add(d,nm,c,SB.o[i]*p,'out','pago'))});
 SB.p.forEach(x=>add('2026-10-'+x[0],x[1],x[2],x[3],x[4],'pendente'));
 return {id,name,demo,s0:f(10761),tx}}
const SB={i:[17400,18100,19200,20450,18600,20450],o:[12900,13000,13100,13200,12850,14770],p:[['12','Fornecedor de laticínios','CMV',1320,'out'],['14','Café da manhã corporativo','Receita de vendas',5800,'in'],['15','Folha de pagamento','Despesa com pessoal',6200,'out'],['18','Encomenda de buffet','Receita de vendas',4200,'in'],['20','Simples Nacional (DAS)','Impostos sobre vendas',1650,'out'],['25','Cartão de crédito a receber','Receita de vendas',4300,'in'],['28','Aluguel do ponto','Despesa administrativa',2800,'out']]};
const pv=t=>{t=t.trim();return t.includes(',')?parseFloat(t.replace(/\./g,'').replace(',','.')):parseFloat(t)};
function newTxView(){const t=st.nt||'in',h=new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
 return `<div class="head"><div><h1>Novo lançamento</h1><p class="sub">${esc(cur().name)}</p></div></div><section class="card"><div class="g3">
 <div><label class="f" for="tt">Tipo</label><select class="in2" id="tt"><option value="in"${t==='in'?' selected':''}>Receita (entrada)</option><option value="out"${t==='out'?' selected':''}>Despesa (saída)</option></select></div>
 <div><label class="f" for="tc">Categoria</label><select class="in2" id="tc">${CATS[t].map(c=>`<option>${c}</option>`).join('')}</select></div>
 <div><label class="f" for="tn">Descrição</label><input class="in2" id="tn" maxlength="80" placeholder="Ex.: Venda de bolos"></div>
 <div><label class="f" for="tv">Valor (R$)</label><input class="in2" id="tv" inputmode="decimal" placeholder="1.250,00"></div>
 <div><label class="f" for="td">Data</label><input class="in2" id="td" type="date" value="${h}"></div>
 <div><label class="f" for="ts">Situação</label><select class="in2" id="ts"><option value="pago">Já pago / recebido</option><option value="pendente">Pendente (a pagar / a receber)</option></select></div></div>
 <button class="btn" data-act="addtx">Adicionar lançamento</button></section>${importSection()}`}
function pwErr(p){if(p.length<10)return 'A senha precisa ter pelo menos 10 caracteres.';if(!/[a-zA-Z]/.test(p)||!/\d/.test(p))return 'Use letras e números na senha.';return ''}
function useCo(){st.view='Visão geral';st.q='';derive()}
function enter(u){const admin=u.role==='admin';S={u:u.id,admin,co:admin?A.co[0].id:u.co};useCo();last=Date.now();$('#lock').hidden=true;$('#landing').hidden=true;scrollTo(0,0);render()}
function support(why){const to=CFG.suporte||DEF_MAIL;
 const body=`Olá, preciso de ajuda com o YFM Finance.\n\nAssunto: ${why}\nUsuário: ${S?U().u:'(sem login)'}\n\nPor segurança, não envie senhas neste e-mail.`;
 open('https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(to)+'&su='+encodeURIComponent('Suporte YFM Finance: '+why)+'&body='+encodeURIComponent(body),'_blank','noopener')}
const rows=async q=>{let out=[],i=0;for(;;){const {data,error}=await q().range(i,i+999);if(error)throw error;out=out.concat(data);if(data.length<1000)return out;i+=1000}};
async function loadData(uid,email){
 const {data:pr,error}=await sb.from('profiles').select('*').eq('user_id',uid).maybeSingle();
 if(error||!pr)throw new Error('sem-perfil');
 const admin=pr.role==='admin',getCo=()=>rows(()=>sb.from('companies').select('*').order('created_at'));
 let co=await getCo();
 if(admin&&!co.length){const r=await sb.from('companies').insert({name:'Minha empresa'});if(r.error)throw r.error;co=await getCo()}
 const tx=await rows(()=>sb.from('transactions').select('*').order('d',{ascending:false}));
 const cl=admin?await rows(()=>sb.from('profiles').select('*').eq('role','cliente').order('name')):[];
 const mine=(cid,del)=>tx.filter(x=>x.company_id===cid&&!!x.deleted_at===del).map(x=>({id:x.id,d:x.d,n:x.n,c:x.c,v:Number(x.v),t:x.t,s:x.s}));
 A={co:co.map(c=>({id:c.id,name:c.name,s0:Number(c.s0)||0,tx:mine(c.id,false),trash:mine(c.id,true)})),
  us:[{id:uid,u:pr.name,email,role:admin?'admin':'empresa',co:pr.company_id},...cl.map(p=>({id:p.user_id,u:p.name,email:p.email,role:'empresa',co:p.company_id}))]};
 if(!admin&&!A.co.some(c=>c.id===pr.company_id))throw new Error('sem-empresa');
 A.audit=admin?((await sb.from('audit_log').select('*').order('at',{ascending:false}).range(0,59)).data||[]):[];
 return A.us[0]}
async function refresh(){const keep=S.co,view=st.view,em=U().email;await loadData(S.u,em);S.co=A.co.some(c=>c.id===keep)?keep:A.co[0].id;derive();st.view=view;render()}
async function w(p,ok){const {error}=await p;if(error){toast('Não foi possível salvar: '+error.message);return false}await refresh();if(ok)toast(ok);return true}
async function proceed(user,err){try{
  const me=await sb.from('profiles').select('role').eq('user_id',user.id).maybeSingle();
  if(me.error||!me.data)throw new Error('sem-perfil');
  const {data:aal}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  PEND={uid:user.id,email:user.email};
  if(aal.nextLevel==='aal2'&&aal.currentLevel!=='aal2'){const {data:f}=await sb.auth.mfa.listFactors();PEND.factor=f.totp[0].id;return await mfaView('verify')}
  if(me.data.role==='admin'&&aal.currentLevel!=='aal2')return await mfaView('enroll');
  PEND=null;enter(await loadData(user.id,user.email))
 }catch(x){await sb.auth.signOut();A=null;PEND=null;err(x.message==='sem-perfil'||x.message==='sem-empresa'?'Esta conta ainda não tem acesso liberado. Fale com o suporte.':'Não foi possível carregar os dados. Tente novamente.')}}
async function mfaView(mode){const L=$('#lock'),en=mode==='enroll';L.hidden=false;let qr='',sec='';
 if(en){const {data,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'YFM Finance '+Date.now()});if(error)throw error;PEND.factor=data.id;qr=data.totp.qr_code;sec=data.totp.secret}
 L.innerHTML=`<form class="lk" id="mfa"><div class="logo" style="color:#000"><i>YFM</i>Finance</div><h1>${en?'Ative a verificação em duas etapas':'Digite o código'}</h1><p class="sub">${en?'Obrigatória para o administrador. Leia o QR code no Google Authenticator, Microsoft Authenticator ou Authy e digite o código de 6 dígitos.':'Abra o seu app autenticador e digite o código de 6 dígitos.'}</p>${en?'<img id="qr" alt="QR code para o app autenticador" style="width:180px;height:180px;display:block;margin:14px auto"><div class="pw-h" style="text-align:center">Sem câmera? Digite esta chave no app: <b id="sec"></b></div>':''}<label class="f" for="mc">Código de 6 dígitos</label><input class="in2" id="mc" inputmode="numeric" autocomplete="one-time-code" maxlength="6"><div class="err" id="err" role="alert"></div><button class="btn">Confirmar</button><button type="button" class="lnk" data-act="mfacancel">Cancelar</button></form>`;
 if(en){$('#qr').src=qr;$('#sec').textContent=sec}$('#mc').focus()}
function auditRow(a){const d=a.detail||{};let acao={INSERT:'Criou',UPDATE:'Alterou',DELETE:'Apagou'}[a.action]||a.action;
 if(a.action==='UPDATE'&&d.deleted_at)acao='Enviou à lixeira';else if(a.action==='UPDATE'&&d._antes_na_lixeira&&!d.deleted_at)acao='Restaurou';
 const o=a.tabela==='transactions'?'lançamento "'+(d.n||'')+'" ('+(d.v!=null?R(Number(d.v)):'')+')':a.tabela==='companies'?'empresa "'+(d.name||'')+'"':'acesso de "'+(d.name||d.email||'')+'"';
 return `<tr><td>${new Date(a.at).toLocaleString('pt-BR')}</td><td>${esc((A.us.find(u=>u.id===a.actor)||{}).u||'Administrador')}</td><td>${esc(acao)}</td><td>${esc(o)}</td></tr>`}
function secView(){const co=cur(),tr=co.trash;
 return `<div class="head"><div><h1>Segurança</h1><p class="sub">Backup, lixeira e histórico de alterações · ${esc(co.name)}</p></div><button class="btn" data-act="backup">Baixar backup (JSON)</button></div><div class="adm">
 <section class="card scroll"><h2>Lixeira desta empresa (${tr.length})</h2><p class="sub">Lançamentos excluídos ficam aqui e podem ser restaurados.</p>${tr.length?`<table><thead><tr><th>Data</th><th>Descrição</th><th class="r">Valor</th><th></th></tr></thead><tbody>${tr.map(x=>`<tr><td>${x.d.slice(8)}/${x.d.slice(5,7)}/${x.d.slice(0,4)}</td><td>${esc(x.n)}</td><td class="r num">${R(x.v)}</td><td class="r"><button class="btn o sm" data-act="restore" data-id="${x.id}">Restaurar</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">A lixeira está vazia.</div>'}</section>
 <section class="card scroll"><h2>Histórico de alterações</h2><p class="sub">Registrado automaticamente pelo banco de dados. Não pode ser editado nem apagado pelo site.</p><table><thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Item</th></tr></thead><tbody>${A.audit.map(auditRow).join('')||'<tr><td colspan="4"><div class="empty">Nada registrado ainda.</div></td></tr>'}</tbody></table></section></div>`}
function backupData(){return JSON.stringify({sistema:'YFM Finance',gerado_em:new Date().toISOString(),empresas:A.co.map(c=>({id:c.id,nome:c.name,saldo_inicial:c.s0,lancamentos:c.tx,lixeira:c.trash})),clientes:A.us.filter(u=>u.role==='empresa'&&u.id!==S.u).map(u=>({nome:u.u,email:u.email,empresa_id:u.co}))},null,2)}
function lockView(msg=''){const L=$('#lock');L.hidden=false;S=null;A=null;$('#app').innerHTML='';
 const LD=$('#landing');if(!msg&&!showLogin){L.hidden=true;LD.hidden=false;LD.innerHTML=landing();return}LD.hidden=true;
 const brand='<div class="logo" style="color:#000"><i>YFM</i>Finance</div>';
 L.innerHTML=`<form class="lk" id="login">${brand}<h1>Entrar</h1><p class="sub">Use o e-mail e a senha que o administrador criou para você.</p>
 <label class="f" for="us">E-mail</label><input class="in2" id="us" type="email" maxlength="80" autocomplete="username">
 <label class="f" for="pw">Senha</label><input class="in2" id="pw" type="password" autocomplete="current-password">
 <div class="err" id="err" role="alert">${esc(msg)}</div><button class="btn">Entrar</button>
 <button type="button" class="lnk" data-act="demo">Ver demonstração</button><button type="button" class="lnk" data-act="forgot">Esqueci minha senha</button><button type="button" class="lnk" data-act="sup2">Preciso de ajuda</button></form>`;
 if(!configured()&&!msg)$('#err').textContent='O login ainda não foi configurado neste site. A demonstração continua disponível.';
 $('#us').focus()}
function recoveryView(){const L=$('#lock');L.hidden=false;L.innerHTML=`<form class="lk" id="newpw"><div class="logo" style="color:#000"><i>YFM</i>Finance</div><h1>Nova senha</h1><p class="sub">Escolha uma senha nova para a sua conta.</p>
 <label class="f" for="n1">Nova senha</label><input class="in2" id="n1" type="password" autocomplete="new-password"><div class="pw-h">Mínimo 10 caracteres, com letras e números.</div>
 <label class="f" for="n2">Repita a senha</label><input class="in2" id="n2" type="password" autocomplete="new-password"><div class="err" id="err"></div><button class="btn">Salvar nova senha</button></form>`}
function pwForm(){return `<div class="g3"><input class="in2" id="c0" type="password" placeholder="Senha atual" autocomplete="current-password" aria-label="Senha atual"><input class="in2" id="c1" type="password" placeholder="Nova senha" autocomplete="new-password" aria-label="Nova senha"><input class="in2" id="c2" type="password" placeholder="Repita a nova senha" autocomplete="new-password" aria-label="Repita a nova senha"></div><button class="btn" data-act="chpw">Alterar minha senha</button>`}
function acctView(){const u=U();return `<div class="head"><div><h1>Minha conta</h1><p class="sub">${esc(u.u)} · ${esc(u.email||'')} · ${S.admin?'Administrador, acessa todas as empresas':'Somente visualização de '+esc(cur().name)}</p></div></div><section class="card"><h2>Alterar senha</h2><p class="sub">Mínimo 10 caracteres, com letras e números.</p>${pwForm()}</section>`}
function clientsView(){const cl=A.us.filter(u=>u.role==='empresa'&&u.id!==S.u);
 return `<div class="head"><div><h1>Clientes</h1><p class="sub">Só você cria as contas. Cada cliente entra de qualquer aparelho, vê somente a própria empresa e não pode alterar nada.</p></div></div><div class="adm">
 <section class="card"><h2>Nova conta de cliente</h2><div class="g3"><div><label class="f" for="cn">Nome do cliente</label><input class="in2" id="cn" maxlength="60" placeholder="Ex.: Juca do Café"></div><div><label class="f" for="cm">E-mail de login</label><input class="in2" id="cm" type="email" maxlength="80" placeholder="cliente@email.com"></div><div><label class="f" for="cp">Senha inicial (mín. 10)</label><input class="in2" id="cp" type="password" autocomplete="new-password"></div><div><label class="f" for="ce">Empresa</label><select class="in2" id="ce"><option value="new">Criar empresa nova com esse nome</option>${A.co.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div></div>
 <button class="btn" data-act="addcli">Criar conta do cliente</button><div class="pw-h">Depois, clique em <b>Lançar dados</b> e cadastre as movimentações. O cliente já vê tudo atualizado.</div></section>
 <section class="card"><h2>Contas de clientes (${cl.length})</h2>${cl.length?cl.map(u=>`<div class="ln" style="grid-template-columns:1.3fr 1fr auto"><div><b>${esc(u.u)}</b><br><span class="sub">${esc(u.email||'')}</span><br><span class="chip n" style="margin-top:6px">${esc((A.co.find(c=>c.id===u.co)||{}).name||'sem empresa')}</span></div><div style="display:flex;gap:6px"><input class="in2" id="pwn_${u.id}" type="password" placeholder="Nova senha (mín. 10)" autocomplete="new-password" aria-label="Nova senha de ${esc(u.u)}"><button class="btn sm" data-act="setpw" data-id="${u.id}">Definir</button></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="golaunch" data-id="${u.id}">Lançar dados</button><button class="btn o sm" data-act="resetcli" data-id="${u.id}">Enviar link de nova senha</button><button class="btn d sm" data-act="deluser" data-id="${u.id}">Remover acesso</button></div></div>`).join(''):'<div class="empty">Nenhum cliente ainda. Crie o primeiro acima.</div>'}</section></div>`}
function adminView(){return `<div class="head"><div><h1>Empresas</h1><p class="sub">Cadastre e organize as empresas que você atende.</p></div></div><div class="adm"><section class="card"><h2>Empresas cadastradas</h2>${A.co.map(c=>`<div class="ln" style="grid-template-columns:1fr auto"><input class="in2" id="nm_${c.id}" value="${esc(c.name)}" aria-label="Nome da empresa"><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn o sm" data-act="renco" data-id="${c.id}">Renomear</button><button class="btn d sm" data-act="delco" data-id="${c.id}">Excluir</button></div></div>`).join('')}
 <div class="tools" style="margin:16px 0 0"><input class="in2" id="new" placeholder="Nome da nova empresa" aria-label="Nome da nova empresa" style="flex:1"><button class="btn" data-act="addco">Adicionar empresa</button></div></section>
 <p class="note">Excluir uma empresa apaga os lançamentos dela e deixa sem empresa as contas de clientes ligadas a ela. Para apagar de vez um login, use Authentication &gt; Users no painel do Supabase.</p></div>`}
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target.id,err=m=>{$('#err').textContent=m};
 if(f==='login'){const email=$('#us').value.trim().toLowerCase(),pw=$('#pw').value;
  if(!configured())return err('O login ainda não foi configurado neste site.');
  if(!okMail(email)||!pw)return err('Informe e-mail e senha.');
  if(Date.now()<until)return err('Muitas tentativas. Tente de novo em '+Math.ceil((until-Date.now())/1000)+' s.');
  const {data,error}=await sb.auth.signInWithPassword({email,password:pw});
  if(error){if(++fails>=5){until=Date.now()+30000;fails=0}return err('E-mail ou senha incorretos.')}
  fails=0;await proceed(data.user,err)}
 if(f==='mfa'){const code=$('#mc').value.replace(/\s/g,'');if(!/^\d{6}$/.test(code))return err('Digite os 6 números do código.');
  if(Date.now()<until)return err('Muitas tentativas. Tente de novo em '+Math.ceil((until-Date.now())/1000)+' s.');
  const ch=await sb.auth.mfa.challenge({factorId:PEND.factor});if(ch.error)return err('Não foi possível verificar. Tente de novo.');
  const vr=await sb.auth.mfa.verify({factorId:PEND.factor,challengeId:ch.data.id,code});
  if(vr.error){if(++fails>=5){until=Date.now()+30000;fails=0}return err('Código incorreto.')}
  fails=0;const pd=PEND;PEND=null;
  try{enter(await loadData(pd.uid,pd.email))}catch(x){await sb.auth.signOut();A=null;lockView('Esta conta ainda não tem acesso liberado. Fale com o suporte.')}}
 if(f==='newpw'){const p=$('#n1').value,pe=pwErr(p);if(pe)return err(pe);if(p!==$('#n2').value)return err('As senhas não são iguais.');
  const {error}=await sb.auth.updateUser({password:p});if(error)return err('Não foi possível salvar: '+error.message);await sb.auth.signOut();lockView('Senha alterada. Entre com a nova senha.')}});
document.addEventListener('change',e=>{if(e.target.id==='tt'){st.nt=e.target.value;render();return}
 if(e.target.id==='coSel'&&S&&S.admin&&A.co.some(c=>c.id===e.target.value)){S.co=e.target.value;useCo();render()}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id,v=i=>$('#'+i).value;
 if(a==='demo'){const c=seedCo('c1','Padaria Estrela Ltda',1,true);A={tmp:true,co:[c],us:[{id:'demo',u:'Visitante',role:'empresa',co:'c1'}]};return enter(A.us[0])}
 if(a==='out'){showLogin=false;if(sb&&!(A&&A.tmp))await sb.auth.signOut().catch(()=>{});return lockView()}
 if(a==='sup'||a==='sup2')return support('Dúvida de uso');
 if(a==='showlogin'){showLogin=true;return lockView()}
 if(a==='csvdre'){dl('yfm-dre-'+(cur().name||'empresa').replace(/\W+/g,'-')+'.csv',csvDre(),'text/csv');return toast('Planilha baixada.')}
 if(a==='csvfluxo'){dl('yfm-fluxo-de-caixa.csv',csvFluxo(),'text/csv');return toast('Planilha baixada.')}
 if(a==='print'){window.print();return}
 if(a==='sc'){const q=st.pj||(st.pj={n:6,e:0,s:0,sc:'realista'});q.sc=b.dataset.sc;[q.e,q.s]=SCEN[q.sc];return render()}
 if(a==='pn'){(st.pj||(st.pj={n:6,e:0,s:0,sc:'realista'})).n=+b.dataset.pn;return render()}
 if(a==='mfacancel'){PEND=null;await sb.auth.signOut().catch(()=>{});return lockView()}
 if(a==='forgot'){if(!configured())return;const em=$('#us').value.trim().toLowerCase();if(!okMail(em))return $('#err').textContent='Digite seu e-mail no campo acima e clique de novo.';
  await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});return $('#err').textContent='Se esse e-mail tiver conta, enviamos um link para criar uma nova senha.'}
 if(!S||A.tmp)return;
 const us=A.us.find(x=>x.id===id),co=A.co.find(x=>x.id===id);
 if(a==='chpw'){const em=U().email,{error:e1}=await sb.auth.signInWithPassword({email:em,password:v('c0')});if(e1)return toast('Senha atual incorreta.');
  const pe=pwErr(v('c1'));if(pe)return toast(pe);if(v('c1')!==v('c2'))return toast('As senhas novas não são iguais.');
  const {error}=await sb.auth.updateUser({password:v('c1')});render();return toast(error?'Não foi possível alterar: '+error.message:'Senha alterada.')}
 if(!S.admin)return;
 if(a==='addtx'){const t=v('tt'),n=v('tn').trim(),val=pv(v('tv')),d=v('td'),c=v('tc');
  if(!n)return toast('Informe a descrição.');if(!(val>0&&val<1e9))return toast('Informe um valor maior que zero.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||+d.slice(0,4)<2000||+d.slice(0,4)>2100)return toast('Informe uma data válida.');
  if(!CATS[t]||!CATS[t].includes(c))return toast('Categoria inválida.');
  return void await w(sb.from('transactions').insert({company_id:S.co,d,n,c,v:Math.round(val*100)/100,t,s:v('ts')==='pendente'?'pendente':'pago'}),'Lançamento adicionado.')}
 if(a==='impcancel'){st.imp=null;return render()}
 if(a==='doimport'){const rows=impNovos().map(x=>({company_id:S.co,d:x.d,n:x.n,c:CATS[x.t].includes(x.c)?x.c:CATS[x.t][0],v:Math.round(x.v*100)/100,t:x.t,s:'pago'}));if(!rows.length)return toast('Nada novo para importar.');st.imp=null;return void await w(sb.from('transactions').insert(rows),rows.length+' lançamentos importados.')}
 if(a==='setpw'){const pw=v('pwn_'+id),pe=pwErr(pw);if(pe)return toast(pe);const r=await sb.functions.invoke('admin-users',{body:{action:'set_password',user_id:id,password:pw}});return toast(r.error||(r.data&&r.data.error)?'Não foi possível trocar a senha. A função "admin-users" está instalada? (veja o guia). Alternativa: envie o link por e-mail.':'Senha alterada. Informe a nova senha ao cliente.')}
 if(a==='pay')return void await w(sb.from('transactions').update({s:'pago'}).eq('id',id).eq('company_id',S.co));
 if(a==='deltx'){if(!confirm('Enviar este lançamento para a lixeira? Você poderá restaurá-lo na aba Segurança.'))return;return void await w(sb.from('transactions').update({deleted_at:new Date().toISOString()}).eq('id',id).eq('company_id',S.co),'Enviado para a lixeira.')}
 if(a==='restore')return void await w(sb.from('transactions').update({deleted_at:null}).eq('id',id).eq('company_id',S.co),'Lançamento restaurado.');
 if(a==='backup'){const u=URL.createObjectURL(new Blob([backupData()],{type:'application/json'})),el=document.createElement('a');el.href=u;el.download='yfm-finance-backup-'+new Date().toISOString().slice(0,10)+'.json';el.click();URL.revokeObjectURL(u);return toast('Backup baixado. Guarde em um local seguro.')}
 if(a==='golaunch'){if(!us||!A.co.some(c=>c.id===us.co))return;S.co=us.co;useCo();st.view='Novo lançamento';return render()}
 if(a==='addcli'){const nome=v('cn').trim(),em=v('cm').trim().toLowerCase(),pw=v('cp'),e2=v('ce');
  if(nome.length<3)return toast('Informe o nome do cliente (mínimo 3 letras).');if(!okMail(em))return toast('Informe um e-mail válido.');
  const pe=pwErr(pw);if(pe)return toast(pe);if(A.us.some(x=>(x.email||'')===em))return toast('Já existe uma conta com esse e-mail.');
  if(e2!=='new'&&!A.co.some(c=>c.id===e2))return toast('Escolha uma empresa válida.');
  const {data,error}=await mkClient(false).auth.signUp({email:em,password:pw});
  if(error)return toast(/already/i.test(error.message)?'Esse e-mail já existe no Supabase. Apague-o em Authentication > Users e tente de novo.':'Não foi possível criar: '+error.message);
  if(!data.user||(data.user.identities&&!data.user.identities.length))return toast('Esse e-mail já existe no Supabase. Apague-o em Authentication > Users e tente de novo.');
  let cid=e2;if(e2==='new'){const r=await sb.from('companies').insert({name:nome}).select().single();if(r.error)return toast('Erro ao criar a empresa: '+r.error.message);cid=r.data.id}
  const r2=await sb.from('profiles').insert({user_id:data.user.id,name:nome,email:em,role:'cliente',company_id:cid});
  if(r2.error)return toast('Login criado, mas o acesso não foi liberado: '+r2.error.message);
  await refresh();return toast('Conta do cliente criada.')}
 if(a==='deluser'){if(!us||!confirm('Remover o acesso de "'+us.u+'"? Ele não conseguirá mais ver a empresa.'))return;const okr=await w(sb.from('profiles').delete().eq('user_id',id),'Acesso removido.');if(okr)sb.functions.invoke('admin-users',{body:{action:'delete_user',user_id:id}}).catch(()=>{});return}
 if(a==='resetcli'){if(!us||!us.email)return;const {error}=await sb.auth.resetPasswordForEmail(us.email,{redirectTo:location.origin+location.pathname});return toast(error?'Não foi possível enviar: '+error.message:'Link de nova senha enviado para '+us.email+'.')}
 if(a==='renco'){const n=v('nm_'+id).trim();if(!n)return toast('Informe o nome da empresa.');return void await w(sb.from('companies').update({name:n}).eq('id',id),'Empresa renomeada.')}
 if(a==='delco'){if(A.co.length<2)return toast('Mantenha pelo menos uma empresa.');if(prompt('Isto apaga a empresa e TODOS os lançamentos dela.\nPara confirmar, digite exatamente o nome da empresa:\n'+co.name)!==co.name)return toast('Nome diferente. Nada foi excluído.');return void await w(sb.from('companies').delete().eq('id',id),'Empresa excluída.')}
 if(a==='addco'){const n=v('new').trim();if(!n)return toast('Informe o nome da empresa.');return void await w(sb.from('companies').insert({name:n}),'Empresa adicionada.')}});
['click','keydown','touchstart'].forEach(ev=>addEventListener(ev,()=>{last=Date.now()},{passive:true}));
setInterval(()=>{if(S&&Date.now()-last>IDLE){if(sb&&!(A&&A.tmp))sb.auth.signOut().catch(()=>{});lockView('Sessão encerrada por inatividade.')}},30000);
async function boot(){try{const r=await fetch('config.json',{cache:'no-store'});if(r.ok)Object.assign(CFG,await r.json())}catch(e){}
 if(configured()){sb=mkClient(true);sb.auth.onAuthStateChange(ev=>{if(ev==='PASSWORD_RECOVERY')recoveryView()})}lockView()}
boot();
