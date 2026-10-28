# Arquitetura do Frontend

Este documento descreve **como o código do frontend é organizado e por quê**. Ele é a
referência para revisões de código: um pull request que contraria o que está aqui deve mudar
o código ou mudar este documento.

As convenções que valem para o repositório inteiro — idioma, formato de commit, limites de
tamanho — estão em [`../CONVENTIONS.md`](../CONVENTIONS.md).

---

## 1. Princípio organizador

O backend separa por camadas (domínio, aplicação, infraestrutura). O frontend separa pela
mesma ideia, com outro vocabulário: **cada arquivo tem uma única responsabilidade e conhece o
mínimo possível do resto.**

Na prática isso vira três regras que explicam quase toda a estrutura:

1. **Componente não fala com a rede.** Quem fala com a API é `services/`; quem coordena
   estado e chamadas é um hook.
2. **Componente de UI não conhece o domínio.** Um `Button` não sabe o que é uma avaliação.
3. **Página monta, componente apresenta.** A página é onde as peças se encontram.

```
  pages/          ← monta a tela, decide o que buscar e o que mostrar
    └── hooks/    ← estado, efeitos, orquestração de chamadas
          └── services/   ← HTTP (axios), tradução de erro
    └── components/       ← apresentação, sem saber de onde vieram os dados
```

---

## 2. Estrutura de pastas

```
frontend/
├── public/               # ativos servidos como estão (favicon, robots.txt)
├── index.html            # ponto de entrada do Vite
├── vitest.setup.ts       # matchers do jest-dom + cleanup automático
└── src/
    ├── assets/           # imagens, fontes e ícones importados pelo bundler
    ├── components/
    │   ├── ui/           #   blocos genéricos e reutilizáveis (Button, Input, Modal)
    │   └── layout/       #   estrutura da aplicação (Header, Sidebar, PageShell)
    ├── contexts/         # estado global via Context API (sessão, tema)
    ├── hooks/            # hooks reutilizáveis (useAuth, useDebounce, useUsers)
    ├── pages/            # uma pasta/arquivo por rota
    ├── routes/           # definição das rotas e guards
    ├── services/         # cliente axios e funções de acesso à API
    ├── styles/           # CSS global e tokens do Tailwind
    ├── types/            # tipos e interfaces compartilhados
    ├── utils/            # funções puras (formatação, validação, datas)
    │                     # testes (*.test.ts/tsx) ficam SEMPRE ao lado do arquivo testado
    ├── App.tsx           # composição raiz (providers + router)
    ├── main.tsx          # bootstrap do React
    └── vite-env.d.ts     # tipos das variáveis de ambiente
```

### O que vai em cada pasta

**`components/ui/`** — componentes sem domínio: `Button`, `Input`, `Badge`, `Modal`,
`Spinner`. Recebem tudo por props, não fazem requisição, não leem contexto de negócio. Se um
componente daqui precisa importar algo de `services/`, ele está na pasta errada.

**`components/layout/`** — a moldura: `Header`, `Sidebar`, `Footer`, `PageShell`.

**`pages/`** — uma por rota. A página busca os dados (via hook), trata os estados de
carregamento e erro, e compõe os componentes. É o único lugar onde é normal um arquivo
"saber de tudo" um pouco.

**`hooks/`** — toda lógica com estado que aparecer em mais de um lugar, ou que polua uma
página. Um hook devolve dados e ações, nunca TSX.

**`services/`** — a fronteira com a API. Um arquivo por recurso (`user.service.ts`), cada
função mapeando um endpoint e devolvendo dados já tipados. Nenhum componente importa `axios`
diretamente.

**`types/`** — o que é compartilhado entre camadas (os modelos que vêm da API). Props de um
componente ficam no arquivo do próprio componente, não aqui.

**`utils/`** — funções **puras**: mesma entrada, mesma saída, sem efeito colateral. Se
precisa de `useState`, é um hook, não um util.

**`contexts/`** — estado verdadeiramente global (usuário autenticado, tema). Estado global é
caro: antes de criar um contexto, verifique se o estado não pertence a uma página só.

---

## 3. Camada de serviços

Um único cliente axios, configurado uma vez, com interceptors para token e para tradução de
erro:

