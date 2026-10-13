# Configurar o login e o banco de dados (Supabase)

Com isso o site passa a ter **um único administrador (você)**, e as contas dos clientes só você cria. Cada cliente entra de qualquer aparelho, vê somente a própria empresa e não consegue alterar nada.

Tempo estimado: 15 a 20 minutos. O plano gratuito do Supabase é suficiente para começar.

## 1. Criar o projeto
1. Acesse **supabase.com**, entre com a sua conta (pode ser pelo GitHub) e clique em **New project**.
2. Dê um nome (ex.: `yfm-finance`), crie uma **senha do banco** (guarde no gerenciador de senhas) e escolha a região **South America (São Paulo)**.
3. Espere o projeto terminar de ser criado.

## 2. Criar as tabelas e as regras de acesso
1. No menu da esquerda, abra **SQL Editor** e clique em **New query**.
2. Abra o arquivo `supabase/schema.sql` deste repositório, copie **tudo**, cole no editor e clique em **Run**.
3. Deve aparecer "Success". Se aparecer erro, copie a mensagem e peça ajuda.
4. Se você já tinha rodado uma versão anterior deste arquivo, rode esta de novo: ela atualiza tudo sem apagar os seus dados.

## 3. Ajustar o login (Authentication)
Em **Authentication > Sign In / Providers** (ou "Providers > Email"):
- **Confirm email: desligado.** Sem isso, a conta que você cria para o cliente não consegue entrar na hora.
- **Minimum password length: 10.**
- Deixe **Allow new users to sign up** ligado. O site usa isso para você criar as contas dos clientes. Quem se cadastrar por fora não vê nada, porque só o administrador libera o acesso.

Em **Authentication > Multi-Factor** (ou "Sign In / Providers"): confirme que o **TOTP (app autenticador)** está habilitado para cadastro e verificação. O site exige isso do administrador.

Em **Authentication > URL Configuration**:
- **Site URL:** o endereço do seu site, por exemplo `https://SEU-USUARIO.github.io/yfm-finance/`. É para onde vai o link de "esqueci minha senha".

## 4. Criar o administrador (só você)
1. Em **Authentication > Users**, clique em **Add user > Create new user**, informe o **seu e-mail** e uma **senha forte**, e marque **Auto Confirm User**.
2. Volte ao **SQL Editor**, abra `supabase/primeiro-admin.sql`, troque `SEU_EMAIL_AQUI` pelo e-mail que você acabou de usar e clique em **Run**.

Pronto: esse é o único administrador. Ninguém consegue se tornar administrador pelo site, só rodando comandos no seu painel do Supabase.

**No primeiro login**, o site obriga você a ativar a **verificação em duas etapas**: instale o Google Authenticator, Microsoft Authenticator ou Authy no celular, leia o QR code e digite o código de 6 dígitos. Nos próximos logins, você digita a senha e depois o código. Mesmo que alguém descubra a sua senha, não consegue usar o administrador sem o seu celular, **inclusive direto no banco de dados**.

> Se perder o celular, rode `supabase/recuperar-2fa.sql` no SQL Editor (trocando pelo seu e-mail) e ative o 2FA de novo no próximo login. Guarde também a chave em texto que aparece abaixo do QR code, em um local seguro.

## 5. Ligar o site ao Supabase
1. Em **Project Settings > API**, copie:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **anon public key** (a chave longa chamada *anon* / *public*)
2. No GitHub, abra o arquivo **`config.json`** (um arquivo pequeno), clique no lápis para editar e troque `COLE_AQUI_A_URL_DO_SUPABASE` pela Project URL e `COLE_AQUI_A_CHAVE_ANON` pela chave **anon**. Salve com **Commit changes**.

> ⚠️ Use **somente** a chave **anon public**. Ela é feita para ficar no site e é protegida pelas regras do `schema.sql`. **Nunca** cole a chave `service_role` em nenhum arquivo do repositório.

## 6. (Opcional) Definir a senha do cliente pelo site
Sem este passo, você troca a senha de um cliente pelo botão "Enviar link de nova senha" (e-mail). Com ele, você digita a senha nova na aba **Clientes** e também consegue apagar o login por completo.
1. No Supabase, abra **Edge Functions > Deploy a new function > Via Editor**.
2. Nome da função: `admin-users` (exatamente assim).
3. Apague o exemplo, cole o conteúdo de `supabase/functions/admin-users/index.ts` e clique em **Deploy**.
4. Pronto. O Supabase já entrega a essa função as chaves necessárias, e a chave `service_role` fica só no servidor. A função só obedece ao administrador que passou pela verificação em duas etapas.

## 7. Usar
1. Abra o site, entre com o e-mail e a senha do administrador.
2. Aba **Clientes**: informe o nome, o e-mail e a senha inicial do cliente e escolha (ou crie) a empresa dele.
3. Clique em **Lançar dados** e cadastre as movimentações (um a um ou **importando o extrato do banco** em OFX/CSV, na tela Novo lançamento). O cliente vê tudo atualizado na hora, ao entrar com o e-mail e a senha dele.
4. Envie o endereço do site e a senha inicial ao cliente por canais diferentes. Ele pode trocá-la em **Minha conta** ou em **Esqueci minha senha**.

## Dúvidas comuns
- **"Esta conta ainda não tem acesso liberado":** o login existe, mas o administrador não criou o acesso na aba Clientes. Rode o passo 4 (administrador) ou crie o cliente pelo site.
- **Cliente criado, mas "e-mail ou senha incorretos":** confira se o **Confirm email** está desligado (passo 3).
- **Trocar senha de um cliente:** na aba Clientes, use **Enviar link de nova senha**. O envio de e-mails do plano gratuito tem limite por hora.
- **Apagar de vez um login:** em **Authentication > Users** do Supabase.

## Segurança dos dados lançados
- **Aba Segurança (só administrador):** *Baixar backup* (JSON com empresas, lançamentos, lixeira e lista de clientes, sem senhas), *Lixeira* e *Histórico de alterações*.
- **Lixeira:** "Excluir" um lançamento só o esconde. Você restaura na aba Segurança. O banco não permite apagar lançamentos de vez pelo site.
- **Histórico:** o banco registra sozinho quem criou, alterou ou removeu cada lançamento, empresa e acesso. Ninguém consegue editar ou apagar esse histórico pelo site.
- **Excluir empresa:** exige digitar o nome exato dela.
- **Backup:** baixe um backup toda semana e guarde em um local seguro. O arquivo **não é criptografado**, então não deixe em computador compartilhado nem envie por WhatsApp.
- O Supabase também mantém backups automáticos no plano pago. No plano gratuito, o backup que você baixa é a sua proteção principal.
