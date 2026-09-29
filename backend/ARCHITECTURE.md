# Arquitetura do Backend

Este documento descreve **como o código do backend é organizado e por quê**. Ele é a
referência para revisões de código: um pull request que contraria o que está aqui deve
mudar o código ou mudar este documento — nunca simplesmente ignorá-lo.

As convenções que valem para o repositório inteiro — idioma, formato de commit, limites de
tamanho — estão em [`../CONVENTIONS.md`](../CONVENTIONS.md).

---

## 1. Visão geral

O backend segue **Clean Architecture** com conceitos de **DDD (Domain-Driven Design)**,
organizado de forma **modular por funcionalidade** (_feature-based_).

A ideia central é simples: **as regras de negócio não conhecem o mundo exterior.** Elas não
sabem que existe HTTP, nem PostgreSQL, nem NestJS. Quem conhece o mundo exterior é a borda
da aplicação — e a borda depende do núcleo, nunca o contrário.

```
                  ┌──────────────────────────────────────┐
                  │           infrastructure             │  HTTP, TypeORM, filas,
                  │   (controllers, repos concretos)     │  serviços externos
                  │   ┌──────────────────────────────┐   │
                  │   │        application            │   │  casos de uso, DTOs
                  │   │   ┌──────────────────────┐    │   │
                  │   │   │       domain          │    │   │  entidades, regras,
                  │   │   │  (regras de negócio)  │    │   │  contratos de repositório
                  │   │   └──────────────────────┘    │   │
                  │   └──────────────────────────────┘   │
                  └──────────────────────────────────────┘

                  Dependências apontam SEMPRE para dentro →
```

### A regra da dependência

| Camada           | Pode importar de          | **Não pode** importar de                         |
| ---------------- | ------------------------- | ------------------------------------------------ |
| `domain`         | nada (só TypeScript puro) | `application`, `infrastructure`, NestJS, TypeORM |
| `application`    | `domain`                  | `infrastructure`                                 |
| `infrastructure` | `application`, `domain`   | —                                                |

Se você precisar "só dessa vez" importar o `Repository` do TypeORM dentro de um caso de uso,
pare: é sinal de que falta uma abstração no `domain`.

---

## 2. Estrutura de pastas

```
backend/
├── src/
│   ├── auth/                       # Módulo de autenticação
│   │   ├── application/
│   │   │   ├── dtos/
│   │   │   └── use-cases/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── services/           # Interfaces de serviços externos (EmailVerificationSender)
│   │   ├── infrastructure/
│   │   │   ├── email/              # Implementações concretas de envio (Nodemailer)
│   │   │   ├── security/           # Implementações de criptografia (Bcrypt, JWT)
│   │   │   └── http/               # Controllers
│   │   └── auth.module.ts
│   ├── config/                  # configuração da aplicação e do TypeORM
│   │   ├── env.config.ts        #   variáveis de ambiente tipadas
│   │   ├── typeorm.config.ts    #   opções de conexão usadas pelo Nest
│   │   └── data-source.ts       #   DataSource usado pela CLI de migrations
│   │
│   ├── migrations/              # histórico versionado do schema do banco
│   │
│   ├── shared/                  # código transversal, sem regra de negócio
│   │   ├── decorators/
│   │   ├── filters/             #   exception filters
│   │   ├── guards/              #   autenticação e autorização
│   │   ├── interceptors/        #   logging, serialização, timeout
│   │   ├── middlewares/         #   o que roda antes do roteamento (log de requisição)
│   │   ├── pipes/
│   │   └── constants/
│   │
│   ├── <feature>/               # UM módulo por contexto de negócio
│   │   ├── application/
│   │   │   ├── dtos/            #   contratos de entrada/saída + validação
│   │   │   └── use-cases/       #   orquestração de um caso de uso
│   │   ├── domain/
│   │   │   ├── entities/        #   entidades e regras de negócio
│   │   │   └── repositories/    #   INTERFACES de persistência (contratos)
│   │   ├── infrastructure/
│   │   │   ├── database/        #   implementações TypeORM dos repositórios
│   │   │   └── http/            #   controllers
│   │   └── <feature>.module.ts  #   wiring: providers, imports, exports
│   │                            #   testes unitários (*.spec.ts) ficam ao lado do código
│   │
│   ├── app.module.ts            # módulo raiz
│   └── main.ts                  # bootstrap
│
└── test/                        # testes e2e (*.e2e-spec.ts) + jest-e2e.json
```

> Para criar um módulo novo, use `rooms/` ou `problems/` como referência: são os módulos que
> seguem todas as convenções deste documento (DTO de resposta, mapper, arquivo swagger,
> `RoomAccessService` e e2e próprio).

