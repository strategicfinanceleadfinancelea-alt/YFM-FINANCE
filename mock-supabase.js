// Simula o Supabase em memória (login + tabelas + regras de acesso parecidas com as do schema.sql)
module.exports = function criarMock() {
  const db = { users: [], companies: [], profiles: [], transactions: [], audit_log: [], factors: [], resets: [] };
  let seq = 0; const novoId = () => 'id' + (++seq);
  function client() {
    let session = null;
    const eu = () => session && session.user;
    const perfil = () => db.profiles.find(p => eu() && p.user_id === eu().id);
    const admin = () => !!perfil() && perfil().role === 'admin' && session.aal === 'aal2';
    const minhaEmpresa = () => perfil() && perfil().company_id;
    const pode = (tab, linha, op) => {
      if (admin()) return true;
      if (!eu() || op !== 'select') return false;
      if (tab === 'profiles') return linha.user_id === eu().id;
      if (tab === 'companies') return linha.id === minhaEmpresa();
      if (tab === 'transactions') return linha.company_id === minhaEmpresa() && !linha.deleted_at;
      return false;
    };
    function from(tab) {
      let op = 'select', payload = null, filtros = [], ordem = null, faixa = null, modo = null;
      const q = {
        select() { return q; },
        insert(p) { op = 'insert'; payload = p; return q; },
        update(p) { op = 'update'; payload = p; return q; },
        delete() { op = 'delete'; return q; },
        eq(c, v) { filtros.push([c, v]); return q; },
        order(c, o) { ordem = [c, !(o && o.ascending === false)]; return q; },
        range(a, b) { faixa = [a, b]; return q; },
        single() { modo = 'single'; return q; },
        maybeSingle() { modo = 'maybe'; return q; },
        then(res, rej) { return Promise.resolve(exec()).then(res, rej); },
      };
      function exec() {
        const alvo = db[tab], ok = l => filtros.every(([c, v]) => l[c] === v);
        if (op === 'insert') {
          if (!admin()) return { data: null, error: { message: 'new row violates row-level security policy' } };
          const lista = (Array.isArray(payload) ? payload : [payload]).map(p => { const l = { ...p }; if (tab !== 'profiles') l.id = novoId(); l.created_at = ++seq; alvo.push(l); return l; });
          return { data: modo ? lista[0] : lista, error: null };
        }
        const vis = alvo.filter(l => pode(tab, l, op) && ok(l));
        if (op === 'update') { if (!admin()) return { data: [], error: null }; vis.forEach(l => Object.assign(l, payload)); return { data: vis, error: null }; }
        if (op === 'delete') { if (!admin()) return { data: [], error: null }; vis.forEach(l => alvo.splice(alvo.indexOf(l), 1)); return { data: vis, error: null }; }
        let r = [...vis];
        if (ordem) r.sort((a, b) => (a[ordem[0]] > b[ordem[0]] ? 1 : -1) * (ordem[1] ? 1 : -1));
        if (faixa) r = r.slice(faixa[0], faixa[1] + 1);
        if (modo === 'maybe') return { data: r[0] || null, error: null };
        if (modo === 'single') return r[0] ? { data: r[0], error: null } : { data: null, error: { message: 'no rows' } };
        return { data: r, error: null };
      }
      return q;
    }
    const auth = {
      async signUp({ email, password }) {
        if (db.users.some(u => u.email === email)) return { data: { user: null }, error: { message: 'User already registered' } };
        const u = { id: novoId(), email, password }; db.users.push(u);
        return { data: { user: { id: u.id, email, identities: [{}] }, session: {} }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const u = db.users.find(x => x.email === email && x.password === password);
        if (!u) return { data: {}, error: { message: 'Invalid login credentials' } };
        session = { user: { id: u.id, email }, aal: 'aal1' }; return { data: { user: session.user, session }, error: null };
      },
      async signOut() { session = null; return { error: null }; },
      async updateUser({ password }) { db.users.find(u => u.id === eu().id).password = password; return { data: {}, error: null }; },
      async resetPasswordForEmail(email) { db.resets.push(email); return { data: {}, error: null }; },
      mfa: {
        async getAuthenticatorAssuranceLevel() {
          const ver = db.factors.some(f => f.user_id === eu().id && f.status === 'verified');
          return { data: { currentLevel: session.aal, nextLevel: ver ? 'aal2' : 'aal1' }, error: null };
        },
        async listFactors() { return { data: { totp: db.factors.filter(f => f.user_id === eu().id && f.status === 'verified') }, error: null }; },
        async enroll() { const f = { id: novoId(), user_id: eu().id, status: 'unverified' }; db.factors.push(f); return { data: { id: f.id, totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'ABCDEF' } }, error: null }; },
        async challenge({ factorId }) { return { data: { id: 'ch-' + factorId }, error: null }; },
        async verify({ factorId, code }) {
          if (code !== '123456') return { data: null, error: { message: 'Invalid TOTP code' } };
          db.factors.find(f => f.id === factorId).status = 'verified'; session.aal = 'aal2'; return { data: {}, error: null };
        },
      },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    };
    const functions = { async invoke(nome, { body }) { db.chamadas = db.chamadas || []; db.chamadas.push({ nome, body }); if (nome !== 'admin-users' || !admin()) return { data: null, error: { message: 'forbidden' } }; if (body.action === 'set_password') db.users.find(u => u.id === body.user_id).password = body.password; return { data: { ok: true }, error: null }; } };
    return { from, auth, functions };
  }
  return { db, client };
};
