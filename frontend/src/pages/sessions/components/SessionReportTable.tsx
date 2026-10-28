import { useState } from 'react';
import type { SessionReportStudent } from '@/types/sessionReport';
import { formatGrade } from '@/utils/gradeFormatters';
import { cn } from '@/utils/cn';

type SessionReportTableProps = {
  students: SessionReportStudent[];
};

function calculateAverage(students: SessionReportStudent[]): number | null {
  const valid = students
    .map((s) => s.notaFinal)
    .filter((n): n is number => n !== null && n !== undefined && !Number.isNaN(n));
  if (valid.length === 0) return null;
  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

type HideNamesToggleProps = {
  checked: boolean;
  onToggle: () => void;
};

function HideNamesToggle({ checked, onToggle }: HideNamesToggleProps) {
  return (
    <div className="flex items-center justify-end pb-4">
      <label
        htmlFor="toggle-hide-names"
        className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-ink"
      >
        <span>Ocultar nomes</span>
        <button
          id="toggle-hide-names"
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label="Ocultar nomes"
          onClick={onToggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-brand-900',
            checked ? 'bg-brand-900' : 'bg-black/20',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out',
              checked ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </label>
    </div>
  );
}

function TableFooter({ average }: { average: number | null }) {
  return (
    <tfoot>
      <tr className="border-t border-black/10 text-sm font-bold text-ink">
        <td className="px-4 py-4 text-left font-bold">Média da turma</td>
        <td className="px-4 py-4 text-right font-bold text-ink">{formatGrade(average)}</td>
      </tr>
    </tfoot>
  );
}

export function SessionReportTable({ students }: SessionReportTableProps) {
  const [isNamesHidden, setIsNamesHidden] = useState(false);
  const classAverage = calculateAverage(students);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <HideNamesToggle checked={isNamesHidden} onToggle={() => setIsNamesHidden((prev) => !prev)} />

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-brand-50 text-xs font-bold uppercase tracking-wider text-brand-900">
              <th scope="col" className="rounded-l-xl px-4 py-3.5 text-left font-bold">
                {isNamesHidden ? 'MATRÍCULA' : 'ALUNO'}
              </th>
              <th scope="col" className="rounded-r-xl px-4 py-3.5 text-right font-bold">
                NOTA FINAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 text-sm">
            {students.map((student) => {
              const isSuccess = (student.notaFinal ?? 0) >= 7.0;
              return (
                <tr key={student.id} className="transition-colors hover:bg-black/[0.02]">
                  <td className="px-4 py-3.5 text-left font-medium text-ink">
                    {isNamesHidden ? student.matricula : student.nome}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3.5 text-right font-bold',
                      isSuccess ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatGrade(student.notaFinal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <TableFooter average={classAverage} />
        </table>
      </div>
    </div>
  );
}