### O log de requisições

`shared/middlewares/http-logger.middleware.ts` registra **uma linha por requisição** —
método, rota, status, duração, tamanho da resposta e IP de origem — e o `app.module.ts` o
aplica a **todas as rotas**:

```ts
// app.module.ts — '{*splat}' é o curinga do Express 5.
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('{*splat}');
  }
}
```

```
[Nest] 12345  - 18/09/2026, 20:04:11   LOG [HTTP] GET /api/alunos 200 - 12.4ms - 145b - ::1
[Nest] 12345  - 18/09/2026, 20:04:19  WARN [HTTP] POST /api/alunos 400 - 3.1ms - 92b - ::1
```

**Middleware** porque ele roda antes do roteamento: assim uma requisição
que não casa com controller nenhum (404) também aparece no log. O nível acompanha o status
(5xx `error`, 4xx `warn`, o resto `log`), a linha sai no `finish` da resposta — antes disso
o status ainda pode mudar — e **corpo e cabeçalhos ficam de fora**, porque carregam
credenciais e dado pessoal. Um módulo de feature não precisa fazer nada para ser logado.

---

## 3. As camadas em detalhe

### 3.1 `domain` — o coração

É a camada que descreve **o negócio**, e a única que sobreviveria a uma troca completa de
framework e de banco.

**`domain/entities/`** — as entidades. Uma entidade protege suas próprias invariantes: se um
`Student` não pode existir sem matrícula, quem garante isso é o `Student`, não o controller.
O nome da classe é inglês; o campo que aparece na API é que será `matricula`.

```
user.entity.ts        # a entidade e suas regras
user.entity.spec.ts   # os testes das regras, ao lado
```

Decoradores do TypeORM (`@Entity`, `@Column`) **podem** ficar na entidade de domínio — é o
custo aceito por não manter dois modelos paralelos num projeto deste porte. O que não pode é
a entidade conter consultas, HTTP ou qualquer chamada a serviço externo.

**`domain/services/`** — contratos de serviços externos à aplicação (ex.: envio de e-mails, emissão de tokens). Assim como os repositórios, os serviços declaram apenas interfaces puras em TypeScript acompanhadas do seu respectivo injection token (`Symbol`). O domínio desconhece bibliotecas como Nodemailer ou APIs externas.

**`domain/repositories/`** — apenas **interfaces**. O domínio declara _o que_ precisa da
persistência; a infraestrutura decide _como_.

```ts
// user.repository.ts — the contract, free of TypeORM
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Injection token: the interface itself does not survive compilation.
export const USER_REPOSITORY = Symbol('UserRepository');
```

**Interface + token, sempre juntos no mesmo arquivo.** Uma `interface` do TypeScript não
existe em tempo de execução: ela some na compilação e o Nest não tem o que usar como chave do
container. Por isso cada contrato vem acompanhado de um `Symbol` exportado, que é o token real
da injeção.

O `Symbol` é preferível a uma string (`'USER_REPOSITORY'`) porque é único por definição —
duas features com um `Repository` de mesmo nome nunca colidem no container.

### 3.2 `application` — os casos de uso

**`application/use-cases/`** — um arquivo, uma classe, **um caso de uso**. A classe tem um
único método público (`execute`). Ela orquestra: valida pré-condições, chama o domínio,
persiste pelo repositório, devolve o resultado. Não formata resposta HTTP e não escreve SQL.

```ts
@Injectable()
export class CreateUserUseCase {
  // The interface as the type, the token as the key: the abstraction, never the impl.
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> { ... }
}
```

O `@Inject(USER_REPOSITORY)` é obrigatório: sem ele o Nest tentaria resolver pelo tipo, e o
tipo — a interface — não chega ao runtime.

O limite de 20 linhas por função não é arbitrário aqui: um `execute` que não cabe nele
quase sempre é dois casos de uso.

**`application/dtos/`** — o contrato de entrada e saída, validado com `class-validator`.
O DTO é a fronteira: nada entra na aplicação sem passar por ele. O `ValidationPipe` global
(configurado em `main.ts` com `whitelist` e `forbidNonWhitelisted`) rejeita qualquer campo
não declarado — por isso o DTO precisa ser exato.

### 3.3 `infrastructure` — os detalhes

**`infrastructure/http/`** — os controllers. Um controller é **fino**: recebe a requisição,
delega ao caso de uso, devolve o resultado. Sem `if` de regra de negócio, sem acesso a
repositório.

```ts
@Controller('usuarios')
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    // The seam: Portuguese payload in, English domain out.
    return this.createUser.execute({ name: dto.nome, email: dto.email });
  }
}
```

