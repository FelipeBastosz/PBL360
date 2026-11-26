import { useState } from 'react';
import { ScoreStepper } from '@/components/ui/ScoreStepper';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { SaveFormulaScopeModal } from './SaveFormulaScopeModal';
import { useSessionFormulaEditor } from '../hooks/useSessionFormulaEditor';

const SECONDARY_BTN =
  'w-full rounded-2xl border border-border-subtle bg-elevated py-3.5 text-sm font-semibold text-brand-accent shadow-xs transition-colors hover:bg-brand-soft disabled:opacity-50';

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
    <div className="flex items-center justify-between border-b border-border-subtle p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-col pr-4">
        <span className="text-base font-bold text-brand-accent">{title}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </div>
      <ScoreStepper value={weight} onChange={onChange} label={title} min={1} max={9} step={1} />
    </div>
  );
}

function FormulaAutoAdjustNotice() {
  return (
    <Alert tone="info" className="text-xs">
      Ajuste automático: a soma dos pesos é sempre mantida em 10,0 (mínimo de 1,0 por peso).
    </Alert>
  );
}

function FormulaActions({
  editor,
  onSave,
}: {
  editor: ReturnType<typeof useSessionFormulaEditor>;
  onSave: () => void;
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
      <div className="mt-2">
        <Button
          onClick={onSave}
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
        <Spinner className="size-8 text-brand-accent" />
      </div>
    );
  }

  const handleSaveConfirmed = async (aplicarNasSeguintes: boolean) => {
    const ok = await editor.save(aplicarNasSeguintes);
    if (ok) setIsModalOpen(false);
  };

  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4 pb-12')}>
      <div className="overflow-hidden rounded-[18px] border border-border-subtle bg-elevated shadow-xs">
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

      <FormulaAutoAdjustNotice />
      <FormulaActions editor={editor} onSave={() => setIsModalOpen(true)} />

      <SaveFormulaScopeModal
        isOpen={isModalOpen}
        isLoading={editor.isSaving}
        isSessionLocked={editor.isLocked}
        onConfirm={handleSaveConfirmed}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
}
