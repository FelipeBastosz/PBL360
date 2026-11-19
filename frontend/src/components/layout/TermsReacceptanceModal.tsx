import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TermsAndPrivacyContent } from '@/components/layout/TermsAndPrivacyContent';
import { commitmentTermsService } from '@/services/commitmentTerms.service';

export type TermsReacceptanceModalProps = {
  isOpen: boolean;
  currentVersion: string;
  previousVersion: string | null;
  onAccepted: () => void;
  onLogout: () => void;
};

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

function ReacceptanceBody({
  currentVersion,
  previousVersion,
  agreed,
  onAgreeChange,
  error,
}: {
  currentVersion: string;
  previousVersion: string | null;
  agreed: boolean;
  onAgreeChange: (checked: boolean) => void;
  error: string | null;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 overflow-y-auto pr-1">
      <ReacceptanceNotice currentVersion={currentVersion} previousVersion={previousVersion} />
      <div className="max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-slate-50/70 p-4">
        <TermsAndPrivacyContent />
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
  agreed,
  onLogout,
  onConfirm,
}: {
  isLoading: boolean;
  agreed: boolean;
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
        disabled={!agreed}
        className="w-full sm:w-auto px-5"
      >
        Confirmar
      </Button>
    </div>
  );
}

function ModalHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-black/5 pb-3 text-left">
      <h2 id="terms-reacceptance-title" className="text-xl font-semibold text-ink">
        {title}
      </h2>
    </div>
  );
}

export function TermsReacceptanceModal({
  isOpen,
  currentVersion,
  previousVersion,
  onAccepted,
  onLogout,
}: TermsReacceptanceModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirm() {
    if (!agreed) return;
    setIsLoading(true);
    setError(null);
    try {
      await commitmentTermsService.acceptTerm(currentVersion);
      onAccepted();
    } catch {
      setError('Não foi possível registrar o aceite. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-reacceptance-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl animate-pop-in">
        <ModalHeader title="Atualização dos Termos de Uso e Política de Privacidade" />
        <ReacceptanceBody
          currentVersion={currentVersion}
          previousVersion={previousVersion}
          agreed={agreed}
          onAgreeChange={setAgreed}
          error={error}
        />
        <ReacceptanceActions
          isLoading={isLoading}
          agreed={agreed}
          onLogout={onLogout}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}

export default TermsReacceptanceModal;