**Documentação Swagger fora do controller**

A documentação OpenAPI de cada rota (`@ApiOperation`, `@ApiBody`, `@Api*Response`,
`@ApiBearerAuth`) **não fica no controller**. Ela vive em um arquivo `<feature>.swagger.ts`,
ao lado do controller em `infrastructure/http/`, e cada rota ganha um decorator composto
com `applyDecorators`. Assim o controller continua legível: só rota, guards, papéis e a
chamada ao caso de uso.

```ts
// infrastructure/http/room.swagger.ts
export const DeleteRoomSwaggerDocs = applyDecorators(
  ApiBearerAuth(JWT_SECURITY_SCHEME),
  ApiOperation({ summary: 'Exclui uma sala', description: '...' }),
  ApiNoContentResponse({ description: 'Sala excluída com sucesso.' }),
  ApiForbiddenResponse({ description: '...', type: ErrorResponseDto }),
);
```

```ts
// infrastructure/http/rooms.controller.ts
@Delete(':id')
@Roles(UserType.TUTOR)
@DeleteRoomSwaggerDocs
remove(@Param('id', new ParseUUIDPipe()) id: string) { ... }
```

Regras:

- Um arquivo `.swagger.ts` por controller; o controller importa de `@nestjs/swagger`
  apenas o `@ApiTags`, que continua na classe.
- O nome da constante segue `<Ação><Recurso>SwaggerDocs` (ex.: `CreateRoomSwaggerDocs`,
  `LoginAuthSwaggerDocs`) e é aplicado sem parênteses: `@CreateRoomSwaggerDocs`.
- Decorators que mudam o comportamento da rota (`@Roles`, `@Public`, `@HttpCode`,
  `@Throttle`, `@UseGuards`) **ficam no controller** — o arquivo swagger só documenta.

**`infrastructure/database/`** — as implementações concretas dos repositórios, usando
TypeORM. É o único lugar do módulo onde `Repository`, `QueryBuilder` e SQL aparecem.

**Mapeamento e Repositórios com SQL Puro**

Os repositórios usam SQL puro (`repository.query`) e se chamam `Pg<Entidade>Repository`
(`pg-user.repository.ts`). Cada arquivo declara uma interface `Row` com exatamente as
colunas que a query devolve (com `AS "camelCase"`) e converte a linha em entidade num único
ponto (`toEntity`). Isso elimina `any` e mantém a tipagem estrita:

```ts
// infrastructure/database/pg-room.repository.ts
interface RoomRow {
  id: string;
  tutorId: string;
  name: string;
  deletedAt: Date | null;
}

const ROOM_COLUMNS = `id, tutor_id AS "tutorId", name, deleted_at AS "deletedAt"`;
```

Regras do repositório:

- **Toda coluna que a entidade usa entra no `SELECT`.** Uma coluna esquecida vira `undefined`
  na entidade e quebra regras em silêncio (foi assim que salas excluídas continuaram
  acessíveis).
- **Um método por intenção de escrita**: `create`, `update`, `softDelete`. Nunca um `save`
  que decide sozinho entre `INSERT` e `UPDATE`.
- **Operações concorrentes são atômicas no SQL**: `ON CONFLICT DO NOTHING RETURNING`,
  `UPDATE ... WHERE attempts < $2 RETURNING` e o boolean devolvido diz se a operação
  aconteceu. "Lê, confere em memória e grava" perde para duas requisições simultâneas.
- **Violação de UNIQUE vira `ConflictError`** no próprio repositório (use
  `violatedUniqueConstraint` de `@/shared/database/unique-violation`); o cliente recebe 409,
  nunca 500.
- **Datas sem horário** (`DATE`) trafegam como texto `AAAA-MM-DD`. Converter para `Date`
  aplica o fuso do servidor e grava o dia anterior.

**Arquivos binários (foto do carômetro)**

A foto do usuário é gravada no próprio banco, na tabela `user_photos` (`bytea`), separada de
`users` para que nenhuma consulta de usuário carregue a imagem sem querer — o `SELECT` de
`users` só expõe `hasPhoto`. O upload chega como `multipart/form-data` no campo `foto` do
cadastro (`@PhotoUpload()`, memória, limite de 2 MB) e o formato é detectado pela assinatura
dos bytes em `UserPhoto.fromBytes`, nunca pelo `Content-Type` informado pelo cliente. A imagem
é servida autenticada em `GET /usuarios/{id}/foto`: o próprio usuário e os professores podem vê-la.

### 3.4 O módulo — onde as pontas se encontram

A inversão de dependência acontece no `*.module.ts`, ligando a abstração do domínio à
implementação da infraestrutura:

