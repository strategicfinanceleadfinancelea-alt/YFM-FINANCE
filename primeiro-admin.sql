-- Rode DEPOIS de criar o seu usuário em Authentication > Users > Add user.
-- Troque SEU_EMAIL_AQUI pelo e-mail que você usou. Este é o ÚNICO administrador.
insert into profiles (user_id, name, email, role)
select id, 'YFM Finance', email, 'admin'
from auth.users
where email = 'SEU_EMAIL_AQUI'
on conflict (user_id) do update set role = 'admin';
