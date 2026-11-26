import type { PerformanceModality, PerformanceTimelineSession } from '@/types/studentPerformance';

/** Position of a session in the chart, as percentages of the plot area. */
export type ChartPoint = {
  id: string;
  x: number;
  // null when the session has no grade yet: nothing is drawn for it.
  y: number | null;
};

export type ProblemBand = {
  problemId: string;
  title: string;
  start: number;
  size: number;
};

export type SituationTone = 'success' | 'warning' | 'danger' | 'info';

const MAX_GRADE = 10;
// The line is drawn in a 1000×100 viewBox, so x percentages are scaled by 10.
const VIEWBOX_X_SCALE = 10;

const SITUATION_LABELS: Record<string, string> = {
  AVALIADA: 'Avaliada',
  PENDENTE: 'Pendente',
  JUSTIFICADA: 'Justificada',
  AUSENTE: 'Ausente',
  NAO_ENVIADA: 'Não enviada',
  NAO_LIBERADA: 'Não liberada',
};

const SITUATION_TONES: Record<string, SituationTone> = {
  AVALIADA: 'success',
  PENDENTE: 'warning',
  NAO_LIBERADA: 'warning',
  AUSENTE: 'danger',
  NAO_ENVIADA: 'danger',
};

export const MODALITY_LABELS: Record<PerformanceModality, string> = {
  TUTOR: 'Tutor',
  AUTOAVALIACAO: 'Autoavaliação',
  PARES: 'Entre pares',
  PLANNING_POKER: 'Planning Poker',
};

export function toChartPoints(sessions: PerformanceTimelineSession[]): ChartPoint[] {
  return sessions.map((session, index) => ({
    id: session.sessaoId,
    x: ((index + 0.5) / sessions.length) * 100,
    y: session.nota === null ? null : ((MAX_GRADE - session.nota) / MAX_GRADE) * 100,
  }));
}

// A session without a grade splits the line, so the chart never suggests a value the API
// did not return. A segment with a single point has no line, only its marker.
export function toLinePath(points: ChartPoint[]): string {
  return splitAtGaps(points)
    .filter((segment) => segment.length > 1)
    .map((segment) => `M${segment.map(toViewBoxPoint).join(' L')}`)
    .join(' ');
}

function splitAtGaps(points: ChartPoint[]): ChartPoint[][] {
  const segments: ChartPoint[][] = [[]];
  points.forEach((point) => {
    if (point.y === null) segments.push([]);
    else segments[segments.length - 1].push(point);
  });
  return segments;
}

const round = (value: number) => Math.round(value * 10) / 10;

const toViewBoxPoint = (point: ChartPoint) =>
  `${round(point.x * VIEWBOX_X_SCALE)} ${round(point.y ?? 0)}`;

/** Consecutive sessions of the same problem, used to label and shade the chart. */
export function toProblemBands(sessions: PerformanceTimelineSession[]): ProblemBand[] {
  return sessions.reduce<ProblemBand[]>((bands, session, index) => {
    const last = bands[bands.length - 1];
    if (last?.problemId === session.problemaId) {
      last.size += 1;
      return bands;
    }
    return [
      ...bands,
      { problemId: session.problemaId, title: session.problemaTitulo, start: index, size: 1 },
    ];
  }, []);
}

export function situationLabel(situacao: string): string {
  const known = SITUATION_LABELS[situacao];
  if (known) return known;
  const words = situacao.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function situationTone(situacao: string): SituationTone {
  return SITUATION_TONES[situacao] ?? 'info';
}
