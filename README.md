# PBL360

Monorepo do PBL360: API em **NestJS + TypeORM + PostgreSQL** e SPA em **React + TypeScript + TailwindCSS**.

## Estrutura

```
PBL360/
├── CONVENTIONS.md             # idioma, commits, branches, limites de tamanho
├── .github/workflows/ci.yml   # CI: lint + testes + build a cada push/PR
├── .husky/                    # hooks de git (commit-msg, pre-commit, pre-push)
├── backend/                   # API NestJS (Clean Architecture + DDD)
├── frontend/                  # SPA React + Vite + TailwindCSS
├── docker/postgres/init/      # scripts SQL executados na criação do banco
├── docker-compose.yml         # PostgreSQL + Adminer
└── package.json               # scripts do monorepo, husky e lint-staged
```

## Documentação

| Documento                                            | Conteúdo                                           |
| ---------------------------------------------------- | -------------------------------------------------- |
| [CONVENTIONS.md](CONVENTIONS.md)                     | **Idioma, commits, branches e limites de tamanho** |
| [backend/README.md](backend/README.md)               | Setup passo a passo da API, migrations, testes     |
| [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)   | Clean Architecture, DDD e código limpo no backend  |
| [frontend/README.md](frontend/README.md)             | Setup passo a passo da SPA, variáveis de ambiente  |
| [frontend/ARCHITECTURE.md](frontend/ARCHITECTURE.md) | Organização de componentes e código limpo no front |

## Pré-requisitos

- **Node.js 22 LTS** (veja `.nvmrc`) — mínimo suportado: 20.19
- **Docker** + **Docker Compose** (para o PostgreSQL)

## Primeiros passos

```bash
# 1. dependências da raiz, do backend e do frontend
npm run install:all

# 2. variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. banco de dados
npm run db:up            # sobe o PostgreSQL (e o Adminer em http://localhost:8080)

# 4. aplicações (em terminais separados)
npm run dev:backend      # API em http://localhost:3000/api
npm run dev:frontend     # SPA em http://localhost:5173
```

Se algo não subir, o passo a passo detalhado — com verificação e problemas comuns — está em
[backend/README.md](backend/README.md#setup-passo-a-passo) e
[frontend/README.md](frontend/README.md#setup-passo-a-passo).

## Scripts da raiz

| Script                 | O que faz                                              |
| ---------------------- | ------------------------------------------------------ |
| `npm run install:all`  | Instala dependências da raiz, do backend e do frontend |
| `npm run db:up`        | Sobe o PostgreSQL via Docker Compose                   |
| `npm run db:down`      | Derruba os containers                                  |
| `npm run db:reset`     | Derruba os containers **e apaga o volume** de dados    |
| `npm run dev:backend`  | API em modo watch                                      |
| `npm run dev:frontend` | Vite dev server                                        |
| `npm run lint`         | ESLint no backend e no frontend                        |
| `npm run format`       | Prettier no backend e no frontend                      |
| `npm run test`         | Testes do backend e do frontend                        |

## Qualidade de código

O repositório não depende de disciplina manual: a formatação e o lint são automáticos.

**`commit-msg`** — valida o formato da mensagem de commit (veja [CONVENTIONS.md](CONVENTIONS.md#2-commits)).

**`pre-commit`** — roda `lint-staged` na raiz, no backend e no frontend. Apenas os arquivos
_staged_ passam por `eslint --fix` e `prettier --write`, e as correções entram no commit.

**`pre-push`** — roda `eslint` e `prettier --check` nas duas aplicações. Se algo estiver
fora do padrão, o push é abortado. Nenhum código desformatado chega ao remoto.

**CI (GitHub Actions)** — a cada push e pull request, em qualquer branch:

- **backend**: lint, checagem de formatação, testes unitários com cobertura, testes e2e
  (contra um serviço PostgreSQL real) e build;
- **frontend**: lint, checagem de formatação, type-check, testes e build.

Os hooks são instalados pelo `husky` no `npm install` da raiz (script `prepare`).
Se precisar reinstalá-los: `npm run prepare`.

## Banco de dados

O `docker-compose.yml` sobe dois serviços:

| Serviço    | Porta padrão | Descrição                                     |
| ---------- | ------------ | --------------------------------------------- |
| `postgres` | `5432`       | PostgreSQL 17 (volume `pbl360-postgres-data`) |
| `adminer`  | `8080`       | Cliente web para inspecionar o banco          |

Credenciais e portas vêm do `.env` da raiz (veja `.env.example`). Arquivos `.sql` colocados
em `docker/postgres/init/` são executados **uma única vez**, na primeira criação do volume.

## Convenções

O detalhe completo está em **[CONVENTIONS.md](CONVENTIONS.md)**. O essencial:

**Idioma** — código, comentários e commits em **inglês**; contrato da API (rotas, campos do
JSON, mensagens), documentação e textos de tela em **português**. No backend, a tradução
acontece na borda, no DTO e no controller.

**Commits** — em inglês, `<tipo>(#<issue>): <mensagem>`, no imperativo e sem ponto final:

```
feat(#50): create a new module
fix(#72): prevent duplicate enrollment on concurrent requests
```

O hook `commit-msg` aborta o commit fora desse formato.

**Limites de tamanho** — verificados pelo ESLint, portanto quebram o push e a CI:

|                    | Backend | Frontend |
| ------------------ | ------- | -------- |
| Linhas por função  | 20      | 50       |
| Linhas por arquivo | 200     | 250      |

**Testes** — toda feature entra com teste, unitário ou e2e. No backend, unitário ao lado do
código e e2e em `backend/test/`; no frontend, sempre ao lado do arquivo testado.

**Branches** — `<tipo>/#<issue>-<descrição-em-inglês>`, ex.: `feat/#50-create-evaluation-module`.
`main` é protegida: toda mudança entra por pull request com a CI verde.