```ts
// infrastructure/database/pg-user.repository.ts
@Injectable()
export class PgUserRepository implements UserRepository { ... }
```

```ts
// users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [CreateUserUseCase, { provide: USER_REPOSITORY, useClass: PgUserRepository }],
})
export class UsersModule {}
```

Esse `provide/useClass` é o ponto em que toda a arquitetura se sustenta: o caso de uso pede
`USER_REPOSITORY` e recebe o que o módulo decidir — a implementação real em produção, um
dublê em teste. O `implements UserRepository` garante em tempo de compilação que o dublê e a
implementação real cumprem o mesmo contrato.

### 3.5 Segurança na borda (autenticação e autorização)

A segurança (validação de tokens e verificação de perfis) acontece só na borda. As regras de
negócio não lidam com cabeçalhos HTTP nem com JWT.

**Os guards são globais.** `AuthGuard` e `RolesGuard` estão registrados como `APP_GUARD` no
`AppModule`, nessa ordem. Toda rota exige um JWT válido, a menos que seja marcada com
`@Public()`. Um controller novo nasce protegido; ninguém precisa lembrar de `@UseGuards`.

- **`AuthGuard`** aceita apenas tokens de acesso (`audience: pbl360:access`), recarrega o
  usuário do banco e confere se ele existe, está ativo e se a versão do token (`ver`) é a
  atual. Trocar a senha ou desativar a conta incrementa `users.token_version` e derruba todas
  as sessões abertas.
- **`RolesGuard`** confere o `type` do usuário contra `@Roles(...)`, que pode ficar na classe
  ou no método.
- **Tokens com finalidades diferentes têm `audience` diferentes.** O token de redefinição de
  senha (`pbl360:password-reset`) nunca é aceito como sessão, e vice-versa.
- **Rotas públicas de autenticação** usam o `IdentityThrottlerGuard`, que limita por IP +
  e-mail (ou `usuarioId`): 10 tentativas a cada 15 minutos, ou 5 nas rotas de código. Assim uma
  turma inteira atrás do mesmo NAT não bloqueia a si mesma.
- **Códigos de verificação e de recuperação** passam pelo `OneTimeCodeService`: só o hash
  SHA-256 é gravado, cada código aceita 5 tentativas (consumidas atomicamente), há um intervalo
  mínimo de 60 s entre envios e um teto de 5 códigos por hora por conta.
- **Cadastro com e-mail já existente responde 409.** É uma decisão consciente: o domínio é
  fechado (e-mails institucionais), e a mensagem clara vale mais para o aluno do que esconder
  quem tem conta. Login, reenvio e recuperação continuam com resposta única e tempo
  equivalente, para não revelar contas.

```ts
@ApiTags('Salas')
@Controller('salas')
@Roles(UserType.TUTOR)
export class RoomsController {
  @Get()
  list(@AuthenticatedUserId() tutorId: string) { ... }
}

@Controller('autenticacao')
@Public()
@UseGuards(IdentityThrottlerGuard)
export class AuthController { ... }
```

### 3.6 Registro de Autoria e Auditoria (US43 / Task #136)

Para garantir que tudo o que um professor criar ou alterar fique estritamente associado a ele — permitindo rastreabilidade e auditoria quando houver múltiplos professores na mesma sala —, todas as funcionalidades devem seguir um padrão único de identificação e persistência de autoria:

1. **Obtenção Segura do Autor**: O identificador do autor NUNCA é recebido no corpo da requisição (`Body`) para evitar que um usuário forje ações em nome de outro. Ele deve ser obtido exclusivamente do token JWT autenticado no controller através do decorator `@AuthenticatedUserId()` (em `@/shared/decorators/`). O DTO não declara campos como `tutorId` ou `autorId`; como o `ValidationPipe` usa `forbidNonWhitelisted`, um cliente que tente enviá-los recebe 400.
2. **Campos Padrão de Autoria em Entidades**: Entidades criadas ou alteradas no sistema que demandam rastreabilidade de ações (como problemas, feedbacks, notas e configurações) devem implementar os campos padronizados descritos na interface `Auditable` (`@/shared/interfaces/auditable.interface.ts`):
   - `createdBy` (`created_by` no banco, tipo `UUID` referenciando `users`): Usuário que criou o recurso.
   - `createdAt` (`created_at` no banco, tipo `timestamptz`): Data/hora de criação.
   - `updatedBy` (`updated_by` no banco, tipo `UUID` referenciando `users`, opcional): Usuário que realizou a última modificação.
   - `updatedAt` (`updated_at` no banco, tipo `timestamptz`, opcional): Data/hora da última alteração.
