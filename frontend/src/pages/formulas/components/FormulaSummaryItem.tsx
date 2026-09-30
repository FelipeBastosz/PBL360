import type { PerformanceTable, PerformanceTableSummary } from '@/types/performanceTable';
import { FormulaAccordionCard } from './FormulaAccordionCard';
import type { FormulasManager } from '../hooks/useFormulasManager';

type Props = {
  summary: PerformanceTableSummary;
  full?: PerformanceTable;
  manager: FormulasManager;
  onRemove: (id: string) => void;
  showSnackbar: (msg: string) => void;
};

function buildFormulaProp(
  summary: PerformanceTableSummary,
  full?: PerformanceTable,
  isCurrent?: boolean,
): PerformanceTable {
  return {
    ...(full || {
      id: summary.id,
      professorId: '',
      nome: summary.nome,
      descricao: summary.descricao,
      quantidadeProblemas: summary.quantidadeProblemas,
      criterios: [],
      criadoEm: summary.criadoEm,
      atualizadoEm: summary.atualizadoEm,
      isDefault: summary.isDefault,
    }),
    ativo: isCurrent,
  };
}

export function FormulaSummaryItem({ summary, full, manager, onRemove, showSnackbar }: Props) {
  const formulaProp = buildFormulaProp(summary, full, summary.id === manager.currentFormulaId);

  const handleEdit = () => {
    if (!full) return;
    manager.setEditingId(summary.id);
    manager.setDraft({
      nome: full.nome,
      criterios: full.criterios.map((c) => ({ id: c.id, nome: c.nome, peso: c.peso })),
    });
  };

  const handleDelete = async () => {
    const res = await manager.deleteFormula(summary.id);
    if (res.ok) onRemove(summary.id);
  };

  return (
    <FormulaAccordionCard
      formula={formulaProp}
      draft={manager.editingId === summary.id ? manager.draft : null}
      isExpanded={manager.expandedId === summary.id}
      isEditing={manager.editingId === summary.id}
      onExpand={() => manager.handleExpand(summary.id)}
      onEdit={handleEdit}
      onDeleteFormula={handleDelete}
      onApplyFormula={() => {
        manager.setCurrentFormulaId(summary.id);
        showSnackbar('Fórmula aplicada com sucesso.');
      }}
      onCancelEdit={() => {
        manager.setEditingId(null);
        manager.setDraft(null);
      }}
      onSaveEdit={manager.handleSave}
      onUpdateDraft={manager.setDraft}
      onDeleteCriterion={(critId) =>
        manager.setDraft((d) =>
          d ? { ...d, criterios: d.criterios.filter((c) => c.id !== critId) } : null,
        )
      }
    />
  );
}
