# PBL360 — Backend

API REST em **NestJS 11** com **TypeORM 0.3** e **PostgreSQL 17**.

A organização do código segue Clean Architecture + DDD e está descrita em
**[ARCHITECTURE.md](ARCHITECTURE.md)** — leia antes de criar o primeiro módulo.

Idioma, formato de commit e limites de tamanho valem para o repositório inteiro e estão em
**[../CONVENTIONS.md](../CONVENTIONS.md)**. Em resumo, no backend: código e comentários em
inglês, contrato da API em português, **20 linhas por função** e **200 por arquivo**
(verificado pelo ESLint).

## Stack

| Ferramenta | Versão | Papel                                    |
| ---------- | ------ | ---------------------------------------- |
| Node.js    | 22 LTS | Runtime                                  |
| NestJS     | 11.2   | Framework HTTP e injeção de dependências |
| TypeORM    | 0.3.31 | ORM e migrations                         |
| PostgreSQL | 17     | Banco de dados                           |
| TypeScript | 5.9    | Linguagem                                |
| Swagger    | 11.2   | Documentação OpenAPI da API              |
| Jest       | 30     | Testes unitários e e2e                   |
| ESLint     | 10     | Análise estática                         |
| Prettier   | 3.9    | Formatação                               |

## Setup passo a passo

Do zero até a API respondendo. Se você já fez isso antes, o resumo é
`npm install && cp .env.example .env && npm run start:dev` — com o banco no ar.

### 1. Pré-requisitos

```bash
node --version      # precisa ser >= 20.19; o projeto usa 22 LTS (veja .nvmrc)
docker --version    # necessário para o PostgreSQL
```

Se você usa `nvm`, a versão certa vem do arquivo:

```bash
nvm use             # lê o .nvmrc da raiz do repositório
```

### 2. Suba o banco

O PostgreSQL vive no Docker Compose, na **raiz do repositório** — não aqui.

```bash
cd ..
cp .env.example .env     # credenciais do container; os padrões servem para desenvolver
npm run db:up
```

Confirme que subiu antes de seguir:

```bash
docker compose ps        # postgres deve aparecer como "healthy"
```

O Adminer fica em <http://localhost:8080> (sistema `PostgreSQL`, servidor `postgres`,
usuário e senha `pbl360`) se você quiser inspecionar as tabelas pelo navegador.

### 3. Instale as dependências

```bash
cd backend
npm install
```

O `npm install` da **raiz** também instala o `husky` e ativa os hooks de git. Se você clonou
o repositório e foi direto para `backend/`, rode `npm install` na raiz pelo menos uma vez —
sem isso os hooks de commit e push não existem.

### 4. Configure o ambiente

```bash
cp .env.example .env
```

