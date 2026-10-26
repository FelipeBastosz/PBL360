export type GradeAttendance = 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT' | null;
export type GradeSituation = 'AVALIADA' | 'PENDENTE' | 'JUSTIFICADA' | 'AUSENTE';

export interface GradeCriterion {
  id: string;
  score: number | null;
  weight?: number;
}

export interface GradeComponent {
  type: 'CRITERIOS' | 'PAPEL' | 'CRITERIO' | 'MEDIA_SESSOES' | 'AUTOAVALIACAO' | 'PARES';
  referenceId?: string | null;
  weight: number;
  value?: number | null;
  sessionId?: string;
}

export type EvaluationModality = 'TUTOR' | 'AUTOAVALIACAO' | 'PARES';

export interface SessionGradeInput {
  criteria: GradeCriterion[];
  components: GradeComponent[];
  attendance: GradeAttendance;
  bonus: number | null;
  defaultFormula?: boolean;
  modality?: EvaluationModality;
  modalityScore?: number | null;
}

export interface SessionGradeResult {
  grade: number | null;
  situation: GradeSituation;
}

export interface ProblemGradeResult {
  grade: number | null;
}

const weightedAverage = (
  values: Array<{ value: number; weight: number }>,
  denominator?: number,
): number | null => {
  const available = values.filter((item) => item.value !== null && item.weight > 0);
  if (available.length === 0) return null;
  const weight = denominator ?? available.reduce((sum, item) => sum + item.weight, 0);
  return weight === 0
    ? null
    : available.reduce((sum, item) => sum + item.value * item.weight, 0) / weight;
};

function resolveConfiguredAverage(input: SessionGradeInput): number | null {
  if (input.modality && input.modality !== 'TUTOR') {
    return input.modalityScore ?? null;
  }
  return weightedAverage(
    input.criteria.flatMap((criterion) =>
      criterion.score === null ? [] : [{ value: criterion.score, weight: criterion.weight ?? 1 }],
    ),
  );
}

function calculateConfiguredSessionGrade(input: SessionGradeInput): SessionGradeResult {
  const criteriaWeight =
    input.components.find((component) => component.type === 'CRITERIOS')?.weight ?? 0;
  const roleWeight = input.components.find((component) => component.type === 'PAPEL')?.weight ?? 0;
  const totalWeight = criteriaWeight + roleWeight || 100;
  const average = resolveConfiguredAverage(input);
  if (average === null) return { grade: null, situation: 'PENDENTE' };
  const grade =
    input.bonus === null
      ? average
      : (average * criteriaWeight + input.bonus * roleWeight) / totalWeight;
  return { grade, situation: 'AVALIADA' };
}

function sessionCriterionValues(input: SessionGradeInput) {
  return input.components
    .filter((component) => component.type === 'CRITERIO')
    .map((component) => ({
      value:
        input.criteria.find((criterion) => criterion.id === component.referenceId)?.score ?? null,
      weight: component.weight,
    }))
    .filter((item): item is { value: number; weight: number } => item.value !== null);
}

function resolveCriterionAverage(input: SessionGradeInput): number | null {
  if (input.modality && input.modality !== 'TUTOR') {
    return input.modalityScore ?? null;
  }
  const values = sessionCriterionValues(input);
  const denominator = input.defaultFormula
    ? input.components.reduce((sum, component) => sum + component.weight, 0)
    : undefined;
  return weightedAverage(values, denominator);
}

export const calculateSessionGrade = (input: SessionGradeInput): SessionGradeResult => {
  if (input.attendance === 'ABSENT') return { grade: 0, situation: 'AUSENTE' };
  if (input.attendance === 'EXCUSED') return { grade: null, situation: 'JUSTIFICADA' };

  if (input.components.some((component) => component.type === 'CRITERIOS')) {
    return calculateConfiguredSessionGrade(input);
  }
  const average = resolveCriterionAverage(input);
  if (average === null) return { grade: null, situation: 'PENDENTE' };

  const grade = calculateFinalSessionGrade(average, input.bonus, input.defaultFormula);
  return { grade, situation: 'AVALIADA' };
};

function calculateFinalSessionGrade(
  average: number,
  bonus: number | null,
  defaultFormula = false,
): number {
  if (defaultFormula && bonus !== null) return (average * 7 + bonus * 3) / 10;
  if (defaultFormula) return average;
  return bonus !== null ? (average * 7 + bonus * 3) / 10 : average;
}

export const calculateProblemGrade = (
  components: GradeComponent[],
  sessionGrades: Array<number | null>,
): ProblemGradeResult => {
  const values = components.map((component) => {
    const value =
      component.type === 'MEDIA_SESSOES'
        ? weightedAverage(
            sessionGrades.flatMap((grade) => (grade === null ? [] : [{ value: grade, weight: 1 }])),
          )
        : (component.value ?? null);
    return { value, weight: component.weight };
  });
  const grade = weightedAverage(
    values.filter((item): item is { value: number; weight: number } => item.value !== null),
  );
  return { grade };
};

export const presentGrade = (grade: number | null): number | null =>
  grade === null ? null : Math.round((grade + Number.EPSILON) * 10) / 10;
