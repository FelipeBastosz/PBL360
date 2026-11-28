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

export function formatWeightChange(raw: string): string | null {
  const text = raw.replace('.', ',');
  if (!text.trim()) return '';
  if (!/^\d*(,\d*)?$/.test(text)) return null;

  const parts = text.split(',');
  const rawInt = parts[0];
  const intPart = (rawInt === '' && parts.length > 1 ? '0' : rawInt).replace(/^0+(?=\d)/, '');
  const decimalPart = parts[1] !== undefined ? parts[1].slice(0, 1) : undefined;
  const formatted = decimalPart !== undefined ? `${intPart},${decimalPart}` : intPart;

  const parsed = parseCriterionWeight(formatted);
  if (parsed !== null && parsed > 10) return null;

  return formatted;
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

export function sumCriterionWeights(criteria: Array<{ peso: number }> | number[]): number {
  const sum = criteria.reduce<number>((acc, item) => {
    const val = typeof item === 'number' ? item : item.peso;
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);
  return Math.round((sum + Number.EPSILON) * 10) / 10;
}

export function isBalancedWeight(totalWeight: number): boolean {
  const rounded = Math.round((totalWeight + Number.EPSILON) * 10) / 10;
  return rounded === 10;
}
