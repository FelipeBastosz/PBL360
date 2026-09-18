# Convenções do PBL360

Regras que valem para **backend e frontend**. Elas não são preferência estética: são o que
permite que qualquer pessoa abra um arquivo do projeto e entenda onde está.

Boa parte é verificada automaticamente — ESLint, Prettier e os hooks de git. O que a máquina
não verifica, a revisão de código verifica.

---

## 1. Idioma

O projeto é bilíngue de propósito, e a fronteira é clara:

| O quê                                                    | Idioma        |
| -------------------------------------------------------- | ------------- |
| Código (classes, funções, variáveis, arquivos, branches) | **Inglês**    |
| Comentários no código                                    | **Inglês**    |
| Mensagens de commit                                      | **Inglês**    |
| **Contrato da API** (rotas, campos JSON, mensagens)      | **Português** |
| Documentação (`.md`), issues e pull requests             | **Português** |
| Textos de interface no frontend                          | **Português** |

### Por que separar assim

O código é lido por quem o mantém; o inglês é a língua franca das bibliotecas que usamos e
evita híbridos como `getAlunoList()`. O contrato da API é lido por quem **consome** — o
frontend, a documentação, o cliente — e ali o português é o que faz sentido para o domínio
(um `Aluno` não é exatamente um `Student` no contexto acadêmico brasileiro).

### Onde as duas línguas se encontram

A tradução acontece **na borda**, no DTO e no controller. Nada mais no sistema fala português.

```
HTTP (português)                    │  Aplicação e domínio (inglês)
────────────────────────────────────┼──────────────────────────────────
POST /api/avaliacoes                │  EvaluationsController
{                                   │  CreateEvaluationUseCase
  "alunoId": "a1b2...",             │  Evaluation { studentId, score }
  "nota": 8.5                       │  EvaluationRepository
}                                   │  evaluations (tabela)
```

```ts
// application/dtos/create-evaluation.dto.ts
// Class name in English, payload fields in Portuguese: they are the public contract.
export class CreateEvaluationDto {
  @IsUUID('4', { message: 'O aluno informado é inválido.' })
  alunoId!: string;

  @IsNumber({}, { message: 'A nota deve ser um número.' })
  @Min(0, { message: 'A nota mínima é 0.' })
  @Max(10, { message: 'A nota máxima é 10.' })
  nota!: number;
}
```

```ts
// infrastructure/http/evaluations.controller.ts
@Post()
create(@Body() dto: CreateEvaluationDto) {
  // The seam: Portuguese contract in, English domain out.
  return this.createEvaluation.execute({ studentId: dto.alunoId, score: dto.nota });
}
```

Regras que decorrem disso:

- **Rotas em português e no plural**: `/api/avaliacoes`, `/api/alunos`, `/api/turmas`.
- **Mensagens de erro e de validação em português** — elas chegam ao usuário final.
- **Colunas do banco em inglês**, como o resto do código. O `@Column({ name: ... })` mapeia
  quando o nome precisar divergir.
- **Nada de português vazando para dentro**: se um caso de uso, uma entidade ou um
  repositório tem um identificador em português, a tradução ficou no lugar errado.

---

## 2. Commits