```ts
// src/services/api.ts
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
```

```ts
// src/services/user.service.ts
export const userService = {
  list: () => api.get<User[]>('/usuarios').then((r) => r.data),
  create: (payload: CreateUserPayload) => api.post<User>('/usuarios', payload).then((r) => r.data),
};
```

Por que isso importa: quando a autenticação mudar, ou o formato de erro da API mudar, existe
**um** lugar para mexer. O dia em que um `axios.get` aparece dentro de um componente, esse
lugar deixa de ser um.

---

## 4. Componentes

### Um componente, uma responsabilidade

Se um componente busca dados, filtra, ordena e renderiza uma tabela, ele é quatro coisas.
Extraia: o hook busca, um util filtra e ordena, o componente renderiza.

### Props explícitas e tipadas

```ts
type UserCardProps = {
  user: User;
  onSelect: (id: string) => void;
  isSelected?: boolean;
};

export function UserCard({ user, onSelect, isSelected = false }: UserCardProps) { ... }
```

Evite `React.FC` (atrapalha genéricos e `children`) e evite espalhar `{...props}` sem tipo.

### Componente burro por padrão

Prefira receber dados por props a buscá-los internamente. Isso torna o componente
reutilizável, testável e previsível. Quem busca é a página ou um hook.

### Composição em vez de flags

Quando as props viram `isCompact`, `isLarge`, `hasIcon`, `variantSecondary`, o componente
está tentando ser vários. Quebre em componentes menores e componha.

### Estado no lugar certo

Estado mora no ponto mais baixo da árvore que ainda o enxerga por inteiro. Subir estado
desnecessariamente re-renderiza meia aplicação; espalhá-lo demais cria fontes de verdade
concorrentes.

Derive em vez de duplicar: se `total` é `items.length`, **calcule** — não guarde em `useState`
e sincronize com `useEffect`.

---

## 5. Estilização com Tailwind

- Utilitários no TSX são o padrão. CSS separado só para o que utilitário não alcança.
- Repetiu a mesma sequência de classes três vezes? Isso é um componente, não um `@apply`.
- Tokens (cores, fontes, espaçamentos) vivem em `@theme` dentro de `src/styles/index.css` —
  Tailwind 4 não usa `tailwind.config.js`.
- Ordem das classes: layout → espaçamento → tipografia → cor → estado
  (`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600`).
- Para classes condicionais, use uma função utilitária de composição em vez de template
  strings encadeadas.
- Ícones vêm do `@heroicons/react`, importados individualmente:
  `import { UserIcon } from '@heroicons/react/24/outline'`.

---

## 6. Boas práticas de código limpo

### Idioma

**Código em inglês, texto de interface em português.** Componentes, hooks, props, variáveis,
arquivos e comentários: inglês. O que o usuário lê na tela: português.

Os tipos em `types/` espelham o **contrato da API, que é em português** — então eles têm
campos em português, de propósito:

```ts
// types/evaluation.ts — mirrors the API contract, so the fields stay in Portuguese
export type Evaluation = {
  id: string;
  alunoId: string;
  nota: number;
};
```

```tsx
// The component is English; what the user reads is Portuguese.
export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  return <p>Nota: {evaluation.nota}</p>;
}
```

