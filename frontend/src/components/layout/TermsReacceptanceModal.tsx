import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TermsAndPrivacyContent } from '@/components/layout/TermsAndPrivacyContent';
import { useCurrentTerm } from '@/hooks/useCurrentTerm';
import { toApiError } from '@/services/apiError';
import {
  commitmentTermsService,
  type CurrentCommitmentTerm,
} from '@/services/commitmentTerms.service';

export type TermsReacceptanceModalProps = {
  isOpen: boolean;
  currentVersion: string;
  previousVersion: string | null;
  onAccepted: () => void;
  onLogout: () => void;
};

const REACCEPTANCE_CONFLICT_MESSAGE =
  'Uma nova versão dos Termos de Uso e Política de Privacidade entrou em vigor. Leia o documento atualizado e confirme o aceite novamente.';

function isConflictError(caught: unknown): boolean {
  const apiStatus = toApiError(caught).status;
  if (apiStatus === 409) return true;
  return (
    typeof caught === 'object' &&
    caught !== null &&
    'status' in caught &&
    (caught as { status?: unknown }).status === 409
  );
}

function ReacceptanceNotice({
  currentVersion,
  previousVersion,
}: {
  currentVersion: string;
  previousVersion: string | null;
}) {
  return (
    <Alert tone="info" className="text-xs">
      <p className="leading-relaxed">
        Os Termos de Uso e Política de Privacidade foram atualizados para a{' '}
        <strong>Versão {currentVersion}</strong>
        {previousVersion ? ` (sua versão anterior: v${previousVersion})` : ''}. Para continuar
        utilizando o PBL360, leia o documento e reconfirme seu aceite.
      </p>
    </Alert>
  );
}

function ReacceptanceCheckbox({
  agreed,
  onChange,
  currentVersion,
}: {
  agreed: boolean;
  onChange: (checked: boolean) => void;
  currentVersion: string;
}) {
  return (
    <label className="flex items-start gap-3 text-left text-xs text-muted cursor-pointer select-none">
      <input
        type="checkbox"
        checked={agreed}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-black/20 text-brand-900 focus:ring-brand-900 cursor-pointer"
      />
      <span>
        Eu li e concordo com os Termos de Uso e Política de Privacidade atualizados (Versão{' '}
        {currentVersion}).
      </span>
    </label>
  );
}

type ReacceptanceBodyProps = {
  currentVersion: string;
  previousVersion: string | null;
  term: CurrentCommitmentTerm | null;
  isTermLoading: boolean;
  termError: string | null;
  onRetryTerm: () => void;
  agreed: boolean;
  onAgreeChange: (checked: boolean) => void;
  error: string | null;
};

function ReacceptanceBody({
  currentVersion,
  previousVersion,
  term,
  isTermLoading,
  termError,
  onRetryTerm,
  agreed,
  onAgreeChange,
  error,
}: ReacceptanceBodyProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 overflow-y-auto pr-1">
      <ReacceptanceNotice currentVersion={currentVersion} previousVersion={previousVersion} />
      <div className="max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-slate-50/70 p-4">
        <TermsAndPrivacyContent
          term={term}
          isLoading={isTermLoading}
          error={termError}
          onRetry={onRetryTerm}
          requireLiveTerm
        />
      </div>
      <ReacceptanceCheckbox
        agreed={agreed}
        onChange={onAgreeChange}
        currentVersion={currentVersion}
      />
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}

function ReacceptanceActions({
  isLoading,
  disabled,
  onLogout,
  onConfirm,
}: {
  isLoading: boolean;
  disabled: boolean;
  onLogout: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-black/5 pt-4 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onLogout}
        disabled={isLoading}
        className="w-full sm:w-auto px-4"
      >
        Sair da conta
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onConfirm}
        isLoading={isLoading}
        disabled={disabled}
        className="w-full sm:w-auto px-5"
      >
        Confirmar
      </Button>
    </div>
  );
}

function ModalHeader() {
  return (
    <div className="border-b border-black/5 pb-3 text-left">
      <h2 id="terms-reacceptance-title" className="text-xl font-semibold text-ink">
        Atualização dos Termos de Uso e Política de Privacidade
      </h2>
    </div>
  );
}

function useTermAcceptanceSubmit(
  term: CurrentCommitmentTerm | null,
  isTermLoading: boolean,
  reloadTerm: () => Promise<CurrentCommitmentTerm | null>,
  onAccepted: () => void,
) {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAgreeChange(checked: boolean) {
    if (checked) setError(null);
    setAgreed(checked);
  }

  async function handleConfirm() {
    if (!agreed || !term || isTermLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await commitmentTermsService.acceptTerm(term.versao);
      onAccepted();
    } catch (caught) {
      if (isConflictError(caught)) {
        setAgreed(false);
        setError(REACCEPTANCE_CONFLICT_MESSAGE);
        await reloadTerm();
      } else {
        setError('Não foi possível registrar o aceite. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { agreed, isLoading, error, handleAgreeChange, handleConfirm };
}

export function TermsReacceptanceModal({
  isOpen,
  currentVersion,
  previousVersion,
  onAccepted,
  onLogout,
}: TermsReacceptanceModalProps) {
  const {
    term,
    isLoading: isTermLoading,
    error: termError,
    reload: reloadTerm,
  } = useCurrentTerm({
    enabled: isOpen,
    requireLiveTerm: true,
  });
  const { agreed, isLoading, error, handleAgreeChange, handleConfirm } = useTermAcceptanceSubmit(
    term,
    isTermLoading,
    reloadTerm,
    onAccepted,
  );

  if (!isOpen) return null;

  const activeVersion = term?.versao ?? currentVersion;
  const confirmDisabled = !agreed || isTermLoading || !term || Boolean(termError);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-reacceptance-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl animate-pop-in">
        <ModalHeader />
        <ReacceptanceBody
          currentVersion={activeVersion}
          previousVersion={previousVersion}
          term={term}
          isTermLoading={isTermLoading}
          termError={termError}
          onRetryTerm={() => void reloadTerm()}
          agreed={agreed}
          onAgreeChange={handleAgreeChange}
          error={error}
        />
        <ReacceptanceActions
          isLoading={isLoading}
          disabled={confirmDisabled}
          onLogout={onLogout}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

export default TermsReacceptanceModal;
