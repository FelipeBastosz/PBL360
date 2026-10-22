export type BehaviorTag = {
  id: string;
  nome: string;
  predefinida?: boolean;
  ativa?: boolean;
};

export type ObservationItem = {
  id: string;
  marcacoes: BehaviorTag[];
  texto: string | null;
  criadaEm: string;
};

export type StudentObservationsResponse = {
  observacoes: ObservationItem[];
  contagem: Record<string, number>;
};

export type RegisterObservationPayload = {
  marcacaoIds?: string[];
  texto?: string | null;
};