Diferente do backend, aqui **não há tradução**: o frontend consome o contrato como ele vem, e
inventar uma camada de mapeamento só para anglicizar nomes custa mais do que resolve. Regra
completa em [`../CONVENTIONS.md`](../CONVENTIONS.md#1-idioma).

### Tamanho

| Limite             | Valor   | Verificado por                    |
| ------------------ | ------- | --------------------------------- |
| Linhas por função  | **50**  | ESLint (`max-lines-per-function`) |
| Linhas por arquivo | **250** | ESLint (`max-lines`)              |

Linhas em branco e comentários não contam. **São erros de lint**, não sugestões: quebram o
`pre-push` e a CI. Arquivos de teste são exceção.

O limite é 50 (e não 20, como no backend) porque o TSX é verboso por natureza — uma lista com
estados de carregamento e erro passa de 20 linhas sem nenhuma complexidade real. Isso é uma
folga **para componentes**: hooks, utils e handlers não retornam TSX e devem ficar perto das
20 linhas do backend. O ESLint não distingue os dois casos; a revisão de código distingue.

Bater no limite quase sempre significa uma destas três coisas:

- o componente está buscando dados além de renderizar → extraia um hook;
- há lógica de transformação no meio do TSX → mova para `utils/`;
- o componente é vários → quebre e componha.

Não use `eslint-disable` para escapar. Detalhes em
[`../CONVENTIONS.md`](../CONVENTIONS.md#4-limites-de-tamanho).

### Nomes

Componentes em `PascalCase` (`UserCard.tsx`), hooks começando com `use`
(`useUsers.ts`), utils e services em `camelCase`. Handlers seguem `handleX` no componente que
os define e `onX` na prop que os recebe.

### Tipagem

`strict` está ligado. Evite `any` — prefira `unknown` e estreite. Não tipe o que o TypeScript
já infere. Tipos vindos da API ficam em `types/` e são a fonte da verdade do que a API
devolve; se o backend mudar, o erro aparece na compilação, e é para ser assim.

### Efeitos

`useEffect` é para **sincronizar com algo externo** ao React (rede, timer, evento do DOM).
Não é para derivar estado nem para reagir a mudança de prop — na maioria desses casos, o
cálculo direto durante a renderização é mais simples e não tem bug de sincronia.

Todo efeito declara suas dependências corretamente (o `eslint-plugin-react-hooks` verifica) e
limpa o que criou.

### Estados de carregamento e erro

Toda tela que busca dados tem três estados: carregando, erro e conteúdo. Tratar os três é
requisito, não refinamento — a tela em branco é o bug mais comum de frontend.

### Funções

Pequenas, com um nível de abstração. Retorno antecipado em vez de aninhamento. Mais de 3
parâmetros normalmente pede um objeto.

### Comentários

Explique **por quê**, não **o quê** — e escreva o comentário em inglês.
`// disables the button` é ruído; `// the API rejects a resend within 30s` é informação.

### Acessibilidade

HTML semântico antes de `div` com `onClick`. Todo input tem `label`, todo botão tem texto
acessível, toda imagem tem `alt`. Navegação por teclado funciona por padrão quando os
elementos certos são usados.

### O que **não** fazer

- `axios` importado dentro de componente.
- Componente em `components/ui/` importando de `services/` ou `contexts/`.
- `useEffect` para derivar estado a partir de props.
- Segredo em `VITE_*` — vai inteiro para o bundle público.
- Import relativo profundo (`../../../`) — use `@/`.
- `console.log` esquecido em código de produção.
- Identificador em inglês para texto de tela, ou em português para código.
- `eslint-disable` para escapar do limite de linhas — extraia um hook ou um util.
- Objeto ou array literal como dependência de `useEffect`.

---

## 7. Testes

> **Regra do projeto: toda feature entra com teste.** Nenhum pull request que adiciona ou
> muda comportamento é aprovado sem teste cobrindo esse comportamento. O critério do que
> testar está em [7.2](#72-o-que-testar-e-o-que-nao).

A stack é **Vitest** + **jsdom** + **Testing Library**. O `vitest.setup.ts` já registra os
matchers do `jest-dom` e faz `cleanup()` depois de cada teste — você não precisa repetir isso.

### 7.1 Onde cada teste mora

**Ao lado do arquivo testado**, sempre. Não existe pasta `__tests__/` neste projeto: um
arquivo sem teste ao lado fica visivelmente descoberto.

```
src/
├── components/ui/
│   ├── Button.tsx
│   └── Button.test.tsx
├── hooks/
│   ├── useEvaluations.ts
│   └── useEvaluations.test.ts
├── utils/
│   ├── formatScore.ts
│   └── formatScore.test.ts
└── pages/
    ├── EvaluationsPage.tsx
    └── EvaluationsPage.test.tsx
```

Sufixo `.test.ts` para o que não tem marcação (hooks, utils, services) e `.test.tsx` para
componentes e páginas.

Já os **testes ponta a ponta (E2E)** exercitam a aplicação inteira em um navegador Chromium real
e ficam centralizados na pasta `e2e/` (`*.spec.ts`):

```
frontend/
├── e2e/
│   ├── login.spec.ts
│   └── rooms.spec.ts
└── src/
```

### 7.2 O que testar e o que não

| Você mexeu em...                              | Testa?                                         |
| --------------------------------------------- | ---------------------------------------------- |
| Função em `utils/`                            | **Sim** — é o teste mais barato e mais estável |
| Hook com lógica (estado, derivação, erro)     | **Sim**                                        |
| Componente com ramificação (vazio/erro/lista) | **Sim** — cubra os três caminhos               |
| Página que orquestra busca e exibição         | **Sim**, com a camada `services/` substituída  |
| Componente que só repassa props para o DOM    | Não vale o custo                               |
| Estilo, classe do Tailwind, layout            | Não — teste não é o lugar de verificar CSS     |

### 7.3 Como escrever

Teste **o que o usuário vê e faz**, nunca o estado interno. O componente é uma caixa-preta:
entram props, saem elementos e chamadas.

```tsx
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('calls onPress when the user clicks it', async () => {
    const onPress = vi.fn();
    render(<Button label="Salvar" onPress={onPress} />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not call onPress while loading', async () => {
    const onPress = vi.fn();
    render(<Button label="Salvar" onPress={onPress} isLoading />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

**Busque os elementos como o usuário os encontraria**, nesta ordem de preferência:

1. `getByRole('button', { name: 'Salvar' })` — papel + nome acessível;
2. `getByLabelText('E-mail')` — para campos de formulário;
3. `getByText('Nenhuma avaliação')` — para conteúdo;
4. `getByTestId('...')` — último recurso, quando nada acima identifica o elemento.

Isso não é preferência estética: um teste que busca por papel e nome **falha quando a
acessibilidade quebra**, e continua passando quando você só mexe no HTML ou nas classes.
Teste que busca por classe CSS quebra a cada refatoração e não prova nada sobre o usuário.

**Substitua a rede na camada `services/`** — que existe justamente por isso:

```tsx
// EvaluationsPage.test.tsx
vi.mock('@/services/evaluation.service');

it('shows the empty state when there is no evaluation', async () => {
  vi.mocked(evaluationService.list).mockResolvedValue([]);
  render(<EvaluationsPage />);

  expect(await screen.findByText('Nenhuma avaliação encontrada')).toBeInTheDocument();
});
```

Nunca substitua o `axios` diretamente: isso amarra o teste ao transporte, e o dia em que o
cliente HTTP mudar, todos os testes quebram por um motivo que não é o deles.

**Para o que é assíncrono, use `findBy*`** (que espera) em vez de `getBy*` com `setTimeout`.
E prefira `userEvent` a `fireEvent`: ele simula a sequência real de eventos do navegador
(foco, teclado, clique), então pega bugs que o `fireEvent` não pega.

**Textos nas asserções ficam em português**, porque é o que está na tela.

### 7.4 Como rodar

```bash
npm test                    # roda tudo uma vez
npm run test:watch          # watch — o loop do dia a dia
npm run test:cov            # com relatório de cobertura em coverage/

npm test -- Button          # só os arquivos cujo caminho casa com "Button"
npm test -- -t 'loading'    # só os testes cujo nome casa com "loading"

# Testes E2E (Playwright)
npm run test:e2e            # executa suíte E2E em modo headless
npm run test:e2e:ui         # interface gráfica interativa do Playwright (time-travel)
npm run test:e2e:headed     # executa abrindo a janela do navegador na tela
npm run test:e2e:report     # exibe o relatório HTML
```

Na CI, `npm test` roda a cada push, junto com lint, formatação, type-check e build.

### 7.5 O que priorizar

Utils puros primeiro: são baratos, rápidos e nunca dão falso positivo. Depois hooks com
lógica não trivial, e componentes com ramificação de comportamento — sobretudo os três
estados de toda tela que busca dados (carregando, erro, conteúdo), que é onde mora o bug mais
comum de frontend.

Não perseguimos um percentual de cobertura. A pergunta útil é **"se eu quebrar esse
comportamento, algum teste fica vermelho?"**. Se a resposta for não, falta teste.
