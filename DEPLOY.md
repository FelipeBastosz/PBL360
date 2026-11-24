# Deploy do PBL360

| Parte | Onde                                         | URL                                                |
| ----- | -------------------------------------------- | -------------------------------------------------- |
| Front | Vercel, projeto `pbl360`                     | https://pbl360.vercel.app                          |
| API   | Railway, projeto `pbl360`, serviço `api`     | https://api-production-8a00f0fe.up.railway.app/api |
| Banco | Railway, serviço `Postgres` (volume próprio) | só pela rede interna do Railway                    |

Contas do projeto: Vercel `pbl360ecomp-4927` e Railway `pbl360.ecomp@gmail.com`.

## Variáveis

**API (Railway, serviço `api`)**

| Variável                                                      | Valor                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Referências ao Postgres: `${{Postgres.PGHOST}}`, `${{Postgres.PGPORT}}`, `${{Postgres.PGUSER}}`, `${{Postgres.PGPASSWORD}}`, `${{Postgres.PGDATABASE}}` |
| `NODE_ENV`                                                    | `production`                                                                                                                                            |
| `JWT_SECRET`                                                  | Gerado com `openssl rand -base64 48`, só existe no Railway                                                                                              |
| `CORS_ORIGIN`                                                 | `https://pbl360.vercel.app`                                                                                                                             |
| `TRUST_PROXY`                                                 | `1` (um proxy na frente da API)                                                                                                                         |
| `SMTP_USER`                                                   | `pbl360.ecomp@gmail.com` (remetente dos e-mails)                                                                                                        |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`                      | Cliente OAuth do projeto `pbl360` no Google Cloud (conta `pbl360.ecomp`)                                                                                |
| `GMAIL_REFRESH_TOKEN`                                         | Gerado no OAuth Playground com o escopo `gmail.send`                                                                                                    |
| `RAILPACK_NODE_VERSION`                                       | `22`, a mesma versão da CI                                                                                                                              |

**Front (Vercel, Production e Preview)**

| Variável       | Valor                                                |
| -------------- | ---------------------------------------------------- |
| `VITE_API_URL` | `https://api-production-8a00f0fe.up.railway.app/api` |
| `VITE_APP_URL` | `https://pbl360.vercel.app`                          |

Variáveis `VITE_` vão para o navegador: nunca coloque segredo nelas.

## Configuração do serviço `api`

Fica em Settings do serviço no Railway (o `railway.json` foi descontinuado pelo Railway):

- **Start:** `npm run start:prod`
- **Pre-deploy:** `npm run migration:run`. As migrations rodam antes de a versão nova entrar no ar; se falharem, a versão anterior continua atendendo.
- **Healthcheck:** `/api/saude`

O `frontend/vercel.json` manda toda rota para o `index.html`, para que abrir ou recarregar uma rota interna não dê 404.

## E-mail pela API do Gmail

O Railway bloqueia SMTP (portas 25, 465 e 587) nos planos Trial, Free e Hobby; só libera no Pro, a US$ 20/mês. Como o cadastro e a recuperação de senha mandam código por e-mail, com o SMTP do Gmail ninguém conseguiria confirmar a conta.

Por isso, quando `GMAIL_REFRESH_TOKEN` está definida, o `MailTransport` (`backend/src/auth/infrastructure/email/mail-transport.ts`) envia pela API do Gmail, por HTTPS, com a conta `pbl360.ecomp@gmail.com`. O nodemailer continua montando a mensagem. Sem a variável, o envio segue pelo SMTP do Gmail, como no desenvolvimento local.

Antes foi usado o Brevo, mas ele troca o remetente para um endereço `brevosend.com`, e o Outlook da UEFS (`@discente.uefs.br`) descartava parte dos códigos sem avisar. Pela API do Gmail o e-mail sai do próprio Gmail.

**Credenciais:** projeto `pbl360` no Google Cloud, com a Gmail API ativada, o app publicado ("Em produção") e um cliente OAuth do tipo Aplicativo da Web. O refresh token sai do [OAuth Playground](https://developers.google.com/oauthplayground) usando esse cliente e o escopo `https://www.googleapis.com/auth/gmail.send`. Se a senha da conta `pbl360.ecomp` for trocada, o Google invalida o token e é preciso gerar outro.

**Se der problema:**

- Sem mexer no código: apagar `GMAIL_REFRESH_TOKEN` no Railway e definir `SMTP_PASS` (senha de app do Gmail). Só funciona em um plano que libere SMTP.
- No código: `git revert` do commit `feat(#505): send e-mails through the Gmail API when configured`. Ele só mexe no envio de e-mail e na validação das variáveis.

## Como atualizar

A produção sai da branch `prod`. Com a CI verde, atualize a `prod` com a `main` e publique a partir dela:

```bash
git switch prod && git merge main && git push

# API (a partir da raiz do repositório)
railway up backend --path-as-root --service api

# Front
cd frontend && vercel deploy --prod
```

## Como voltar para a versão anterior

- **API:** Railway → serviço `api` → Deployments → versão anterior → Redeploy. Se a versão que está saindo trouxe migration, revertê-la antes com `npm run migration:revert`.
- **Front:** Vercel → Deployments → versão anterior → Promote to Production (ou `vercel rollback`).

Os dados ficam no volume do Postgres e não são afetados por republicar ou voltar versão.

## Limites dos planos atuais

- **Railway Trial:** 30 dias ou US$ 5 de uso. Depois disso a API para; para manter no ar, assinar o Hobby (US$ 5/mês).
- **Gmail:** cerca de 500 e-mails por dia na conta grátis.
- **Anexos:** PDFs de até 10 MB, guardados no banco.
