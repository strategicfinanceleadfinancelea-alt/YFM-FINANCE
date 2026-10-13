// Teste de ponta a ponta com um Supabase simulado: um único administrador cria contas de clientes,
// lança os dados e cada cliente entra (de outro "aparelho") e vê somente a própria empresa, sem editar.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');
const criarMock = require('./mock-supabase');

const base = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const configurado = base.replace('COLE_AQUI_A_URL_DO_SUPABASE', 'https://abcd.supabase.co').replace('COLE_AQUI_A_CHAVE_ANON', 'chave-publica');
const erros = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function abrir(src, mock) {
  const w = new JSDOM(src, {
    runScripts: 'dangerously', url: 'http://localhost/',
    beforeParse(w) {
      Object.defineProperty(w, 'crypto', { value: webcrypto });
      const Real = w.Date, FIXA = '2026-10-12T15:00:00';
      w.Date = class extends Real { constructor(...a) { a.length ? super(...a) : super(FIXA); } static now() { return new Real(FIXA).getTime(); } };
      w.scrollTo = () => {}; w.confirm = () => true; w.open = () => {}; w.prompt = () => null;
      w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = () => {};
      if (mock) w.supabase = { createClient: () => mock.client() };
    }
  }).window;
  w.addEventListener('error', e => erros.push(e.message));
  const $ = s => w.document.querySelector(s);
  return {
    w, $, all: s => [...w.document.querySelectorAll(s)],
    enviar: id => w.document.getElementById(id).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })),
    clicar: s => $(s).dispatchEvent(new w.MouseEvent('click', { bubbles: true })),
    abas: () => [...w.document.querySelectorAll('nav button')].map(b => b.textContent),
    async entrar(email, senha) { if (!$('#login')) this.clicar('[data-act=showlogin]'); $('#us').value = email; $('#pw').value = senha; this.enviar('login'); await sleep(60); },
    async tour() { for (const a of this.abas()) { this.clicar(`[data-v="${a}"]`); await sleep(15); } },
  };
}

let falhas = 0;
const ok = (c, m) => { console.log((c ? 'OK     ' : 'FALHOU ') + m); if (!c) falhas++; };

