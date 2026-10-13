/* ===== YFM Finance: DRE avançado, fluxo de caixa projetado, importação de extrato e página inicial ===== */
const SCEN={otimista:[10,-5],realista:[0,0],pessimista:[-15,10]};
const keyAt=k=>{const d=new Date();return iso(new Date(d.getFullYear(),d.getMonth()-k,1))};
const mlabel=k=>MON[+keyAt(k).slice(5)-1];
const win=(n,off)=>Array.from({length:n},(_,i)=>keyAt(off+n-1-i));
const pct1=x=>x.toFixed(1).replace('.',',')+'%';
const num2=v=>v.toFixed(2).replace('.',',');
function dl(name,txt,type){const u=URL.createObjectURL(new Blob(['\ufeff'+txt],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}

/* ---------- DRE ---------- */
function dreCalc(keys){const sm=(t,c)=>sum(cur().tx.filter(x=>x.s==='pago'&&x.t===t&&keys.includes(x.d.slice(0,7))&&(!c||x.c===c)).map(x=>x.v));
 const rb=sm('in'),ded=sm('out','Impostos sobre vendas'),cmv=sm('out','CMV'),pes=sm('out','Despesa com pessoal'),adm=sm('out','Despesa administrativa'),fin=sm('out','Despesa financeira');
 const rl=rb-ded,lb=rl-cmv,ro=lb-pes-adm,ll=ro-fin,fx=pes+adm+fin,mcp=rb?(rb-ded-cmv)/rb:0,pe=mcp>0?fx/mcp:null;
 return {rb,ded,cmv,pes,adm,fin,rl,lb,ro,ll,ebitda:ro,fx,mcp,pe,seg:pe!=null&&rb>0?(rb-pe)/rb:null}}
function dreRows(c){return [['Receita bruta',c.rb,'sub'],['(−) Impostos sobre vendas',-c.ded,'ind'],['(=) Receita líquida',c.rl,'sub'],['(−) Custo das mercadorias (CMV)',-c.cmv,'ind'],['(=) Lucro bruto',c.lb,'sub'],['(−) Despesas com pessoal',-c.pes,'ind'],['(−) Despesas administrativas',-c.adm,'ind'],['(=) Resultado operacional (EBIT)',c.ro,'sub'],['(−) Despesas financeiras',-c.fin,'ind'],['(=) Lucro líquido do período',c.ll,'tot']]}
function indicators(c){const rb=c.rb,m=x=>rb?pct1(x/rb*100):'–';
 const k=[['Margem bruta',m(c.lb),'Quanto sobra da receita depois dos impostos e do custo das mercadorias.'],['Margem operacional',m(c.ro),'Resultado das operações, antes das despesas financeiras.'],['Margem líquida',m(c.ll),'Quanto sobra de cada R$ 100 vendidos depois de tudo.'],['EBITDA*',R(c.ebitda),'Resultado operacional (sem depreciação lançada).'],['Ponto de equilíbrio',c.pe!=null?R(c.pe):'–','Receita mínima do período para cobrir os custos fixos.'],['Margem de segurança',c.seg!=null?pct1(c.seg*100):'–','Quanto a receita pode cair antes de dar prejuízo.']];
 return `<div class="grid4" style="margin-top:16px">${k.map(([l,v,h])=>`<div class="card kpi"><small>${l}</small><div class="v num">${v}</div><span class="sub">${h}</span></div>`).join('')}</div>`}
function waterfall(c){if(!c.rb)return '<div class="empty">Sem receita no período para montar o gráfico.</div>';
 let run=0;const bars=[['Receita',c.rb],['Impostos',-c.ded],['CMV',-c.cmv],['Pessoal',-c.pes],['Adm.',-c.adm],['Financ.',-c.fin],['Lucro',c.ll]].map(([l,v])=>{let a,b;if(l==='Receita'){a=0;b=v;run=v}else if(l==='Lucro'){a=0;b=v}else{a=run;b=run+v;run=b}
  return{l,v,lo:Math.min(a,b),hi:Math.max(a,b),k:l==='Receita'?'#111':l==='Lucro'?(v>=0?'#0e9f6e':'#e5484d'):'#e5484d'}});
 const mx=Math.max(...bars.map(x=>x.hi),1),mn=Math.min(...bars.map(x=>x.lo),0),W=700,H=260,pl=10,pt=24,pb=30,ih=H-pt-pb,y=v=>pt+ih-(v-mn)/(mx-mn)*ih,gw=(W-2*pl)/bars.length,bw=Math.min(54,gw*.6);
 return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico em cascata: da receita ao lucro"><line x1="${pl}" x2="${W-pl}" y1="${y(0)}" y2="${y(0)}" stroke="#ccc"/>${bars.map((b,i)=>{const x=pl+i*gw+(gw-bw)/2,y1=y(b.hi),h=Math.max(2,y(b.lo)-y1);return `<rect x="${x}" y="${y1}" width="${bw}" height="${h}" rx="4" fill="${b.k}"><title>${b.l}: ${R(b.v)}</title></rect><text x="${x+bw/2}" y="${y1-6}" text-anchor="middle" font-size="11" font-weight="700" fill="#111">${R0(Math.abs(b.v))}</text><text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="12" fill="#6b6b6b">${b.l}</text>`}).join('')}</svg>`}
function dreView(){const n=st.n,c=dreCalc(win(n,0)),p=dreCalc(win(n,n)),cr=dreRows(c),pr=dreRows(p),rb=c.rb;
 const vr=(a,b,ind)=>b?(ind?(Math.abs(a)-Math.abs(b))/Math.abs(b):(a-b)/Math.abs(b))*100:null,label=n===1?mlabel(0):mlabel(n-1)+' a '+mlabel(0);
 return `<div class="head"><div><h1>DRE</h1><p class="sub">Demonstração do Resultado do Exercício · ${esc(cur().name)} · ${label}</p></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div class="seg" role="group" aria-label="Período">${[[1,'Este mês'],[3,'3 meses'],[6,'6 meses']].map(([k,t])=>`<button data-n="${k}" class="${st.n===k?'on':''}">${t}</button>`).join('')}</div><button class="btn o sm" data-act="csvdre">Planilha (CSV)</button><button class="btn sm" data-act="print">Exportar PDF</button></div></div>
 <section class="card scroll"><table><thead><tr><th>Conta</th><th class="r">Valor</th><th class="r">% da receita (vertical)</th><th class="r">Período anterior</th><th class="r">Variação (horizontal)</th></tr></thead><tbody>
 ${cr.map(([nm,v,k],i)=>`<tr class="${k==='ind'?'':k}"><td class="${k==='ind'?'ind':''}">${nm}</td><td class="r num ${v<0?'out':k==='tot'?(v>=0?'in':'out'):''}">${R(v)}</td><td class="r num">${rb?pct1(v/rb*100):'0,0%'}</td><td class="r num">${R(pr[i][1])}</td><td class="r">${chip(vr(v,pr[i][1],k==='ind'),k==='ind')}</td></tr>`).join('')}</tbody></table></section>
 ${indicators(c)}
 <section class="card" style="margin-top:16px"><h2>Da receita ao lucro</h2><p class="sub">Gráfico em cascata do período</p>${waterfall(c)}</section>
 <p class="note">Estrutura conforme a Lei 6.404/76, calculada a partir dos lançamentos pagos (regime de caixa). Período anterior = mesmo número de meses imediatamente antes. *O EBITDA é igual ao resultado operacional porque o sistema não registra depreciação.</p>`}
function csvDre(){const n=st.n,a=dreRows(dreCalc(win(n,0))),b=dreRows(dreCalc(win(n,n)));return [['Conta','Valor','Período anterior'],...a.map((r,i)=>[r[0],num2(r[1]),num2(b[i][1])])].map(r=>r.join(';')).join('\n')}

/* ---------- Fluxo de caixa ---------- */
function dfcData(){const p=st.pj||(st.pj={n:6,e:0,s:0,sc:'realista'}),co=cur();
 let ac=(co.s0||0)+sum(co.tx.filter(x=>x.s==='pago'&&x.d.slice(0,7)<KEYS[0]).map(x=>x.t==='in'?x.v:-x.v));
 const hist=KEYS.map((k,i)=>{ac+=IN[i]-OUT[i];return{m:M[i],i:IN[i],o:OUT[i],s:ac}});
 const avg=a=>sum(a)/a.length,ai=avg(IN.slice(-3)),ao=avg(OUT.slice(-3));let s=SALDO;
 const proj=Array.from({length:p.n},(_,i)=>{const e=ai*(1+p.e/100),o=ao*(1+p.s/100);s+=e-o;return{m:mlabel(-(i+1)),i:e,o,s}});
 const rec=sum(co.tx.filter(x=>x.t==='in'&&x.s==='pendente').map(x=>x.v)),pag=sum(co.tx.filter(x=>x.t==='out'&&x.s==='pendente').map(x=>x.v)),burn=ao-ai;
 return {p,hist,proj,rec,pag,burn,runway:burn>0?SALDO/burn:null,cg:SALDO+rec-pag,neg:proj.find(x=>x.s<0)}}
function dfcChart(h,pr){const pts=[...h.map(x=>x.s),...pr.map(x=>x.s)],lb=[...h.map(x=>x.m),...pr.map(x=>x.m)],N=pts.length,W=700,H=250,pl=62,pr2=12,pt=14,pb=28,ih=H-pt-pb;
 const mn=Math.min(0,...pts),mx=Math.max(1,...pts),x=i=>pl+i*(W-pl-pr2)/(N-1),y=v=>pt+ih-(v-mn)/(mx-mn)*ih,ln=a=>a.map(i=>x(i).toFixed(1)+','+y(pts[i]).toFixed(1)).join(' ');
 const hi=[...Array(h.length).keys()],pi=[h.length-1,...pr.map((_,i)=>h.length+i)];
 return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Saldo de caixa realizado e projetado">${[0,1,2,3].map(k=>{const v=mn+(mx-mn)*k/3;return `<line x1="${pl}" x2="${W-pr2}" y1="${y(v)}" y2="${y(v)}" stroke="#ececec"/><text x="${pl-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#6b6b6b">${R0(v)}</text>`}).join('')}<line x1="${pl}" x2="${W-pr2}" y1="${y(0)}" y2="${y(0)}" stroke="#999"/>
 <polyline points="${ln(hi)}" fill="none" stroke="#111" stroke-width="3"/><polyline points="${ln(pi)}" fill="none" stroke="#d9a400" stroke-width="3" stroke-dasharray="7 5"/>
 ${pts.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${i<h.length?'#111':v<0?'#e5484d':'#FFC800'}"><title>${lb[i]}: ${R(v)}</title></circle>`).join('')}${lb.map((l,i)=>`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="${N>12?10:12}" fill="#6b6b6b">${l}</text>`).join('')}</svg>`}
function dfcView(){const d=dfcData(),p=d.p,sc=k=>`<button class="btn sm ${p.sc===k?'':'o'}" data-act="sc" data-sc="${k}">${k[0].toUpperCase()+k.slice(1)}</button>`;
 const kp=[['Saldo atual',R(SALDO),'Entradas pagas menos saídas pagas.'],['Capital de giro',R(d.cg),'Saldo + a receber − a pagar.'],['Queima mensal',d.burn>0?R(d.burn):'Caixa positivo','Média de saídas menos entradas (3 meses).'],['Fôlego do caixa',d.runway!=null?d.runway.toFixed(1).replace('.',',')+' meses':'Sem queima','Quantos meses o saldo atual dura no ritmo atual.']];
 return `<div class="head"><div><h1>Fluxo de caixa</h1><p class="sub">Realizado e projetado · ${esc(cur().name)}</p></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn o sm" data-act="csvfluxo">Planilha (CSV)</button><button class="btn sm" data-act="print">Exportar PDF</button></div></div>
 ${d.neg?`<div class="demo" style="background:#fde8e9;border-color:#f3b4b7"><b>Atenção:</b> neste cenário o saldo fica negativo em ${d.neg.m}. Reveja gastos ou antecipe recebimentos.</div>`:''}${d.cg<0?'<div class="demo" style="background:#fde8e9;border-color:#f3b4b7"><b>Atenção:</b> as contas a pagar são maiores que o saldo mais o que há a receber.</div>':''}
 <div class="grid4" style="grid-template-columns:repeat(4,1fr)">${kp.map(([l,v,h])=>`<div class="card kpi"><small>${l}</small><div class="v num" style="font-size:22px">${v}</div><span class="sub">${h}</span></div>`).join('')}</div>
 <section class="card"><h2>Projeção de caixa</h2><p class="sub">Parte da média dos últimos 3 meses, ajustada pelo cenário. É uma estimativa, não uma garantia.</p>
 <div class="sc" style="margin:12px 0">${sc('otimista')}${sc('realista')}${sc('pessimista')}<span class="sub" style="align-self:center">${p.sc==='personalizado'?'Cenário personalizado':''}</span></div>
 <div class="g3"><div><label class="f" for="pe">Entradas: ${p.e>0?'+':''}${p.e}%</label><input id="pe" type="range" min="-30" max="30" step="5" value="${p.e}"></div><div><label class="f" for="ps">Saídas: ${p.s>0?'+':''}${p.s}%</label><input id="ps" type="range" min="-30" max="30" step="5" value="${p.s}"></div><div><label class="f">Horizonte</label><div class="seg">${[3,6,12].map(k=>`<button data-act="pn" data-pn="${k}" class="${p.n===k?'on':''}">${k} meses</button>`).join('')}</div></div></div>
 <div class="leg"><span><i style="background:#111"></i>Realizado</span><span><i style="background:#d9a400"></i>Projetado</span></div>${dfcChart(d.hist,d.proj)}</section>
 <section class="card scroll" style="margin-top:16px"><h2>Fluxo mês a mês (método direto)</h2><table><thead><tr><th>Mês</th><th></th><th class="r">Entradas</th><th class="r">Saídas</th><th class="r">Resultado</th><th class="r">Saldo</th></tr></thead><tbody>
 ${d.hist.map(x=>`<tr><td>${x.m}</td><td><span class="pill pago">Realizado</span></td><td class="r num in">${R(x.i)}</td><td class="r num out">${R(x.o)}</td><td class="r num">${R(x.i-x.o)}</td><td class="r num"><b>${R(x.s)}</b></td></tr>`).join('')}
 ${d.proj.map(x=>`<tr style="background:#fffbe6"><td>${x.m}</td><td><span class="pill pendente">Projetado</span></td><td class="r num in">${R(x.i)}</td><td class="r num out">${R(x.o)}</td><td class="r num">${R(x.i-x.o)}</td><td class="r num ${x.s<0?'out':''}"><b>${R(x.s)}</b></td></tr>`).join('')}</tbody></table></section>
 <p class="note">Contas já cadastradas: a receber ${R(d.rec)} e a pagar ${R(d.pag)}. Atividades de investimento e financiamento ainda não são separadas nos lançamentos, então o fluxo mostra todas as entradas e saídas pagas. Prazos médios de recebimento e pagamento exigem notas e vencimentos por cliente e fornecedor e ainda não estão disponíveis.</p>`}
function csvFluxo(){const d=dfcData();return [['Tipo','Mês','Entradas','Saídas','Saldo'],...d.hist.map(x=>['Realizado',x.m,num2(x.i),num2(x.o),num2(x.s)]),...d.proj.map(x=>['Projetado',x.m,num2(x.i),num2(x.o),num2(x.s)])].map(r=>r.join(';')).join('\n')}

/* ---------- Importação de extrato (OFX / CSV) ---------- */
function parseExtrato(txt){const out=[];
 if(/<STMTTRN>/i.test(txt)){txt.split(/<STMTTRN>/i).slice(1).forEach(b=>{const g=t=>{const m=b.match(new RegExp('<'+t+'>([^<\\r\\n]*)','i'));return m?m[1].trim():''};
  const dt=g('DTPOSTED').replace(/\D/g,'').slice(0,8),v=parseFloat(g('TRNAMT').replace(',','.'));
  if(dt.length===8&&isFinite(v)&&v!==0&&Math.abs(v)<1e9)out.push({d:dt.slice(0,4)+'-'+dt.slice(4,6)+'-'+dt.slice(6,8),n:(g('MEMO')||g('NAME')||'Lançamento importado').slice(0,80),v:Math.abs(v),t:v>0?'in':'out'})});return out}
 const lines=txt.replace(/^\ufeff/,'').split(/\r?\n/).filter(l=>l.trim());if(!lines.length)return out;
 const sep=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',',cells=l=>l.split(sep).map(c=>c.trim().replace(/^"|"$/g,''));
 const h=cells(lines[0]),hasH=h.some(c=>/data|date/i.test(c)&&!/\d{2}[\/-]\d{2}/.test(c)),col=(re,fb)=>{const i=hasH?h.findIndex(c=>re.test(c)):-1;return i>=0?i:fb};
 const ci=col(/data|date/i,0),cd=col(/descri|hist|memo|nome/i,1),cv=col(/valor|amount|value/i,2);
 lines.slice(hasH?1:0).forEach(l=>{const c=cells(l);let d=c[ci]||'',m;
  if((m=d.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/)))d=m[3]+'-'+m[2]+'-'+m[1];else if(!/^\d{4}-\d{2}-\d{2}/.test(d))return;d=d.slice(0,10);
  const v=pv((c[cv]||'').replace(/[^\d,.\-]/g,''));if(!isFinite(v)||v===0||Math.abs(v)>=1e9)return;
  out.push({d,n:(c[cd]||'Lançamento importado').slice(0,80),v:Math.abs(v),t:v>0?'in':'out'})});return out}
const dkey=x=>x.d+'|'+x.n+'|'+Math.round(x.v*100)+'|'+x.t;
function impNovos(){const ex=new Set(cur().tx.map(dkey));return (st.imp||[]).filter(x=>!ex.has(dkey(x)))}
function importSection(){const r=st.imp;
 if(!r)return `<section class="card" style="margin-top:16px"><h2>Importar extrato</h2><p class="sub">Envie o extrato do banco em <b>OFX</b> ou <b>CSV</b> (colunas data, descrição e valor). Você confere tudo antes de importar.</p><input type="file" id="ext" accept=".ofx,.csv,.txt" aria-label="Arquivo do extrato"></section>`;
 const ex=new Set(cur().tx.map(dkey)),dup=x=>ex.has(dkey(x)),nv=impNovos().length;
 return `<section class="card scroll" style="margin-top:16px"><h2>Conferir extrato (${r.length} linhas)</h2><p class="sub">${nv} novos lançamentos serão importados como <b>pagos</b>. Linhas que já existem são ignoradas. Ajuste a categoria das despesas.</p><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="r">Valor</th></tr></thead><tbody>${r.slice(0,100).map((x,i)=>`<tr${dup(x)?' style="opacity:.45"':''}><td>${x.d.slice(8)}/${x.d.slice(5,7)}/${x.d.slice(0,4)}</td><td>${esc(x.n)}${dup(x)?' <span class="chip n">já existe</span>':''}</td><td><select class="in2" id="ic_${i}" ${dup(x)?'disabled':''}>${CATS[x.t].map(c=>`<option${c===x.c?' selected':''}>${c}</option>`).join('')}</select></td><td class="r num ${x.t}">${x.t==='in'?'+':'−'} ${R(x.v)}</td></tr>`).join('')}</tbody></table>${r.length>100?'<p class="sub">Mostrando as 100 primeiras linhas; as demais usam a categoria padrão.</p>':''}<div class="tools" style="margin-top:14px"><button class="btn" data-act="doimport">Importar ${nv} lançamentos</button><button class="btn o" data-act="impcancel">Cancelar</button></div></section>`}
document.addEventListener('change',async e=>{const t=e.target;
 if(t.id==='pe'||t.id==='ps'){const p=st.pj||(st.pj={n:6,e:0,s:0,sc:'realista'});p[t.id==='pe'?'e':'s']=+t.value;p.sc='personalizado';render();return}
 if(/^ic_\d+$/.test(t.id)&&st.imp){st.imp[+t.id.slice(3)].c=t.value;return}
 if(t.id==='ext'){const f=t.files&&t.files[0];if(!f)return;if(f.size>2e6)return toast('Arquivo muito grande (máximo 2 MB).');
  const rows=parseExtrato(await f.text());if(!rows.length)return toast('Nenhum lançamento encontrado. Use um extrato OFX ou CSV com data, descrição e valor.');
  st.imp=rows.slice(0,500).map(x=>({...x,c:x.t==='in'?'Receita de vendas':'Despesa administrativa'}));render()}});

/* ---------- Página inicial (antes do login) ---------- */
function landing(){const F=[['DRE automática','Da receita bruta ao lucro líquido, na estrutura da Lei 6.404/76, com comparação com o período anterior.'],['Fluxo de caixa e projeção','Entradas, saídas e saldo mês a mês, com cenários otimista, realista e pessimista.'],['Contas a pagar e a receber','Compromissos e recebimentos pendentes sempre à vista.'],['Indicadores','Margens, EBITDA, ponto de equilíbrio e margem de segurança.'],['Importação de extrato','Traga lançamentos do banco em OFX ou CSV, com conferência antes de importar.'],['Relatórios','Exporte o DRE e o fluxo de caixa em PDF ou planilha.']],
 Q=[['Quem pode ver os dados da minha empresa?','Somente você, com o seu e-mail e a sua senha, e o administrador do sistema. Nenhum outro cliente tem acesso.'],['Preciso entender de contabilidade?','Não. O painel mostra o resultado e o caixa em linguagem simples.'],['Posso alterar os lançamentos?','Os clientes têm acesso de visualização. Os lançamentos são feitos pelo administrador.'],['Como peço o meu acesso?','Fale com o suporte pelo botão abaixo. Você recebe o seu login.'],['Posso testar antes?','Sim. A demonstração usa dados fictícios e não pede cadastro.']];
 return `<header class="ld-h"><div class="ld-w"><div class="logo"><i>YFM</i>Finance</div><div class="ld-nav"><a href="#ld-como">Como funciona</a><a href="#ld-faq">Perguntas</a><button class="btn o sm" data-act="demo">Ver demonstração</button><button class="btn sm" data-act="showlogin">Entrar</button></div></div></header>
 <section class="ld-hero"><div class="ld-w ld-hg"><div><p class="ld-eb">Gestão financeira e contábil</p><h1>Entenda o resultado e o caixa da sua empresa em segundos.</h1><p class="ld-lead">DRE, fluxo de caixa e contas a pagar e a receber, explicados em linguagem simples. Cada cliente tem acesso próprio e vê somente a sua empresa.</p><div class="ld-cta"><button class="btn" data-act="demo">Ver demonstração</button><button class="btn o" data-act="showlogin">Já sou cliente</button></div></div>
 <div class="ld-mock" aria-hidden="true"><div class="ld-m1"><small>Saldo em caixa</small><b>R$ 45.141,00</b></div><div class="ld-m2"><div><small>Entradas</small><b>R$ 20.450,00</b></div><div><small>Resultado</small><b>R$ 5.680,00</b></div></div><div class="ld-bars"><i style="height:62%"></i><i style="height:70%"></i><i style="height:80%"></i><i style="height:92%"></i><i style="height:74%"></i><i style="height:100%"></i></div><small>Dados de demonstração</small></div></div></section>
 <section class="ld-s"><div class="ld-w"><h2>O que você acompanha</h2><div class="ld-g">${F.map(([t,x])=>`<div class="card"><h3>${t}</h3><p>${x}</p></div>`).join('')}</div></div></section>
 <section class="ld-s alt" id="ld-como"><div class="ld-w"><h2>Como funciona</h2><div class="ld-g">${[['Você pede o acesso','Fale com o suporte e receba o seu e-mail e a sua senha.'],['Seus dados são lançados','O administrador cadastra a sua empresa e lança as movimentações.'],['Você acompanha','Entre de qualquer aparelho e veja o DRE e o caixa atualizados.']].map(([t,x],i)=>`<div class="card"><span class="ld-n">${i+1}</span><h3>${t}</h3><p>${x}</p></div>`).join('')}</div></div></section>
 <section class="ld-s"><div class="ld-w"><h2>Seus dados protegidos</h2><ul><li>Cada cliente vê somente a própria empresa, e essa regra é aplicada no banco de dados.</li><li>O administrador usa verificação em duas etapas.</li><li>Lançamentos excluídos vão para uma lixeira e todas as alterações ficam registradas.</li></ul></div></section>
 <section class="ld-s alt" id="ld-faq"><div class="ld-w"><h2>Perguntas frequentes</h2>${Q.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>
 <section class="ld-cta2"><div class="ld-w"><h2>Quer ver o seu resultado com clareza?</h2><div class="ld-cta" style="justify-content:center"><button class="btn" data-act="sup2">Falar com o suporte</button><button class="btn o" data-act="demo">Ver demonstração</button></div></div></section>
 <footer class="ld-f"><div class="ld-w">YFM Finance · Os dados da demonstração são fictícios.</div></footer>`}
