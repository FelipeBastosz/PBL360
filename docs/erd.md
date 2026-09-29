# Diagrama entidade-relacionamento

Reflete o esquema gerado pelas migrations até `ExtendPerformanceTablesAndLinkProblems`.

```mermaid
erDiagram
    users ||--o{ rooms : "responsável (tutor_id)"
    users ||--o{ room_tutors : "professor"
    rooms ||--o{ room_tutors : "professores"
    users ||--o{ room_students : "aluno"
    rooms ||--o{ room_students : "alunos"
    rooms ||--o{ problems : "possui"
    users ||--o{ problems : "created_by / updated_by"
    users ||--o{ performance_tables : "dono (tutor_id)"
    performance_tables ||--|{ performance_criteria : "possui"
    performance_tables |o--o{ problems : "avalia (performance_table_id)"

    users {
        uuid id PK
        varchar name
        varchar email UK
        enum type
        boolean active
    }
    rooms {
        uuid id PK
        uuid tutor_id FK "professor responsável"
        varchar name
        varchar room_code UK
        boolean active
        timestamptz deleted_at
    }
    room_tutors {
        uuid room_id PK, FK
        uuid tutor_id PK, FK
    }
    room_students {
        uuid room_id PK, FK
        uuid student_id PK, FK
        timestamptz joined_at
    }
    problems {
        uuid id PK
        uuid room_id FK
        varchar title
        smallint order_index "único por sala"
        uuid performance_table_id FK "opcional"
        uuid created_by FK
    }
    performance_tables {
        uuid id PK
        uuid tutor_id FK
        varchar name
        text description
        timestamptz deleted_at "exclusão lógica"
    }
    performance_criteria {
        uuid id PK
        uuid performance_table_id FK
        varchar name
        text description
        enum category "CONTENT, PARTICIPATION, BEHAVIOR"
        smallint order_index "único por tabela"
        numeric weight "0 a 10"
        numeric max_score "maior que 0"
        timestamptz deleted_at
    }
```

## Regras que o esquema garante

- Uma tabela de desempenho pertence a um professor e tem ao menos um critério, na mesma transação.
- Critérios não repetem `order_index` dentro da mesma tabela (`uq_performance_criteria_table_order`).
- `problems.performance_table_id` é opcional e usa `ON DELETE RESTRICT`: a exclusão da tabela é lógica (`deleted_at`) e ela continua válida nos problemas que já a usam.
- `rooms.tutor_id` passa a significar professor responsável; o acesso de todos os professores da sala vem de `room_tutors`.
