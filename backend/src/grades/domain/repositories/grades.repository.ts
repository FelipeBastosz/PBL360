export type GradeRow = Record<string, string | number | boolean | null | undefined>;

export interface ProblemGradeData {
  sessions: GradeRow[];
  students: GradeRow[];
  formulas: GradeRow[];
  scores: GradeRow[];
  attendances: GradeRow[];
  roles: GradeRow[];
  criteria: GradeRow[];
  selfScores: GradeRow[];
  peerScores: GradeRow[];
}

export interface GradePersistenceData {
  sessionRows: GradeRow[];
  problemRows: GradeRow[];
}

export interface GradesRepository {
  findProblem(problemId: string, roomId: string): Promise<GradeRow | null>;

  findProblemData(roomId: string, problemId: string): Promise<ProblemGradeData>;

  findFormulaComponents(formulaIds: unknown[]): Promise<GradeRow[]>;

  saveGrades(problemId: string, result: GradePersistenceData): Promise<void>;
}

export const GRADES_REPOSITORY = Symbol('GradesRepository');