Os padrões já batem com o `docker-compose.yml`, então normalmente não há nada a editar. Cada
variável está documentada em [Variáveis de ambiente](#variáveis-de-ambiente).

### 5. Aplique as migrations

```bash
npm run migration:run
```

Enquanto não existir nenhuma migration, o comando não faz nada — e isso é o esperado. O
schema **não** é criado sozinho: `synchronize` fica desligado de propósito (veja
[Migrations](#migrations)).

### 6. Suba a API

```bash
npm run start:dev
```

A API fica em <http://localhost:3000/api>, com recarga automática a cada arquivo salvo.

A documentação interativa (Swagger UI) fica em <http://localhost:3000/api/docs>, e o
OpenAPI em JSON em <http://localhost:3000/api/docs/json>. Ela é gerada a partir dos
decoradores dos controllers e dos DTOs — endpoint novo sem `@Api*` entra no documento
sem descrição, sem exemplo e sem os status que ele responde.

### 7. Verifique que está tudo de pé

```bash
npm run lint         # deve terminar sem saída
npm test             # unitários
npm run test:e2e     # e2e; precisa do banco no ar
npm run build        # deve gerar dist/ sem erro
```

Os quatro passando significa que seu ambiente reproduz o que a CI vai rodar.

### Problemas comuns

| Sintoma                          | Causa provável e saída                                                     |
| -------------------------------- | -------------------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:5432`    | Banco não está no ar. Na raiz: `npm run db:up`                             |
| `password authentication failed` | `.env` do backend não bate com o `.env` da raiz                            |
| `port 5432 is already allocated` | Já há um PostgreSQL local. Mude `DB_PORT` no `.env` da raiz                |
| `relation "..." does not exist`  | Faltou `npm run migration:run`                                             |
| Hook de commit não dispara       | Rode `npm install` na raiz (instala o husky)                               |
| `Cannot find module '@/...'`     | Rode do diretório `backend/`; o alias `@/` é resolvido pelo tsconfig daqui |

Para começar do zero, apagando os dados: na raiz, `npm run db:reset`.

## Scripts

| Script                       | O que faz                                        |
| ---------------------------- | ------------------------------------------------ |
| `npm run start:dev`          | Sobe a API em watch mode                         |
| `npm run start:prod`         | Executa o build de `dist/`                       |
| `npm run build`              | Compila para `dist/`                             |
| `npm run seed`               | Popula o banco com dados iniciais de dev         |
| `npm run lint`               | ESLint (com regras type-aware)                   |
| `npm run lint:fix`           | ESLint com correção automática                   |
| `npm run format`             | Prettier em `src/` e `test/`                     |
| `npm run format:check`       | Falha se algo estiver desformatado (usado na CI) |
| `npm run test`               | Testes unitários (`*.spec.ts` em `src/`)         |
| `npm run test:cov`           | Testes com relatório de cobertura                |
| `npm run test:e2e`           | Testes e2e (`*.e2e-spec.ts` em `test/`)          |
| `npm run migration:create`   | Cria uma migration vazia                         |
| `npm run migration:generate` | Gera migration a partir do diff das entidades    |
| `npm run migration:run`      | Aplica as migrations pendentes                   |
| `npm run migration:revert`   | Reverte a última migration                       |

## Seed de ambiente de desenvolvimento

O comando `npm run seed` (ou `npm run db:seed` na raiz) insere usuários de teste com credenciais padrão (`senha-secreta`):

- **Professores (`TUTOR`)**:
  - `carlos@uefs.br`
  - `maria@uefs.br`
- **Alunos (`STUDENT`)**:
  - `ana@discente.uefs.br` (Matrícula: `20240001`)
  - `joao@discente.uefs.br` (Matrícula: `20240002`)

O script é idempotente: e-mails já existentes no banco são ignorados sem gerar duplicação ou erro.

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example). O carregamento é feito pelo
`@nestjs/config` e tipado em `src/config/env.config.ts`.

| Variável                                  | Padrão                  | Observação                                                  |
| ----------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| `PORT`                                    | `3000`                  | Porta HTTP                                                  |
| `API_PREFIX`                              | `api`                   | Prefixo global das rotas                                    |
| `DB_HOST` / `DB_PORT`                     | `localhost` / `5432`    | Conexão com o PostgreSQL                                    |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | `pbl360`                | Credenciais                                                 |
| `DB_SYNCHRONIZE`                          | `false`                 | **Mantenha `false`** — o schema é versionado por migrations |
| `JWT_SECRET`                              | —                       | **Obrigatória**: a API não sobe sem ela                     |
| `JWT_EXPIRES_IN`                          | `1d`                    | Validade do token (`30m`, `1d`, ou segundos)                |
| `BCRYPT_ROUNDS`                           | `12`                    | Custo do hash da senha                                      |
| `CORS_ORIGIN`                             | `http://localhost:5173` | Origem permitida para o frontend                            |

## Migrations

O schema do banco é versionado. `synchronize` fica **sempre** desligado, inclusive em
desenvolvimento: é a única forma de garantir que o que roda em produção foi revisado.

```bash
# 1. crie/edite a entidade em <feature>/domain/entities/
# 2. gere a migration a partir do diff
npm run migration:generate -- src/migrations/CreateUsers

# 3. revise o SQL gerado (sempre), então aplique
npm run migration:run
```

O `DataSource` usado pela CLI fica em `src/config/data-source.ts` e lê o `.env` diretamente.
A aplicação em si é configurada por `src/config/typeorm.config.ts`, via `TypeOrmModule`.

## Testes

> **Toda feature entra com teste** — unitário ou e2e, o que fizer sentido para o que mudou.
> É regra do projeto, não recomendação.

| Tipo         | Onde                                       | Comando            | Precisa de banco? |
| ------------ | ------------------------------------------ | ------------------ | ----------------- |
| **Unitário** | ao lado do código (`*.spec.ts`, em `src/`) | `npm test`         | Não               |
| **E2E**      | `test/*.e2e-spec.ts`                       | `npm run test:e2e` | **Sim**           |

```bash
npm test                    # unitários, rápido
npm run test:watch          # unitários em watch — o loop do dia a dia
npm run test:cov            # unitários + cobertura em coverage/
npm run test:e2e            # e2e; suba o banco antes (na raiz: npm run db:up)

npm test -- create-user     # filtra por caminho de arquivo
npm test -- -t 'rejects'    # filtra por nome do teste
```

As duas suítes são configuradas separadamente — a unitária no bloco `jest` do `package.json`,
a e2e em `test/jest-e2e.json` — então `npm test` nunca tenta tocar no banco.

Onde colocar cada teste, como escrever um e o que não vale a pena testar estão em
**[ARCHITECTURE.md](ARCHITECTURE.md#6-testes)**.