3. **Validação de Permissão e Vínculo com a Sala**: Toda ação sobre uma sala ou sobre recursos dela passa pelo `RoomAccessService` (exportado pelo `RoomsModule`). `assertTutorCanAccessRoom` libera qualquer professor vinculado; `assertTutorIsRoomOwner` libera só o responsável (excluir a sala, gerenciar professores). Os dois respondem `NotFoundError` para sala inexistente ou excluída e `ForbiddenError` para quem não tem vínculo. Nenhum caso de uso reimplementa essa checagem.

Exemplo de uso no Controller e Caso de Uso:

```ts
@Post()
@Roles(UserType.TUTOR)
async create(
  @UuidParam('roomId') roomId: string,
  @Body() dto: CreateProblemDto,
  @AuthenticatedUserId() authorId: string,
) {
  return this.createProblemUseCase.execute({
    roomId,
    authorId,
    title: dto.titulo,
  });
}
```

---

## 4. Criando um novo módulo — passo a passo

1. `mkdir -p src/<feature>/{application/{dtos,use-cases},domain/{entities,repositories},infrastructure/{database,http}}`
2. Escreva a **entidade** e suas regras em `domain/entities/`.
3. Declare o **contrato do repositório** (interface + token) em `domain/repositories/`.
4. Escreva o **caso de uso** em `application/use-cases/`, dependendo da abstração.
5. Escreva o **DTO** em `application/dtos/`.
6. Implemente o **repositório TypeORM** em `infrastructure/database/`.
7. Escreva o **controller** em `infrastructure/http/`, com a documentação Swagger em
   `<feature>.swagger.ts` ao lado dele.
