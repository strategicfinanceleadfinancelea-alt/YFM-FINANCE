// Edge Function "admin-users": permite ao ADMINISTRADOR (com 2FA) definir a senha de um cliente
// e apagar o login de um cliente. A chave service_role fica só aqui, no servidor (nunca no site).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    const url = Deno.env.get("SUPABASE_URL")!;

    // 1) quem está chamando? precisa estar logado, com 2FA (aal2) e ser administrador
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u, error } = await caller.auth.getUser(token);
    if (error || !u.user) return json({ error: "não autenticado" }, 401);
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.aal !== "aal2") return json({ error: "verificação em duas etapas obrigatória" }, 403);
    const { data: me } = await caller.from("profiles").select("role").eq("user_id", u.user.id).maybeSingle();
    if (me?.role !== "admin") return json({ error: "sem permissão" }, 403);

    // 2) o que pediu?
    const { action, user_id, password } = await req.json();
    if (typeof user_id !== "string" || user_id === u.user.id) return json({ error: "usuário inválido" }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: alvo } = await admin.from("profiles").select("role").eq("user_id", user_id).maybeSingle();
    if (alvo?.role === "admin") return json({ error: "não permitido para administradores" }, 403);

    if (action === "set_password") {
      if (typeof password !== "string" || password.length < 10) return json({ error: "senha muito curta" }, 400);
      const r = await admin.auth.admin.updateUserById(user_id, { password });
      return r.error ? json({ error: r.error.message }, 400) : json({ ok: true });
    }
    if (action === "delete_user") {
      const r = await admin.auth.admin.deleteUser(user_id);
      return r.error ? json({ error: r.error.message }, 400) : json({ ok: true });
    }
    return json({ error: "ação inválida" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
