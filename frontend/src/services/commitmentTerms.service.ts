import { api } from './api';

export type CurrentCommitmentTerm = {
  versao: string;
  titulo: string;
  texto: string;
};

export type TermAcceptanceStatus = {
  aceito: boolean;
  versaoAceita: string | null;
  aceitoEm: string | null;
  versaoVigente: string;
};

export const commitmentTermsService = {
  getCurrentTerm: () =>
    api.get<CurrentCommitmentTerm>('/termos-compromisso/vigente').then((r) => r.data),
  getMyAcceptanceStatus: () =>
    api.get<TermAcceptanceStatus>('/usuarios/meu-aceite-termo').then((r) => r.data),
  acceptTerm: (versao: string) =>
    api.post<TermAcceptanceStatus>('/usuarios/meu-aceite-termo', { versao }).then((r) => r.data),
};
