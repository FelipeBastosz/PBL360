export type EvaluationReleaseKind = 'self' | 'peer';

export interface EvaluationReleaseChange {
  released: boolean;
  deadline: Date | null;
}
