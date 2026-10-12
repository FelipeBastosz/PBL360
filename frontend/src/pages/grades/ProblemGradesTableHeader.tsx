import type { SessionColumn } from '@/types/grades';

type ProblemGradesTableHeaderProps = {
  sessoes: SessionColumn[];
  hideNames: boolean;
};

export function ProblemGradesTableHeader({ sessoes, hideNames }: ProblemGradesTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-black/10 text-xs font-bold uppercase tracking-wider text-brand-900">
        <th scope="col" className="py-3.5 pr-4 pl-2 font-bold">
          {hideNames ? 'MATRÍCULA' : 'ALUNO'}
        </th>
        {sessoes.map((sessao) => (
          <th
            key={sessao.id}
            scope="col"
            className="px-3 py-3.5 text-center font-bold"
            title={sessao.data ? `Data: ${sessao.data}` : undefined}
          >
            {sessao.rotulo}
          </th>
        ))}
        <th scope="col" className="py-3.5 pr-2 pl-3 text-right font-bold">
          GERAL
        </th>
      </tr>
    </thead>
  );
}
