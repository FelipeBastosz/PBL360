export const SYSTEM_TABLE_IDS = {
  standard: '34200000-0000-4000-8000-000000000001',
  firstSession: '34200000-0000-4000-8000-000000000002',
} as const;

export const SYSTEM_TABLE_READ_ONLY =
  'As tabelas padrão do sistema são somente leitura. Crie uma cópia para personalizar.';

export const SYSTEM_PERFORMANCE_TABLES = [
  {
    id: SYSTEM_TABLE_IDS.standard,
    name: 'Padrão',
    criteria: [
      { name: 'Seguimento', weight: 4 },
      { name: 'Participação', weight: 4 },
      { name: 'Comportamento', weight: 2 },
    ],
  },
  {
    id: SYSTEM_TABLE_IDS.firstSession,
    name: 'Padrão da 1ª sessão',
    criteria: [
      { name: 'Participação', weight: 8 },
      { name: 'Comportamento', weight: 2 },
    ],
  },
] as const;
