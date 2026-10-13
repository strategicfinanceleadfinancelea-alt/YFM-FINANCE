# YFM Finance

Painel de gestão financeira com **DRE** e **fluxo de caixa**, para pequenas empresas e escritórios de contabilidade. Existe **um único administrador**, que lança os dados e cria as contas dos clientes. Cada cliente entra de qualquer aparelho, vê **somente a própria empresa** e não pode alterar nada.

![YFM Finance](assets/yfm-finance-produto.png)

## Como funciona

| Quem | O que faz |
| --- | --- |
| **Visitante** | Vê a tela de login e pode abrir a **demonstração** (dados fictícios, somente leitura, nada é salvo). |
| **Administrador** (um só) | Cria contas de clientes e empresas, lança receitas e despesas, dá baixa e exclui lançamentos. |
| **Cliente** | Entra com o e-mail e a senha criados pelo administrador e **visualiza** o painel, o DRE e as contas da própria empresa. |

O login e os dados ficam no [Supabase](https://supabase.com) (Auth + Postgres). As regras de acesso são aplicadas **no banco de dados** (Row Level Security): mesmo que alguém altere o site no navegador, o banco só entrega ao cliente os dados da empresa dele e recusa qualquer alteração.

## Funcionalidades

- **Página inicial** de apresentação (antes do login), com demonstração, como funciona e perguntas frequentes.
- **Visão geral:** saldo, entradas, saídas, resultado e margem, variação sobre o período anterior e gráfico mensal.
- **DRE** conforme a Lei 6.404/76, por mês, 3 meses ou 6 meses, com **análise vertical e horizontal** (comparação com o período anterior), **gráfico em cascata**, margens, EBITDA*, **ponto de equilíbrio** e margem de segurança.
- **Fluxo de caixa:** realizado mês a mês e **projeção de 3, 6 ou 12 meses** com cenários otimista, realista e pessimista (e controles deslizantes), alertas de saldo negativo, capital de giro, queima mensal e fôlego do caixa.
- **Exportação:** DRE e fluxo de caixa em **PDF** (pelo navegador, "Salvar como PDF") e em **planilha CSV** (abre no Excel).
- **Movimentações, contas a pagar e a receber**, com busca e total.
- **Importação de extrato** bancário em **OFX ou CSV**, com conferência e sem duplicar lançamentos.
- **Novo lançamento**, **Clientes**, **Empresas** e **Segurança** (somente administrador).
- **Minha conta** (troca de senha) e **Esqueci minha senha** por e-mail.
- **Suporte por Gmail:** botão que abre uma mensagem pronta.
- **Segurança dos dados:**
  - regras de acesso no banco (RLS): o cliente só lê a própria empresa e nunca altera;
  - **verificação em duas etapas obrigatória para o administrador**, exigida também pelo banco de dados;
  - **lixeira** (exclusão lógica) e **histórico de alterações** gravado pelo banco, que não pode ser editado pelo site;
  - **backup** em JSON na aba Segurança;
  - confirmação digitando o nome para excluir uma empresa;
  - bloqueio após 5 tentativas erradas, sessão que expira em 15 minutos sem uso, biblioteca do Supabase com versão fixa e verificação de integridade (SRI) e CSP.

## Colocar no ar

1. **Configure o Supabase:** siga o passo a passo em [`docs/CONFIGURAR-SUPABASE.md`](docs/CONFIGURAR-SUPABASE.md) (cria o projeto, as tabelas, o administrador e a ligação com o site).
2. **Publique no GitHub Pages:** em **Settings > Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`. O site fica em `https://SEU-USUARIO.github.io/yfm-finance/`.

Sem a configuração do Supabase, o site abre normalmente e mostra apenas a demonstração.

## Estrutura do projeto

```
yfm-finance/
├── index.html            # aplicação final (arquivo único, é o que vai ao GitHub Pages)
├── src/                  # código-fonte: template.html, styles.css, extras.js (DRE, fluxo, importação, página inicial), app.js
├── build.py              # junta src/ em index.html
├── supabase/
│   ├── schema.sql        # tabelas e regras de acesso (RLS)
│   ├── primeiro-admin.sql# cria o único administrador
│   └── recuperar-2fa.sql # se perder o celular do autenticador
│   └── functions/admin-users/ # (opcional) função de servidor para trocar a senha do cliente
├── docs/CONFIGURAR-SUPABASE.md
├── tests/                # teste de ponta a ponta com Supabase simulado
├── assets/               # imagens
└── LICENSE
```

### Editando o código
1. Altere os arquivos em `src/` e rode `python3 build.py` para regenerar o `index.html`.
2. Rode os testes: `npm install` e `npm test`.

A URL e a chave pública (*anon*) do Supabase ficam na linha `<script id="cfg">` do `index.html` e do `src/template.html`. **Nunca** coloque a chave `service_role` no repositório. O e-mail de suporte também fica nessa linha.

## Limitações conhecidas

- Trocar a senha de um cliente digitando a nova senha (e apagar logins) exige instalar a função `admin-users` (passo opcional do guia). Sem ela, use o link por e-mail.
- Os testes automáticos usam um Supabase **simulado**. Teste o fluxo completo no seu projeto real (criar cliente, entrar como cliente, lançar dados) antes de usar com clientes.
- O backup baixado não é criptografado; guarde em local seguro.
- O DRE usa regime de caixa (lançamentos pagos) e categorias fixas. *O EBITDA é igual ao resultado operacional, porque o sistema não registra depreciação.
- O fluxo de caixa não separa atividades operacionais, de investimento e de financiamento, e não calcula prazos médios de recebimento e pagamento (exigem notas e vencimentos por cliente).
- A projeção é uma estimativa simples (média dos últimos 3 meses ajustada pelo cenário), não uma previsão garantida.
- A planilha é CSV (abre no Excel); o PDF sai da impressão do navegador.
- **Antes de vender**, publique Termos de Uso e Política de Privacidade (LGPD) adequados ao seu serviço. Para oferecer serviços contábeis, consulte as regras do CRC.
- O plano gratuito do Supabase tem limite de e-mails por hora e pausa projetos sem uso.

## Próximos passos

- [ ] Exportação em Excel (.xlsx) e PDF gerado pelo próprio sistema.
- [ ] Fluxo de caixa por atividade (operacional, investimento e financiamento) e prazos médios.
- [ ] Edição de lançamentos e categorias personalizadas.

## Licença

[MIT](LICENSE)
