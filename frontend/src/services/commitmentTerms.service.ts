import { api } from './api';

export type CurrentCommitmentTerm = {
  versao: string;
  titulo: string;
  texto: string;
};

export const commitmentTermsService = {
  getCurrentTerm: () =>
    api.get<CurrentCommitmentTerm>('/termos-compromisso/vigente').then((r) => r.data),
};
