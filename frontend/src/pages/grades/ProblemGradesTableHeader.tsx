import type { SessionColumn } from '@/types/grades';

type ProblemGradesTableHeaderProps = {
  sessoes: SessionColumn[];
  hideNames: boolean;
};

export function ProblemGradesTableHeader({ sessoes, hideNames }: ProblemGradesTableHeaderProps) {
  return (
    <thead>
      <tr className="bg-brand-50 text-xs font-bold uppercase tracking-wider text-brand-900">
        <th scope="col" className="bg-brand-50 py-3.5 pr-4 pl-4 text-left font-bold rounded-l-xl">
          {hideNames ? 'MATRÍCULA' : 'ALUNO'}
        </th>
        {sessoes.map((sessao) => {
          const sessionName =
            sessao.title ||
            sessao.nome ||
            sessao.name ||
            sessao.titulo ||
            sessao.descricao ||
            sessao.rotulo;
          return (
            <th
              key={sessao.id}
              scope="col"
              title={sessionName}
              className="bg-brand-50 text-brand-900 font-bold max-w-[140px] truncate text-center px-3 py-3.5"
            >
              {sessionName}
            </th>
          );
        })}
        <th scope="col" className="bg-brand-50 py-3.5 pr-4 pl-3 text-right font-bold rounded-r-xl">
          GERAL
        </th>
      </tr>
    </thead>
  );
}