8. Monte o `<feature>.module.ts` e registre-o em `app.module.ts`.
9. Gere e revise a **migration**.
10. Escreva os **testes** — unitário ao lado do código, e2e em `test/`. A feature não está
    pronta sem eles (veja [6. Testes](#6-testes)).

A ordem importa: começar pelo domínio evita que decisões de banco vazem para as regras.

### Nomenclatura

| Tipo                | Arquivo                                   | Identificador                       |
| ------------------- | ----------------------------------------- | ----------------------------------- |
| Entidade            | `user.entity.ts`                          | `User`                              |
| Contrato de repo    | `user.repository.ts`                      | `UserRepository`                    |
| Token de injeção    | (no mesmo arquivo do contrato)            | `USER_REPOSITORY`                   |
| Repositório         | `pg-user.repository.ts`                   | `PgUserRepository`                  |
| Caso de uso         | `create-user.use-case.ts`                 | `CreateUserUseCase`                 |
| DTO                 | `create-user.dto.ts`                      | `CreateUserDto`                     |
| Controller          | `users.controller.ts`                     | `UsersController`                   |
| DTO de resposta     | `user-response.dto.ts`                    | `UserResponseDto`                   |
| Mapper HTTP         | `user.mapper.ts`                          | `toUserResponse`                    |
| Docs Swagger        | `user.swagger.ts`                         | `CreateUserSwaggerDocs`             |
| Módulo              | `users.module.ts`                         | `UsersModule`                       |
| Migration           | `1712345678901-CreateUsers.ts`            | `CreateUsers...`                    |
| Middleware          | `http-logger.middleware.ts`               | `HttpLoggerMiddleware`              |
| Teste unitário      | `create-user.use-case.spec.ts`            | —                                   |
| Teste e2e           | `users.e2e-spec.ts`                       | —                                   |
| Contrato de serviço | `email-verification-sender.ts`            | `EmailVerificationSender`           |
| Token de serviço    | `email-verification-sender.ts`            | `EMAIL_VERIFICATION_SENDER`         |
| Serviço concreto    | `nodemailer-email-verification-sender.ts` | `NodemailerEmailVerificationSender` |

Arquivos em `kebab-case`, classes e interfaces em `PascalCase`, tokens em
`SCREAMING_SNAKE_CASE`, pastas no plural quando agrupam itens (`entities/`, `use-cases/`).

---

## 5. Boas práticas de código limpo

### Idioma

**Código em inglês, contrato da API em português.** Classes, métodos, variáveis, arquivos,
colunas do banco e comentários: inglês. Rotas, campos do JSON e mensagens de validação e de
erro: português, porque são o que o consumidor da API lê.

A tradução acontece **na borda** — no DTO e no controller:

```ts
// Portuguese contract in, English domain out.
@Post()
create(@Body() dto: CreateEvaluationDto) {
  return this.createEvaluation.execute({ studentId: dto.alunoId, score: dto.nota });
}
```

Se um identificador em português aparece dentro de `application/` ou `domain/`, a tradução
ficou no lugar errado. Regra completa em [`../CONVENTIONS.md`](../CONVENTIONS.md#1-idioma).

### Nomes

Nomes descrevem intenção, não implementação. `findActiveStudents()` diz o que se quer;
`getUsersWhereStatusEqualsOne()` vaza o banco para dentro do nome. Evite abreviações
(`usr`, `tmp`, `d`) e nomes genéricos (`data`, `info`, `manager`, `helper`). Um booleano se
lê como afirmação: `isEnrolled`, `hasPendingReview`.

### Funções

Uma função faz **uma coisa**, num **único nível de abstração**. Se você precisa de um
comentário para separar "partes" dela, essas partes são funções.

Prefira retorno antecipado a aninhamento:

```ts
// avoid                          // prefer
if (user) {
  if (!user) throw new NotFoundError('...');
  if (user.isActive) {
    if (!user.isActive) throw new ForbiddenError('...');
    // ...                        // ...
  }
}
```

Mais de 3 parâmetros normalmente indica um objeto faltando.

### Comentários

Comente **por quê**, nunca **o quê** — o código já diz o quê, e comentários que repetem o
código envelhecem e mentem.

```ts
// bad:   increments the counter
// good:  the upstream API caps at 5 req/s; this backoff avoids a batch-wide 429
```

### Tipagem

`strict` está ligado e é para permanecer assim. `any` é uma renúncia à verificação: use
`unknown` e estreite o tipo. Evite `as` — se o compilador discorda de você, normalmente ele
está certo. Prefira `import type` para imports usados apenas como tipo (o ESLint corrige
automaticamente).

### Erros

A camada `application` não conhece HTTP: ela lança os erros de `@/shared/errors/application.error`
(`InvalidRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
`ConflictError`). O domínio lança subclasses de `DomainError` (por exemplo `InvalidRoomError`).
O `DomainExceptionFilter` global traduz cada um no status correspondente (400, 401, 403, 404,
409; `DomainError` vira 400), no mesmo formato de corpo das exceções do Nest. Exceções HTTP do
Nest (`NotFoundException` etc.) só aparecem na borda: guards, pipes e filtros. Um erro de
domínio que não estende `DomainError` escapa do filtro e vira 500.

Quando a resposta de erro precisa de campos extras, o erro de aplicação carrega os dados em
inglês e um filtro do próprio controller monta o corpo em português (veja
`PendingVerificationFilter` em `auth/infrastructure/http/`).

Nunca engula uma exceção com um `catch` vazio, e nunca devolva `null` para sinalizar erro sem
que a assinatura diga isso.

### Contrato de resposta

Controllers nunca devolvem entidades. Cada módulo tem DTOs de resposta em português em
`application/dtos/` (`RoomResponseDto`, `ProblemResponseDto`) e um mapper em
`infrastructure/http/` (`room.mapper.ts`) que traduz a entidade na borda. Casos de uso
devolvem entidades ou valores de domínio, nunca `{ message, data }`. Parâmetros de rota com
UUID usam `@UuidParam('id')`, que responde 400 em português para um id inválido.

### Efeitos colaterais e imutabilidade

Funções que consultam não modificam; funções que modificam não devolvem consulta disfarçada.
Trate parâmetros como imutáveis — crie um novo objeto em vez de mutar o recebido.

### Tamanho

| Limite             | Valor   | Verificado por                    |
| ------------------ | ------- | --------------------------------- |
| Linhas por função  | **20**  | ESLint (`max-lines-per-function`) |
| Linhas por arquivo | **200** | ESLint (`max-lines`)              |

Linhas em branco e comentários não contam. **São erros de lint**, não sugestões: quebram o
`pre-push` e a CI. Testes e migrations são exceção.

Vinte linhas é folgado para o que uma função do backend deve fazer. Quando não couber, o
problema quase nunca é o limite:

- o caso de uso virou dois casos de uso;
- há uma invariante que pertence à entidade;
- há uma consulta que pertence ao repositório.

Extraia com um nome que explique o bloco extraído, em vez de desligar a regra com
`eslint-disable`. Como sinal adicional que o ESLint não mede: classe acima de ~5 métodos
públicos costuma ser mais de uma responsabilidade.

Detalhes e exceções em [`../CONVENTIONS.md`](../CONVENTIONS.md#4-limites-de-tamanho).

### O que **não** fazer

- Regra de negócio dentro de controller.
- Caso de uso importando `Repository` do TypeORM.
- Entidade de domínio importando de `infrastructure`.
- `synchronize: true` — o schema muda por migration revisada.
- Segredo em código: tudo vem de variável de ambiente.
- `console.log` em código de produção — use o `Logger` do Nest.
- Import relativo profundo (`../../../`) — use o alias `@/`.
- Identificador em português dentro de `domain/` ou `application/`.
- `eslint-disable` para escapar do limite de linhas — extraia a função.

---

## 6. Testes

> **Regra do projeto: toda feature entra com teste.** Nenhum pull request que adiciona ou
> muda comportamento é aprovado sem teste **unitário ou e2e** cobrindo esse comportamento.
> Não é preciso ter os dois — é preciso ter o que faz sentido para o que mudou (o critério
> está em [6.2 Qual dos dois escrever](#62-qual-dos-dois-escrever)).

### 6.1 Onde cada teste mora

| Tipo         | Onde                                      | Sufixo         | Roda contra                 |
| ------------ | ----------------------------------------- | -------------- | --------------------------- |
| **Unitário** | **ao lado do arquivo testado**, em `src/` | `.spec.ts`     | dublês; sem banco, sem HTTP |
| **E2E**      | **`test/`**, na raiz do backend           | `.e2e-spec.ts` | aplicação real + PostgreSQL |

```
src/users/
├── application/use-cases/
│   ├── create-user.use-case.ts
│   └── create-user.use-case.spec.ts      ← unitário, colado no código
└── domain/entities/
    ├── user.entity.ts
    └── user.entity.spec.ts               ← unitário, colado no código

test/
├── users.e2e-spec.ts                     ← e2e, fora de src/
└── jest-e2e.json
```

O unitário fica colado no código de propósito: quem mexe no arquivo vê o teste, e um arquivo
sem `.spec.ts` ao lado fica visivelmente sem cobertura. O e2e fica em `test/` porque não
pertence a nenhum módulo — ele exercita a aplicação inteira.

As duas suítes têm configurações separadas: a unitária está no bloco `jest` do
`package.json` (`rootDir: src`), a e2e em `test/jest-e2e.json`. Por isso `npm test` nunca
tenta subir o banco, e o e2e nunca roda por engano em watch mode.

### 6.2 Qual dos dois escrever

| Você mexeu em...                                  | Escreva                                         |
| ------------------------------------------------- | ----------------------------------------------- |
| Regra numa entidade (`domain/entities/`)          | **Unitário** — é o teste mais barato que existe |
| Ramificação num caso de uso                       | **Unitário**, com repositório dublê             |
| Endpoint novo, status HTTP, validação de DTO      | **E2E**                                         |
| Repositório TypeORM (query, join, filtro)         | **E2E** — testar SQL com dublê não prova nada   |
| Guard, interceptor, middleware, filtro de exceção | **E2E**                                         |
| Controller que só delega                          | Nada a mais; o e2e do endpoint já cobre         |

Na dúvida: se o valor do código está na **decisão** que ele toma, teste unitário; se está na
**integração** entre peças, teste e2e.

### 6.3 Como escrever um unitário

Um comportamento por teste, no formato _arrange / act / assert_. O nome descreve o
comportamento esperado, não o método.

```ts
// create-user.use-case.spec.ts
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let users: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    // The double only needs to satisfy the interface.
    users = { findByEmail: jest.fn(), save: jest.fn() } as jest.Mocked<UserRepository>;

    const moduleRef = await Test.createTestingModule({
      providers: [CreateUserUseCase, { provide: USER_REPOSITORY, useValue: users }],
    }).compile();

    useCase = moduleRef.get(CreateUserUseCase);
  });

  it('rejects an e-mail that is already registered', async () => {
    users.findByEmail.mockResolvedValue(anExistingUser());

    await expect(useCase.execute(input)).rejects.toThrow(ConflictError);
    expect(users.save).not.toHaveBeenCalled();
  });
});
```

É aqui que a arquitetura se paga: trocar o repositório real por um dublê é **uma linha**
(`useValue: users`), porque o caso de uso nunca soube que TypeORM existia. Sem banco, sem
container, sem mock de biblioteca — o teste roda em milissegundos.

Regras:

- **Um comportamento por `it`.** Se o nome precisa de "e", são dois testes.
- **Nome em inglês, descrevendo o comportamento**: `'rejects an e-mail that is already
registered'`, não `'testa execute'`.
- **Teste pelo contrato público.** Se o teste precisa alcançar um membro privado, o desenho
  é que está pedindo ajuda.
