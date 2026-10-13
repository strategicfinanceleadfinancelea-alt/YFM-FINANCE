# Comece aqui (banco de dados gratuito)

Tudo é gratuito e **não pede cartão**. Siga na ordem. Cada passo leva poucos minutos.

## A. Criar o banco (Supabase)
1. Abra **supabase.com**, clique em **Start your project** e entre com a sua conta do GitHub.
2. **New project**: nome `yfm-finance`, crie uma senha do banco (anote em um papel), região **South America (São Paulo)**, plano **Free**. Clique em **Create new project** e espere 1 a 2 minutos.
3. No menu da esquerda, abra **SQL Editor > New query**. Abra o arquivo `supabase/schema.sql` desta pasta com o Bloco de Notas, copie tudo (Ctrl+A, Ctrl+C), cole no Supabase (Ctrl+V) e clique em **Run**. Tem que aparecer **Success**.

## B. Ajustar o login
4. Menu **Authentication > Sign In / Providers > Email**: deixe **Confirm email DESLIGADO** e coloque **Minimum password length = 12**. Salve.
5. **Authentication > URL Configuration**: em **Site URL**, coloque o endereço do seu site no GitHub (ex.: `https://SEU-USUARIO.github.io/yfm-finance/`).

## C. Criar o seu usuário administrador (só você)
6. **Authentication > Users > Add user > Create new user**: digite o seu e-mail e uma senha **longa que só você saiba** (uma frase de 4 ou 5 palavras com um número serve). Marque **Auto Confirm User** e clique em **Create user**.
7. **SQL Editor > New query**: abra o arquivo `supabase/primeiro-admin.sql`, troque `SEU_EMAIL_AQUI` pelo seu e-mail, cole e clique em **Run**.

## D. Ligar o site ao banco
8. No Supabase, abra **Project Settings > API**. Copie a **Project URL** e a chave **anon public**.
9. No GitHub, abra o arquivo **`config.json`** (é pequeno), clique no lápis e troque `COLE_AQUI_A_URL_DO_SUPABASE` e `COLE_AQUI_A_CHAVE_ANON` pelos dois valores. Clique em **Commit changes**.
   - Use **somente** a chave **anon public**. **Nunca** a `service_role`.

## E. Publicar e usar
10. No GitHub: **Settings > Pages**, branch `main`, pasta `/ (root)`. Abra o endereço do site.
11. Entre com o seu e-mail e a senha. No **primeiro login** o site pede a verificação em duas etapas: instale o **Google Authenticator** (gratuito) no celular, leia o QR code e digite o código de 6 dígitos.
12. Aba **Clientes**: crie a conta do cliente, clique em **Lançar dados** e lance. O cliente entra de qualquer aparelho e **já vê tudo atualizado**, sem você enviar arquivo.

Se algo der erro, me mande um print ou a mensagem exata.
