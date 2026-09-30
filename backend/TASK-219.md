# Task #219: associação e remoção de professores

Issue: https://github.com/FelipeBastosz/PBL360/issues/219

## Escopo

- Validar existência e perfil de professor ao associar.
- Impedir associação duplicada.
- Permitir somente ao responsável alterar os vínculos.
- Impedir remover o responsável e manter ao menos um professor na sala.
- Registrar quem realizou cada associação ou remoção.

## Implementação iniciada

A validação do professor, a autorização do responsável, a duplicidade e o bloqueio da remoção do responsável já existiam na base. Esta task estende as operações do repositório com o ID do professor autenticado e adiciona uma trilha de eventos append-only em `room_tutor_events`.

Cada alteração real grava a mudança de vínculo e seu evento na mesma instrução SQL. Assim, duplicidade, remoção de vínculo inexistente e tentativa de remover o responsável não geram eventos falsos. A criação de uma sala também registra a associação do responsável.

A tabela de eventos conserva IDs e horário sem chave estrangeira para preservar o histórico depois que um vínculo ou uma conta for removida. Não é possível recuperar com segurança quem associou professores antes da migração; a implementação não inventa esse histórico.

## Verificações

Os testes unitários verificam que o ator autenticado é encaminhado ao repositório nas operações de associação e remoção. Os testes E2E verificam ator e ação registrados, ausência de eventos em associação duplicada e tentativa de remoção do responsável.

## Resultados

- `npm run lint`: passou.
- `npm run format:check`: passou.
- `npm test -- --runInBand`: 52 suítes e 284 testes passaram.
- `npm run build`: passou.
- Migration aplicada no banco de teste; `typeorm schema:log` confirmou que o schema está atualizado.
- `npm run test:e2e -- --runInBand`: 9 suítes e 171 testes passaram.

`npx tsc --noEmit` ainda aponta erros preexistentes em specs de performance-tables e problems, além de tipos no E2E de problems e rooms. O build e os testes E2E passam; esses erros não foram introduzidos pela task.

Estado: implementação concluída e validada localmente. Ainda não foi aberta PR.