Formato obrigatório, em inglês, seguindo [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(#<número da issue>): <mensagem>
```

```
feat(#50): create a new module
fix(#72): prevent duplicate enrollment on concurrent requests
docs(#14): describe the migration workflow
test(#50): cover evaluation score boundaries
```

### Tipos

| Tipo       | Quando usar                                                     |
| ---------- | --------------------------------------------------------------- |
| `feat`     | Nova funcionalidade                                             |
| `fix`      | Correção de bug                                                 |
| `docs`     | Apenas documentação                                             |
| `style`    | Formatação, sem mudança de comportamento                        |
| `refactor` | Mudança interna que não corrige bug nem adiciona funcionalidade |
| `perf`     | Melhoria de desempenho                                          |
| `test`     | Adição ou correção de testes                                    |
| `build`    | Build, dependências, Docker                                     |
| `ci`       | Pipeline de integração contínua                                 |
| `chore`    | Manutenção que não entra nas anteriores                         |
| `revert`   | Reversão de um commit anterior                                  |

### Regras

- **O escopo é o número da issue**, com `#`: `feat(#50)`. Não use o módulo como escopo.
- A mensagem é **em inglês**, no **imperativo** e em **minúsculas**: `add`, não `added` nem
  `Adds`. Leia como "se aplicado, este commit vai _create a new module_".
- Sem ponto final.
- Até 72 caracteres no assunto. O que não couber vai para o corpo, separado por linha em branco.
- Um commit, uma mudança coerente. Se o assunto precisa de "and", provavelmente são dois commits.
- Breaking change: `!` antes dos dois-pontos — `feat(#50)!: change evaluation payload` — e
  um rodapé `BREAKING CHANGE:` explicando a migração.

```
❌ Added new module                    → sem tipo, sem issue, passado, maiúscula
❌ feat: create a new module           → falta o número da issue
❌ feat(users): criar novo módulo      → escopo errado e mensagem em português
❌ feat(#50): create a new module.     → ponto final
✅ feat(#50): create a new module
```

### Verificação automática

O hook `commit-msg` valida o formato e **aborta o commit** se ele não bater. Merges, reverts
automáticos e commits de `fixup!`/`squash!` passam direto.

---

## 3. Branches

```
<tipo>/<#issue>-<descrição-curta-em-inglês>
```

```
feat/#50-create-evaluation-module
fix/#72-duplicate-enrollment
```

`main` é protegida: toda mudança entra por pull request com a CI verde.

---

## 4. Limites de tamanho

Limites existem porque tamanho é o sintoma mais confiável de responsabilidade demais num
lugar só. Eles são **verificados pelo ESLint** e quebram o lint — logo, quebram o push e a CI.

| Limite             | Backend | Frontend |
| ------------------ | ------- | -------- |
| Linhas por função  | **20**  | **50**   |
| Linhas por arquivo | **200** | **250**  |

Linhas em branco e comentários **não** contam.

### Por que os números diferem

No backend, 20 linhas é folgado para o que uma função deve fazer: um caso de uso orquestra
meia dúzia de passos e termina. Se não coube, quase sempre há um segundo caso de uso, uma
regra que pertence à entidade, ou uma consulta que pertence ao repositório.

No frontend, o TSX é verboso por natureza — uma lista com estados de carregamento e erro passa
de 20 linhas sem nenhuma complexidade real. Por isso o limite é 50 **para componentes**.
Funções que não retornam TSX (hooks, utils, handlers) devem continuar perto das 20 linhas do
backend: o ESLint não distingue as duas coisas, mas a revisão de código distingue.

### Exceções

O limite é desligado apenas onde ele mediria a coisa errada:

- arquivos de teste (`*.spec.ts`, `*.e2e-spec.ts`, `*.test.tsx`) — um `describe` é um
  agrupamento, não uma função;
- `src/migrations/**` no backend — são geradas pelo TypeORM e não se refatora migration aplicada.

### Quando bater no limite

Não desligue a regra com `eslint-disable`. O limite é o aviso, não o problema. Na ordem:

1. **Extraia uma função** com um nome que explique o bloco extraído.
2. **Mova a regra para onde ela pertence** — invariante de negócio vive na entidade, consulta
   vive no repositório, formatação vive em `utils/`.
3. **Divida o arquivo** — um arquivo de 200 linhas costuma ser duas responsabilidades que
   foram crescendo lado a lado.

Um `eslint-disable` de limite precisa de justificativa no pull request e só se sustenta se o
código for realmente irredutível (raro, mas acontece: uma tabela de constantes, um mapa de
tradução). Nesse caso, prefira mover o dado para um arquivo próprio.

---

## 5. Testes

**Toda feature entra com teste.** Nenhum pull request que adiciona ou muda comportamento é
aprovado sem teste cobrindo esse comportamento — **unitário ou e2e**, o que fizer sentido
para o que mudou. Não é preciso ter os dois.

| Onde     | Fica onde                                   | Como rodar         |
| -------- | ------------------------------------------- | ------------------ |
| Backend  | unitário ao lado do código (`.spec.ts`)     | `npm test`         |
|          | e2e em `backend/test/` (`.e2e-spec.ts`)     | `npm run test:e2e` |
| Frontend | ao lado do arquivo (`.test.ts`/`.test.tsx`) | `npm test`         |

A escolha entre unitário e e2e, como escrever cada um e o que não vale a pena testar estão em
[`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md#6-testes) e
[`frontend/ARCHITECTURE.md`](frontend/ARCHITECTURE.md#7-testes).

Não perseguimos percentual de cobertura. A pergunta que vale na revisão é **"se eu quebrar
esse comportamento, algum teste fica vermelho?"**. Se a resposta for não, falta teste.

---

## 6. Onde cada regra é verificada

| Momento      | O que roda                                                       |
| ------------ | ---------------------------------------------------------------- |
| `commit-msg` | Formato da mensagem de commit                                    |
| `pre-commit` | `eslint --fix` + `prettier --write` nos arquivos em stage        |
| `pre-push`   | `eslint` + `prettier --check` no backend e no frontend           |
| CI           | Lint, formatação, type-check, testes e build nas duas aplicações |
| Revisão      | Idioma, presença de teste, e o que ferramenta nenhuma mede       |

O hook e a CI não sabem ler: `feat(#50): criar novo módulo` passa na validação de formato,
porque a regex não distingue idioma. Idioma e presença de teste são responsabilidade da
revisão de código.

Detalhes específicos de cada lado ficam em [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md)
e [`frontend/ARCHITECTURE.md`](frontend/ARCHITECTURE.md).
