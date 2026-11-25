export function formatCriterionWeight(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(1).replace('.', ',');
}

export function parseCriterionWeight(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return null;
  return Math.round((parsed + Number.EPSILON) * 10) / 10;
}

export function sanitizeCriterionWeightInput(value: string): string {
  const converted = value.replace('.', ',');
  if (!/^\d*(,\d*)?$/.test(converted)) return '';
  const parts = converted.split(',');
  if (parts.length > 1) {
    return `${parts[0]},${parts[1].slice(0, 1)}`;
  }
  return parts[0];
}

export function formatWeightChange(raw: string): string | null {
  const text = raw.replace('.', ',');
  if (!/^\d*(,\d*)?$/.test(text)) return null;
  const parts = text.split(',');
  if (parts.length > 1) {
    return `${parts[0]},${parts[1].slice(0, 1)}`;
  }
  return parts[0];
}

export function stepCriterionWeight(currentRaw: string, delta: number): string {
  const current = parseCriterionWeight(currentRaw) ?? 0;
  const next = Math.min(10, Math.max(0, Math.round((current + delta) * 10) / 10));
  return formatCriterionWeight(next);
}

export function validateCriterion(nome: string, peso: string): string | null {
  if (!nome.trim()) return 'O nome do critério é obrigatório.';
  if (!peso.trim()) return 'O peso do critério é obrigatório.';
  const parsed = parseCriterionWeight(peso);
  if (parsed === null || parsed < 0 || parsed > 10) {
    return 'O peso do critério deve estar entre 0 e 10.';
  }
  return null;
}
