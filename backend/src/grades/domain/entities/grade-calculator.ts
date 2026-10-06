export type GradeAttendance = 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT' | null;
export type GradeSituation = 'AVALIADA' | 'PENDENTE' | 'JUSTIFICADA' | 'AUSENTE';

export interface GradeCriterion {
  id: string;
  score: number | null;
}

export interface GradeComponent {
  type: 'CRITERIO' | 'MEDIA_SESSOES' | 'AUTOAVALIACAO' | 'PARES';
  referenceId?: string | null;
  weight: number;
  value?: number | null;
}

export interface SessionGradeInput {
  criteria: GradeCriterion[];
  components: GradeComponent[];
  attendance: GradeAttendance;
  bonus: number | null;
}

export interface SessionGradeResult {
  grade: number | null;
  situation: GradeSituation;
}

export interface ProblemGradeResult {
  grade: number | null;
}

const weightedAverage = (values: Array<{ value: number; weight: number }>): number | null => {
  const available = values.filter((item) => item.value !== null && item.weight > 0);
  const weight = available.reduce((sum, item) => sum + item.weight, 0);
  return weight === 0
    ? null
    : available.reduce((sum, item) => sum + item.value * item.weight, 0) / weight;
};

export const calculateSessionGrade = (input: SessionGradeInput): SessionGradeResult => {
  if (input.attendance === 'ABSENT') return { grade: 0, situation: 'AUSENTE' };
  if (input.attendance === 'EXCUSED') return { grade: null, situation: 'JUSTIFICADA' };

  const values = input.components
    .filter((component) => component.type === 'CRITERIO')
    .map((component) => ({
      value:
        input.criteria.find((criterion) => criterion.id === component.referenceId)?.score ?? null,
      weight: component.weight,
    }))
    .filter((item): item is { value: number; weight: number } => item.value !== null);
  const average = weightedAverage(values);
  if (average === null) return { grade: null, situation: 'PENDENTE' };

  return {
    grade: Math.min(10, average + (input.bonus ?? 0)),
    situation: 'AVALIADA',
  };
};

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