- **Sem lógica no teste** — nada de `if` ou `for` decidindo o que verificar.
- O limite de linhas não vale em `.spec.ts` (um `describe` é agrupamento, não função), mas o
  bom senso vale: arquivo de teste gigante costuma testar demais de uma vez só.

### 6.4 Como escrever um e2e

O e2e sobe a aplicação de verdade e bate nela por HTTP, com `supertest`.

```ts
// test/rooms.e2e-spec.ts
describe('Rooms (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let owner: TestUser;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(moduleRef.get(DataSource));
    owner = await insertUser(app, moduleRef.get(DataSource), 'carlos@uefs.br');
  });

  it('refuses a tutor id sent in the body', () => {
    return api(app, owner)
      .post('/salas', { ...NEW_ROOM, tutorId: 'x' })
      .expect(400);
  });
});
```

Regras:

- **Suba a aplicação com `createTestApp()`** (`test/helpers/create-test-app.ts`). Ele aplica o
  mesmo `configureApp` do `main.ts` (prefixo, `helmet`, CORS, `ValidationPipe`, filtros), então
  o teste exercita exatamente o que roda em produção. Para trocar um provider, passe um
  customizador: `createTestApp((b) => b.overrideProvider(X).useValue(y))`.
- **Use os helpers de `test/helpers/fixtures.ts`** (`cleanDatabase`, `insertUser`, `api`,
  `signAccessToken`) em vez de repetir SQL e montagem de token em cada arquivo.
