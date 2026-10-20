import type { ClassReportProblem } from '@/types/class-report';

type ClassReportTableHeaderProps = {
  problemas: ClassReportProblem[];
  hideNames?: boolean;
};

export function ClassReportTableHeader({
  problemas,
  hideNames = false,
}: ClassReportTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-brand-50 text-xs font-bold uppercase tracking-wider text-brand-900">
        <th
          scope="col"
          className="sticky left-0 z-20 w-[200px] min-w-[160px] max-w-[240px] rounded-l-xl border-r border-black/5 bg-brand-50 py-3.5 pr-4 pl-4 text-left font-bold"
        >
          {hideNames ? 'MATRÍCULA' : 'ALUNO'}
        </th>
        {problemas.map((problema) => (
          <th
            key={problema.id}
            scope="col"
            title={problema.titulo}
            className="max-w-[160px] min-w-[120px] truncate px-3 py-3.5 text-center font-bold"
          >
            {problema.titulo}
          </th>
        ))}
        <th
          scope="col"
          className="min-w-[130px] rounded-r-xl bg-brand-50 py-3.5 pr-4 pl-3 text-right font-bold"
        >
          Média Geral
        </th>
      </tr>
    </thead>
  );
}
