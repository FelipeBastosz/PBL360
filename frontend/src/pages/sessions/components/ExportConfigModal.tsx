import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { ExportSessionReportOptions } from '@/types/sessionReport';
import {
  StudentIdentificationRadio,
  ExportSectionsConfig,
  type StudentIdOption,
} from './ExportConfigFields';

export type ExportConfigModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ExportSessionReportOptions) => void;
  format?: 'PDF' | 'XLSX' | null;
  isLoading?: boolean;
};

type ExportActionsProps = {
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ExportConfigActions({ isLoading, onCancel, onConfirm }: ExportActionsProps) {
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

function toExportOptions(
  studentIdOption: StudentIdOption,
  feedbacks: boolean,
  marcacoes: boolean,
): ExportSessionReportOptions {
  return {
    ocultarNome: studentIdOption === 'REGISTRATION_ONLY',
    mostrarFeedBack: feedbacks,
    mostrarMarcacoes: marcacoes,
  };
}

function useExportConfigState(onConfirm: (options: ExportSessionReportOptions) => void) {
  const [studentId, setStudentId] = useState<StudentIdOption>('NAME_AND_REGISTRATION');
  const [feedbacks, setFeedbacks] = useState(true);
  const [marcacoes, setMarcacoes] = useState(true);

  const handleConfirm = () => {
    onConfirm(toExportOptions(studentId, feedbacks, marcacoes));
  };

  return {
    studentId,
    setStudentId,
    feedbacks,
    marcacoes,
    toggleFeedbacks: () => setFeedbacks((p) => !p),
    toggleMarcacoes: () => setMarcacoes((p) => !p),
    handleConfirm,
  };
}

export function ExportConfigModal({
  isOpen,
  onClose,
  onConfirm,
  format,
  isLoading = false,
}: ExportConfigModalProps) {
  const state = useExportConfigState(onConfirm);
  const title = format ? `Exportar em ${format}` : 'Configurar Exportação';

  return (
    <Sheet isOpen={isOpen} onClose={onClose} placement="center" title={title}>
      <div className="flex flex-col gap-4 py-2">
        <StudentIdentificationRadio value={state.studentId} onChange={state.setStudentId} />
        <ExportSectionsConfig
          feedbacks={state.feedbacks}
          marcacoes={state.marcacoes}
          onToggleFeedbacks={state.toggleFeedbacks}
          onToggleMarcacoes={state.toggleMarcacoes}
          disabled={isLoading}
        />
        <ExportConfigActions
          isLoading={isLoading}
          onCancel={onClose}
          onConfirm={state.handleConfirm}
        />
      </div>
    </Sheet>
  );
}