- **O e2e nunca toca no banco de desenvolvimento.** O `test/setup-e2e.ts` força um `DB_NAME`
  terminado em `_test` (padrão `pbl360_test`). Crie esse banco e rode as migrations nele uma
  vez: `DB_NAME=pbl360_test npm run migration:run`.
- **Sempre `await app.close()`** no `afterAll`, senão o Jest fica pendurado.
- **Cada teste cuida do próprio estado.** Limpe as tabelas no `beforeEach`; nunca dependa da
  ordem dos testes nem do que sobrou do anterior.
- **Use as rotas e os campos em português** — é o contrato real que está sendo verificado.
- **Não teste SQL com dublê.** Repositório se testa no e2e, contra o PostgreSQL de verdade;
  um unitário que compara strings de SQL com um mock não prova nada.
- O e2e roda com `--runInBand` (um arquivo por vez) justamente para que dois testes não
  disputem o mesmo banco.

### 6.5 Como rodar

```bash
npm test                 # unitários; rápido, sem banco
npm run test:watch       # unitários em watch — o loop do dia a dia
npm run test:cov         # unitários + relatório de cobertura em coverage/
npm run test:e2e         # e2e; PRECISA do PostgreSQL no ar

npm test -- create-user  # só os arquivos cujo caminho casa com "create-user"
npm test -- -t 'rejects' # só os testes cujo nome casa com "rejects"
```

O e2e precisa de banco. Na raiz do repositório:

```bash
npm run db:up                                            # sobe o PostgreSQL
DB_NAME=pbl360_test npm --prefix backend run migration:run  # uma vez, no banco de teste
npm --prefix backend run test:e2e
```

Na CI os dois rodam a cada push, com um serviço PostgreSQL dedicado e o banco `pbl360_test`.
Um teste que passa só na sua máquina não passou.

### 6.6 O que priorizar

Regras de negócio nas entidades e ramificações dos casos de uso — é onde os defeitos custam
caro e onde o teste é mais barato. Controllers finos e repositórios que só delegam ao TypeORM
rendem pouco em teste unitário; cubra-os no e2e.

Não perseguimos um percentual de cobertura: 100% de cobertura com asserção fraca é pior do
que 60% nos lugares certos. A pergunta útil não é "quantas linhas foram executadas", é
**"se eu quebrar essa regra, algum teste fica vermelho?"**. Se a resposta for não, falta teste.

---

## 7. Configuração

Nada de `process.env` espalhado pelo código. As variáveis são lidas e tipadas uma vez em
`src/config/env.config.ts` (via `registerAs` do `@nestjs/config`) e consumidas por injeção
do `ConfigService`. Toda variável nova entra também no `.env.example`, documentada.

O `validateEnv` (`src/config/env.validation.ts`) roda na inicialização e **aborta o boot**
quando algo está errado, em vez de cair num padrão que enfraquece a aplicação:

- `JWT_SECRET` é sempre obrigatório; em produção precisa ter ao menos 32 caracteres e não pode
  ser o valor do `.env.example`. Não existe segredo padrão no código.
- Números (`PORT`, `DB_PORT`, `BCRYPT_ROUNDS`) precisam ser inteiros.
- Em produção, banco, `CORS_ORIGIN` e SMTP são obrigatórios, e `DB_SYNCHRONIZE=true` é recusado.
- O CLI de migrations usa `validateDatabaseEnv`, que confere só a parte de banco.

Em produção o Swagger não é publicado, e o seed (`npm run seed`) se recusa a rodar.
