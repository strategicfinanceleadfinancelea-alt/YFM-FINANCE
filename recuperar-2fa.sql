-- SOMENTE se você perder o celular do autenticador do administrador.
-- Remove a verificação em duas etapas dele; no próximo login o site pede para ativar de novo.
-- Troque SEU_EMAIL_AQUI pelo e-mail do administrador e rode no SQL Editor.
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'SEU_EMAIL_AQUI');
