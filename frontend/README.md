# PBL360 — Frontend

SPA em **React 19** com **TypeScript**, **Vite**, **TailwindCSS 4**, **Heroicons** e **Axios**.

A organização do código está descrita em **[ARCHITECTURE.md](ARCHITECTURE.md)** — leia antes
de criar a primeira tela.

Idioma, formato de commit e limites de tamanho valem para o repositório inteiro e estão em
**[../CONVENTIONS.md](../CONVENTIONS.md)**. Em resumo, no frontend: código e comentários em
inglês, textos de tela em português, **50 linhas por função** e **250 por arquivo**
(verificado pelo ESLint).

## Stack

| Ferramenta        | Versão   | Papel                               |
| ----------------- | -------- | ----------------------------------- |
| React             | 19.2     | Biblioteca de UI                    |
| TypeScript        | 5.9      | Linguagem                           |
| Vite              | 7.3      | Dev server e build                  |
| TailwindCSS       | 4.3      | Estilização por utilitários         |
| @heroicons/react  | 2.2      | Ícones                              |
| Axios             | 1.20     | Cliente HTTP                        |
| React Router      | 7.18     | Roteamento                          |
| Vitest            | 4.1      | Testes                              |
| Testing Library   | 16.3     | Renderização e consultas nos testes |
| ESLint / Prettier | 10 / 3.9 | Lint e formatação                   |

## Setup passo a passo

Do zero até a SPA no navegador. Se você já fez isso antes, o resumo é
`npm install && cp .env.example .env && npm run dev`.

### 1. Pré-requisitos

```bash
node --version      # precisa ser >= 20.19; o projeto usa 22 LTS (veja .nvmrc)
```

Se você usa `nvm`:

```bash
nvm use             # lê o .nvmrc da raiz do repositório
```

Não é preciso Docker aqui — o frontend não depende do banco diretamente.

### 2. Instale as dependências

```bash
cd frontend
npm install
```

O `npm install` da **raiz** também instala o `husky` e ativa os hooks de git. Se você clonou
o repositório e foi direto para `frontend/`, rode `npm install` na raiz pelo menos uma vez —
sem isso os hooks de commit e push não existem.

### 3. Configure o ambiente

```bash
cp .env.example .env
```

O padrão (`VITE_API_URL=http://localhost:3000/api`) já aponta para a API local. Lembre-se de
que tudo com prefixo `VITE_` vai para o bundle público — **nunca coloque segredo aqui**.

### 4. Suba a SPA

```bash
npm run dev
```

A aplicação fica em <http://localhost:5173>, com HMR a cada arquivo salvo.

### 5. Suba a API (quando for consumir dados)

A tela abre sem a API, mas qualquer chamada vai falhar. Em outro terminal, na raiz:

```bash
npm run db:up            # PostgreSQL
npm run dev:backend      # API em http://localhost:3000/api
```

O dev server do Vite faz proxy de `/api` para `http://localhost:3000` (veja
`vite.config.ts`), então **em desenvolvimento não há CORS a resolver**.

### 6. Verifique que está tudo de pé

```bash
npm run lint         # deve terminar sem saída
npm run type-check   # tsc --noEmit
npm test             # Vitest
npm run build        # deve gerar dist/ sem erro
```

Os quatro passando significa que seu ambiente reproduz o que a CI vai rodar.

### Problemas comuns

| Sintoma                                     | Causa provável e saída                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `Network Error` / `ERR_CONNECTION_REFUSED`  | A API não está no ar. Na raiz: `npm run dev:backend`                            |
| Requisição vai para `5173` em vez de `3000` | Você chamou a URL absoluta; use caminho relativo e deixe o proxy agir           |
| `import.meta.env.VITE_X` é `undefined`      | Faltou o prefixo `VITE_`, ou o servidor não foi reiniciado após editar o `.env` |
| `Cannot find module '@/...'`                | Rode do diretório `frontend/`; o alias é resolvido pelo tsconfig daqui          |
| Classe do Tailwind não aplica               | Tailwind 4 não tem `tailwind.config.js` — customize em `src/styles/index.css`   |
| Hook de commit não dispara                  | Rode `npm install` na raiz (instala o husky)                                    |

## Scripts

| Script                 | O que faz                                        |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Vite dev server com HMR                          |
| `npm run build`        | Type-check + build de produção em `dist/`        |
| `npm run preview`      | Serve o build localmente                         |
| `npm run lint`         | ESLint                                           |
| `npm run lint:fix`     | ESLint com correção automática                   |
| `npm run format`       | Prettier em `src/`                               |
| `npm run format:check` | Falha se algo estiver desformatado (usado na CI) |
| `npm run type-check`   | `tsc --noEmit`                                   |
| `npm run test`         | Vitest (jsdom + Testing Library)                 |
| `npm run test:watch`   | Vitest em watch                                  |
| `npm run test:cov`     | Vitest + cobertura em `coverage/`                |

## Variáveis de ambiente

Apenas variáveis com prefixo `VITE_` chegam ao navegador — e **tudo que chega ao navegador é
público**. Nunca coloque segredo aqui.

| Variável       | Padrão                      | Uso                       |
| -------------- | --------------------------- | ------------------------- |
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL do cliente Axios |

Os tipos ficam em `src/vite-env.d.ts`; adicione toda variável nova à interface `ImportMetaEnv`
para ter autocomplete e erro de compilação quando faltar.

## TailwindCSS

Tailwind 4 é configurado via plugin do Vite (`@tailwindcss/vite`) — **não existe
`tailwind.config.js`**. Customizações (cores, fontes, espaçamentos) são declaradas em CSS,
em `src/styles/index.css`:

```css
@import 'tailwindcss';

@theme {
  --color-brand-500: oklch(0.62 0.19 260);
  --font-display: 'Inter', sans-serif;
}
```

## Testes

> **Toda feature entra com teste.** É regra do projeto, não recomendação.

A stack é **Vitest** + **jsdom** + **Testing Library**. O `vitest.setup.ts` registra os
matchers do `jest-dom` e faz `cleanup()` depois de cada teste — você não precisa repetir isso.

Os testes ficam **ao lado do arquivo testado**: `.test.tsx` para componentes e páginas,
`.test.ts` para hooks, utils e services. Não existe pasta `__tests__/` neste projeto.

```bash
npm test                    # roda tudo uma vez
npm run test:watch          # watch — o loop do dia a dia
npm run test:cov            # com cobertura em coverage/

npm test -- Button          # filtra por caminho de arquivo
npm test -- -t 'loading'    # filtra por nome do teste
```

Como escrever, quais consultas usar (`getByRole` antes de `getByTestId`) e como substituir a
camada de rede estão em **[ARCHITECTURE.md](ARCHITECTURE.md#7-testes)**.

## Alias de import

`@/` aponta para `src/` (configurado em `vite.config.ts` e `tsconfig.app.json`):

```ts
import { Button } from '@/components/ui/Button';
```
