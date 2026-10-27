import { useState } from 'react';
import { ScoreStepper } from '@/components/ui/ScoreStepper';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SaveFormulaScopeModal } from './SaveFormulaScopeModal';
import { useSessionFormulaEditor } from '../hooks/useSessionFormulaEditor';

const SECONDARY_BTN =
  'w-full rounded-2xl border border-black/5 bg-white py-3.5 text-sm font-semibold text-brand-900 shadow-xs transition-colors hover:bg-brand-50 disabled:opacity-50';

function FormulaWeightRow({
  title,
  subtitle,
  weight,
  onChange,
}: {
  title: string;
  subtitle: string;
  weight: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 p-4 last:border-b-0">
      <div className="flex flex-col pr-2">
        <span className="text-base font-bold text-brand-900">{title}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </div>
      <ScoreStepper value={weight} onChange={onChange} label={title} min={0} max={10} step={1} />
    </div>
  );
}

function FormulaSummary({ isBalanced, totalSum }: { isBalanced: boolean; totalSum: number }) {
  return (
    <div className="flex items-center justify-between px-2 text-sm font-bold">
      <span className={isBalanced ? 'text-ink' : 'text-danger'}>Soma dos pesos</span>
      <span className={isBalanced ? 'text-emerald-700' : 'text-danger'}>
        {totalSum.toFixed(1).replace('.', ',')} / 10,0
      </span>
    </div>
  );
}

function FormulaActions({
  editor,
  onOpenModal,
}: {
  editor: ReturnType<typeof useSessionFormulaEditor>;
  onOpenModal: () => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={editor.isRestoring}
        onClick={editor.restore}
        className={SECONDARY_BTN}
      >
        Restaurar padrão
      </button>
      <div className="mt-4">
        <Button
          onClick={onOpenModal}
          disabled={!editor.isBalanced || editor.isSaving}
          isLoading={editor.isSaving}
          className="w-full py-4 text-base font-bold shadow-lg"
        >
          Salvar fórmula
        </Button>
      </div>
    </>
  );
}

export function FinalScoreFormulaTab({ sessionId }: { sessionId: string }) {
  const editor = useSessionFormulaEditor(sessionId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (editor.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  const handleSaveConfirmed = async (aplicarNasSeguintes: boolean) => {
    const ok = await editor.save(aplicarNasSeguintes);
    if (ok) setIsModalOpen(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <div className="overflow-hidden rounded-[18px] border border-black/5 bg-white shadow-xs">
        <FormulaWeightRow
          title="Desempenho na Sessão"
          subtitle="Critérios avaliativos"
          weight={editor.sessionWeight}
          onChange={editor.setSessionWeight}
        />
        <FormulaWeightRow
          title="Desempenho no Cargo"
          subtitle="Coordenador, Secretário de Mesa, Secretário de Quadro"
          weight={editor.roleWeight}
          onChange={editor.setRoleWeight}
        />
      </div>

      <FormulaSummary isBalanced={editor.isBalanced} totalSum={editor.totalSum} />
      <FormulaActions editor={editor} onOpenModal={() => setIsModalOpen(true)} />

      <SaveFormulaScopeModal
        isOpen={isModalOpen}
        isLoading={editor.isSaving}
        isSessionLocked={editor.isLocked}
        onConfirm={handleSaveConfirmed}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
