export function formatGrade(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return value.toFixed(1).replace('.', ',');
}

export function formatSessionCell(nota: number | null | undefined, situacao?: string): string {
  if (nota !== null && nota !== undefined && !Number.isNaN(nota)) {
    return nota.toFixed(1).replace('.', ',');
  }
  if (situacao === 'JUSTIFICADA') {
    return 'J';
  }
  if (situacao === 'AUSENTE') {
    return '0,0';
  }
  return '—';
}

export function formatLastEdited(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  if (isoDate.includes('às')) return isoDate;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const formatted = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${formatted} às ${time}`;
}

export function resolveSessionName(
  sessao?: {
    nome?: string;
    name?: string;
    titulo?: string;
    title?: string;
    descricao?: string;
    rotulo?: string;
  } | null,
): string {
  if (!sessao) return '';
  return (
    sessao.title ||
    sessao.nome ||
    sessao.name ||
    sessao.titulo ||
    sessao.descricao ||
    sessao.rotulo ||
    ''
  );
}