(async () => {
  // 1) Site sem configuração: só demonstração
  const sem = abrir(base);
  ok(/Entenda o resultado/.test(sem.$('#landing').textContent) && !sem.$('#setup'), 'página inicial aparece primeiro e não existe tela de criar administrador');
  sem.clicar('[data-act=showlogin]'); await sleep(20);
  ok(/ainda não foi configurado/.test(sem.$('#err').textContent), 'sem configuração: o login avisa');
  sem.w.eval("lockView()"); sem.w.eval("showLogin=false;lockView()");
  sem.clicar('[data-act=demo]'); await sleep(40);
  ok(sem.abas().join() === 'Visão geral,Movimentações,DRE,Fluxo de caixa,Contas a pagar,Contas a receber', 'demonstração é somente leitura');

  // DRE avançado (demonstração, data fixa em out/2026)
  sem.clicar('[data-v="DRE"]'); await sleep(20);
  const c = sem.w.eval('dreCalc(win(1,0))');
  ok(Math.abs(c.ll - 5680) < 0.01 && Math.abs(c.rb - 20450) < 0.01, 'DRE: receita R$ 20.450 e lucro líquido R$ 5.680');
  ok(Math.abs(c.pe * c.mcp - c.fx) < 0.01 && c.seg > 0 && c.seg < 1, 'DRE: ponto de equilíbrio cobre os custos fixos');
  ok(/9,9%/.test(sem.$('main').textContent), 'DRE: análise horizontal (receita +9,9% sobre o mês anterior)');
  ok(!!sem.$('svg[aria-label^="Gráfico em cascata"]') && /Margem líquida/.test(sem.$('main').textContent), 'DRE: gráfico em cascata e indicadores');
  ok(/Receita bruta;20450,00;18600,00/.test(sem.w.eval('csvDre()')), 'DRE: exportação em planilha (CSV)');
  ok(/printhead/.test(sem.$('#app').innerHTML), 'DRE: cabeçalho para exportar em PDF (impressão)');

  // Fluxo de caixa projetado e cenários
  sem.clicar('[data-v="Fluxo de caixa"]'); await sleep(20);
  const d0 = sem.w.eval('dfcData()');
  ok(Math.abs(d0.proj[0].s - (45141 + (20450 + 18600 + 20450) / 3 - (13200 + 12850 + 14770) / 3)) < 0.02, 'fluxo: projeção realista = saldo + média de entradas − média de saídas');
  sem.clicar('[data-act=sc][data-sc=pessimista]'); await sleep(20);
  const d1 = sem.w.eval('dfcData()');
  ok(d1.p.e === -15 && d1.p.s === 10 && d1.proj[0].s < d0.proj[0].s, 'fluxo: cenário pessimista reduz o saldo projetado');
  sem.clicar('[data-act=pn][data-pn="12"]'); await sleep(20);
  ok(sem.all('tbody tr').filter(r => /Projetado/.test(r.textContent)).length === 12, 'fluxo: horizonte de 12 meses');
  ok(!!sem.$('svg[aria-label^="Saldo de caixa"]') && /Queima mensal/.test(sem.$('main').textContent), 'fluxo: gráfico e indicadores');

  // Importação de extrato
  const ofx = '<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261005120000[-3:BRT]<TRNAMT>1500.50<MEMO>PIX RECEBIDO MARIA</STMTTRN><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261006<TRNAMT>-320,40<NAME>ENERGIA</STMTTRN></BANKTRANLIST></OFX>';
  const o = sem.w.parseExtrato(ofx);
  ok(o.length === 2 && o[0].t === 'in' && o[0].v === 1500.5 && o[0].d === '2026-10-05' && o[1].t === 'out' && o[1].v === 320.4, 'importação: lê extrato OFX');
  const cs = sem.w.parseExtrato('Data;Descrição;Valor\n05/10/2026;Venda balcão;1.234,56\n06/10/2026;Aluguel;-2.800,00\nlinha inválida');
  ok(cs.length === 2 && cs[0].v === 1234.56 && cs[1].t === 'out' && cs[1].v === 2800, 'importação: lê extrato CSV (data, descrição, valor)');

  // 2) Banco com UM administrador (criado como no primeiro-admin.sql)
  const mock = criarMock();
  mock.db.users.push({ id: 'adm1', email: 'adm@yfm.com', password: 'AdminSegura123' });
  mock.db.profiles.push({ user_id: 'adm1', name: 'YFM Finance', email: 'adm@yfm.com', role: 'admin', company_id: null });

  const v = abrir(configurado, mock);
  ok(!v.$('#setup') && !v.$('#login') && /Entenda o resultado/.test(v.$('#landing').textContent), 'visitante vê a página inicial, sem criar administrador');
  await v.entrar('adm@yfm.com', 'errada'); ok(/incorretos/.test(v.$('#err').textContent), 'senha errada é recusada');

  const adm = abrir(configurado, mock);
  await adm.entrar('adm@yfm.com', 'AdminSegura123'); await sleep(100);
  ok(!!adm.$('#mfa') && !!adm.$('#qr'), 'administrador sem 2FA é obrigado a ativar a verificação em duas etapas');
  const r0 = await adm.w.eval("sb.from('companies').insert({name:'invasor'})");
  ok(r0.error && !mock.db.companies.some(c => c.name === 'invasor'), 'antes do 2FA o administrador não tem poderes no banco');
  adm.$('#mc').value = '000000'; adm.enviar('mfa'); await sleep(60);
  ok(/incorreto/.test(adm.$('#err').textContent), 'código 2FA errado é recusado');
  adm.$('#mc').value = '123456'; adm.enviar('mfa'); await sleep(150);
  ok(adm.abas().includes('Clientes') && adm.abas().includes('Empresas') && adm.abas().includes('Novo lançamento'), 'administrador vê Clientes, Empresas e Novo lançamento');
  ok(mock.db.companies.length === 1, 'empresa inicial criada automaticamente');
  await adm.tour();

  // 3) Administrador cria o cliente (e a empresa dele)
  adm.clicar('[data-v="Clientes"]'); await sleep(20);
  adm.$('#cn').value = 'Juca do Café'; adm.$('#cm').value = 'juca@cafe.com'; adm.$('#cp').value = 'JucaCafe12345'; adm.$('#ce').value = 'new';
  adm.clicar('[data-act=addcli]'); await sleep(150);
  const juca = mock.db.profiles.find(p => p.email === 'juca@cafe.com');
  ok(!!juca && juca.role === 'cliente' && mock.db.companies.some(c => c.id === juca.company_id && c.name === 'Juca do Café'), 'conta do cliente e empresa criadas');
  ok(mock.db.profiles.filter(p => p.role === 'admin').length === 1, 'continua existindo um único administrador');

  // 4) Administrador lança dados na empresa do Juca
  adm.clicar('[data-act=golaunch]'); await sleep(40);
  adm.$('#tn').value = 'Venda de cafés'; adm.$('#tv').value = '1.000,50'; adm.clicar('[data-act=addtx]'); await sleep(150);
  ok(mock.db.transactions.length === 1 && mock.db.transactions[0].company_id === juca.company_id, 'lançamento gravado na empresa certa');

  // 4a) Importar extrato (administrador)
  adm.clicar('[data-v="Novo lançamento"]'); await sleep(20);
  const extra = "st.imp=parseExtrato('Data;Descrição;Valor\\n05/10/2026;Venda balcão;1.234,56\\n06/10/2026;Aluguel;-2.800,00').map(x=>({...x,c:x.t==='in'?'Receita de vendas':'Despesa administrativa'}));render()";
  adm.w.eval(extra); await sleep(20);
  ok(/Conferir extrato/.test(adm.$('main').textContent), 'importação: tela de conferência');
  adm.clicar('[data-act=doimport]'); await sleep(150);
  ok(mock.db.transactions.filter(x => x.company_id === juca.company_id).length === 3, 'importação: lançamentos gravados na empresa certa');
  adm.w.eval(extra); ok(adm.w.eval('impNovos().length') === 0, 'importação: não duplica o que já existe');
  adm.w.eval('st.imp=null');

  // 4b) Lixeira: excluir não apaga de verdade, e o cliente deixa de ver
  adm.clicar('[data-v="Movimentações"]'); await sleep(20);
  adm.clicar('[data-act=deltx]'); await sleep(150);
  ok(mock.db.transactions.length === 3 && mock.db.transactions.filter(x => x.deleted_at).length === 1, 'excluir envia o lançamento para a lixeira (continua no banco)');
  const bk = JSON.parse(adm.w.eval('backupData()'));
  ok(bk.empresas.find(e => e.nome === 'Juca do Café').lixeira.length === 1 && !JSON.stringify(bk).includes('JucaCafe12345'), 'backup inclui a lixeira e não contém senhas');
  mock.db.audit_log.push({ at: new Date().toISOString(), actor: 'adm1', action: 'UPDATE', tabela: 'transactions', row_id: 't', company_id: null, detail: { n: 'Venda de cafés', v: 1000.5, deleted_at: '2026-01-01' } });
  adm.clicar('[data-v="Segurança"]'); await sleep(20);
  adm.clicar('[data-act=restore]'); await sleep(150);
  ok(mock.db.transactions.every(x => !x.deleted_at), 'lançamento restaurado da lixeira');
  ok(/Enviou à lixeira/.test(adm.$('main').textContent), 'histórico de alterações aparece para o administrador');

  // 5) Outra empresa com outros dados (não pode aparecer para o Juca)
  adm.clicar('[data-v="Empresas"]'); await sleep(20);
  adm.$('#new').value = 'Padaria Secreta'; adm.clicar('[data-act=addco]'); await sleep(150);
  const outra = mock.db.companies.find(c => c.name === 'Padaria Secreta');
  adm.w.prompt = () => 'nome errado'; adm.clicar(`[data-act=delco][data-id="${outra.id}"]`); await sleep(100);
  ok(mock.db.companies.some(c => c.id === outra.id), 'excluir empresa exige digitar o nome exato');
  mock.db.transactions.push({ id: 'x1', company_id: outra.id, d: new Date().toISOString().slice(0, 10), n: 'Venda', c: 'Receita de vendas', v: 99999, t: 'in', s: 'pago' });

  const adm2 = abrir(configurado, mock);
  await adm2.entrar('adm@yfm.com', 'AdminSegura123'); await sleep(100);
  ok(!!adm2.$('#mfa') && !adm2.$('#qr'), 'segundo login do administrador pede o código do autenticador');
  adm2.$('#mc').value = '123456'; adm2.enviar('mfa'); await sleep(150);
  ok(adm2.abas().includes('Segurança') && adm2.abas().includes('Clientes'), 'administrador entra com a senha + código');

  // 6) Cliente entra de outro aparelho
  const cli = abrir(configurado, mock);
  await cli.entrar('juca@cafe.com', 'JucaCafe12345'); await sleep(120);
  ok(!cli.$('#mfa'), 'cliente não precisa de 2FA');
  ok(cli.abas().join() === 'Visão geral,Movimentações,DRE,Fluxo de caixa,Contas a pagar,Contas a receber,Minha conta', 'cliente vê só telas de visualização (inclui DRE e fluxo de caixa)');
  ok(Math.abs(cli.w.eval('SALDO') - (1000.5 + 1234.56 - 2800)) < 0.01 && /564,94/.test(cli.$('.hero .big').textContent), 'cliente vê o saldo lançado e importado pelo administrador (R$ -564,94)');
  ok(cli.w.eval('A.co[0].trash.length') === 0 && cli.w.eval('A.audit.length') === 0, 'cliente não vê lixeira nem histórico');
  ok(cli.w.eval('A.co.length') === 1 && cli.w.eval('A.co[0].name') === 'Juca do Café', 'cliente recebe apenas a própria empresa');
  ok(!JSON.stringify(cli.w.eval('A')).includes('99999') && !JSON.stringify(cli.w.eval('A')).includes('Secreta'), 'dados de outras empresas não chegam ao cliente');
  await cli.tour();
  cli.clicar('[data-v="Movimentações"]'); await sleep(20);
  ok(cli.all('[data-act=deltx],[data-act=pay]').length === 0, 'cliente não tem botões de editar');
  // tentativa forçada de editar: o banco recusa (regra de acesso)
  const antes = mock.db.transactions.length;
  const r = await cli.w.eval("sb.from('transactions').insert({company_id:A.co[0].id,d:'2026-01-01',n:'x',c:'CMV',v:1,t:'out',s:'pago'})");
  ok(r.error && mock.db.transactions.length === antes, 'inserção forçada pelo cliente é bloqueada pelo banco');

  // 7) Sem perfil = sem acesso
  mock.db.users.push({ id: 'u9', email: 'intruso@x.com', password: 'Intruso12345' });
  const intr = abrir(configurado, mock);
  await intr.entrar('intruso@x.com', 'Intruso12345'); await sleep(100);
  ok(/não tem acesso liberado/.test(intr.$('#err').textContent) && !!intr.$('#login'), 'conta sem perfil não entra');

  // 7b) Administrador define a senha do cliente (função de servidor)
  adm.clicar('[data-v="Clientes"]'); await sleep(20);
  adm.$('#pwn_' + juca.user_id).value = 'NovaSenha12345'; adm.clicar('[data-act=setpw]'); await sleep(120);
  ok(mock.db.chamadas.some(x => x.body.action === 'set_password' && x.body.user_id === juca.user_id), 'senha do cliente trocada pelo administrador (função de servidor)');
  const novo = abrir(configurado, mock); await novo.entrar('juca@cafe.com', 'NovaSenha12345'); await sleep(120);
  ok(novo.abas().includes('DRE'), 'cliente entra com a nova senha');

  // 8) Administrador remove o acesso
  adm.clicar('[data-v="Clientes"]'); await sleep(20);
  adm.clicar('[data-act=deluser]'); await sleep(150);
  const apos = abrir(configurado, mock);
  await apos.entrar('juca@cafe.com', 'NovaSenha12345'); await sleep(100);
  ok(/não tem acesso liberado/.test(apos.$('#err').textContent), 'acesso removido pelo administrador bloqueia o cliente');

  ok(erros.length === 0, 'nenhum erro de JavaScript' + (erros.length ? ': ' + erros.join('; ') : ''));
  console.log(falhas ? `\n${falhas} falha(s)` : '\nTodos os testes passaram.');
  process.exit(falhas ? 1 : 0);
})();
