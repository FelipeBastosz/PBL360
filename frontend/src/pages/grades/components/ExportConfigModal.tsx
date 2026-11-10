import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { ExportProblemReportOptions } from '@/types/problemReport';
import {
  StudentIdentificationRadio,
  ExportToggleRow,
  type StudentIdOption,
} from '@/pages/sessions/components/ExportConfigFields';

export type ProblemExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ExportProblemReportOptions) => void;
  format?: 'PDF' | 'XLSX' | null;
  isLoading?: boolean;
};

type ExportActionsProps = {
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ProblemExportActions({ isLoading, onCancel, onConfirm }: ExportActionsProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={onCancel}
        className="h-11 w-full text-sm font-semibold"
      >
        Cancelar
      </Button>
      <Button
        type="button"
        variant="primary"
        isLoading={isLoading}
        disabled={isLoading}
        onClick={onConfirm}
        className="h-11 w-full text-sm font-semibold"
      >
        Confirmar Exportação
      </Button>
    </div>
  );
}

type SectionsConfigProps = {
  pendencias: boolean;
  marcacoes: boolean;
  feedbacks: boolean;
  onTogglePendencias: () => void;
  onToggleMarcacoes: () => void;
  onToggleFeedbacks: () => void;
  disabled?: boolean;
};

function ProblemSectionsConfig({
  pendencias,
  marcacoes,
  feedbacks,
  onTogglePendencias,
  onToggleMarcacoes,
  onToggleFeedbacks,
  disabled,
}: SectionsConfigProps) {
  return (
    <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        Conteúdo do Relatório
      </span>
      <ExportToggleRow
        id="export-pendencias-toggle"
        label="Pendências de avaliação"
        checked={pendencias}
        onToggle={onTogglePendencias}
        disabled={disabled}
      />
      <ExportToggleRow
        id="export-marcacoes-toggle"
        label="Marcações das sessões"
        checked={marcacoes}
        onToggle={onToggleMarcacoes}
        disabled={disabled}
      />
      <ExportToggleRow
        id="export-feedbacks-toggle"
        label="Feedbacks"
        checked={feedbacks}
        onToggle={onToggleFeedbacks}
        disabled={disabled}
      />
    </div>
  );
}

function toOptions(
  studentId: StudentIdOption,
  pendencias: boolean,
  marcacoes: boolean,
  feedbacks: boolean,
): ExportProblemReportOptions {
  return {
    ocultarNomes: studentId === 'REGISTRATION_ONLY',
    mostrarPendencias: pendencias,
    mostrarMarcacoes: marcacoes,
    mostrarFeedback: feedbacks,
  };
}

function useProblemExportModalState(onConfirm: (options: ExportProblemReportOptions) => void) {
  const [studentId, setStudentId] = useState<StudentIdOption>('NAME_AND_REGISTRATION');
  const [pendencias, setPendencias] = useState(true);
  const [marcacoes, setMarcacoes] = useState(true);
  const [feedbacks, setFeedbacks] = useState(true);

  return {
    studentId,
    setStudentId,
    pendencias,
    marcacoes,
    feedbacks,
    togglePendencias: () => setPendencias((p) => !p),
    toggleMarcacoes: () => setMarcacoes((p) => !p),
    toggleFeedbacks: () => setFeedbacks((p) => !p),
    handleConfirm: () => onConfirm(toOptions(studentId, pendencias, marcacoes, feedbacks)),
  };
}

export function ProblemExportModal({
  isOpen,
  onClose,
  onConfirm,
  format,
  isLoading = false,
}: ProblemExportModalProps) {
  const state = useProblemExportModalState(onConfirm);
  const title = format ? `Exportar em ${format}` : 'Configurar Exportação';

  return (
    <Sheet isOpen={isOpen} onClose={onClose} placement="center" title={title}>
      <div className="flex flex-col gap-4 py-2">
        <StudentIdentificationRadio value={state.studentId} onChange={state.setStudentId} />
        <ProblemSectionsConfig
          pendencias={state.pendencias}
          marcacoes={state.marcacoes}
          feedbacks={state.feedbacks}
          onTogglePendencias={state.togglePendencias}
          onToggleMarcacoes={state.toggleMarcacoes}
          onToggleFeedbacks={state.toggleFeedbacks}
          disabled={isLoading}
        />
        <ProblemExportActions
          isLoading={isLoading}
          onCancel={onClose}
          onConfirm={state.handleConfirm}
        />
      </div>
    </Sheet>
  );
}

export { ProblemExportModal as ExportConfigModal };
