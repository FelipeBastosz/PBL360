import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { FormulaScope } from '@/types/formula';
import { cn } from '@/utils/cn';
import {
  componentKey,
  componentName,
  formatWeight,
  isBalanced,
  missingComponents,
  totalWeight,
  type TableCriterion,
} from '@/utils/formula';
import { AddComponentSheet } from './AddComponentSheet';
import { useFormulaEditor } from './useFormulaEditor';
import { WeightSlider } from './WeightSlider';

const SECONDARY_ACTION =
  'w-full rounded-2xl border border-black/5 bg-white py-4 text-base font-semibold text-muted shadow-[0_1px_2px_rgb(16_33_76/0.06)] transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60';

const ADD_LABEL: Record<FormulaScope, string> = {
  SESSAO: 'Adicionar novo critério',
  PROBLEMA: 'Adicionar novo componente',
};

type FormulaEditorProps = {
  roomId: string;
  problemId: string;
  scope: FormulaScope;
  criteria: TableCriterion[];
  hidden: boolean;
};

function WeightSum({ value, balanced }: { value: number; balanced: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1 px-1', balanced ? 'text-success' : 'text-danger')}>
      <p className="flex justify-between text-base font-semibold">
        <span>Soma dos pesos</span>
        <span className="tabular-nums">{formatWeight(value)}</span>
      </p>
      {!balanced && <p className="text-sm">A soma dos pesos precisa ser 100%.</p>}
    </div>
  );
}

type Editor = ReturnType<typeof useFormulaEditor>;

type FormulaFormProps = {
  editor: Editor;
  addLabel: string;
  canAdd: boolean;
  onAdd: () => void;
};

function FormulaForm({ editor, addLabel, canAdd, onAdd }: FormulaFormProps) {
  const balanced = isBalanced(editor.components);

  return (
    <div className="flex flex-col gap-3">
      {editor.actionError && <Alert tone="error">{editor.actionError.message}</Alert>}
      {editor.components.map((component) => (
        <WeightSlider
          key={componentKey(component)}
          label={componentName(component)}
          value={component.peso}
          onChange={(peso) => editor.setWeight(componentKey(component), peso)}
        />
      ))}
      <button type="button" className={SECONDARY_ACTION} disabled={!canAdd} onClick={onAdd}>
        {addLabel}
      </button>
      <WeightSum value={totalWeight(editor.components)} balanced={balanced} />
      <button
        type="button"
        className={SECONDARY_ACTION}
        disabled={editor.isRestoring}
        onClick={editor.restore}
      >
        Restaurar padrão
      </button>
      <div className="mt-6 flex flex-col gap-2">
        <Button onClick={editor.save} disabled={!balanced} isLoading={editor.isSaving}>
          Salvar fórmula
        </Button>
        <p className="text-center text-xs text-muted">
          Vale para todas as sessões deste problema, inclusive as que já aconteceram.
        </p>
      </div>
    </div>
  );
}

export function FormulaEditor({ roomId, problemId, scope, criteria, hidden }: FormulaEditorProps) {
  const editor = useFormulaEditor(roomId, problemId, scope);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const options = missingComponents(scope, editor.components, criteria);

  return (
    <section
      role="tabpanel"
      id={`panel-${scope}`}
      aria-labelledby={`tab-${scope}`}
      hidden={hidden}
      className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-8"
    >
      {editor.isLoading && <Spinner className="mx-auto mt-10 size-8 text-brand-900" />}
      {editor.loadError && <Alert tone="error">{editor.loadError.message}</Alert>}
      {editor.formula && (
        <FormulaForm
          editor={editor}
          addLabel={ADD_LABEL[scope]}
          canAdd={options.length > 0}
          onAdd={() => setIsAddOpen(true)}
        />
      )}
      <AddComponentSheet
        isOpen={isAddOpen}
        title={ADD_LABEL[scope]}
        options={options}
        onClose={() => setIsAddOpen(false)}
        onPick={(component) => {
          editor.add(component);
          setIsAddOpen(false);
        }}
      />
    </section>
  );
}
