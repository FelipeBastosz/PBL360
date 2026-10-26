import { SignalSlashIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export function AbsentState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex max-w-[340px] flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-900">
          <UserMinusIcon className="size-8" aria-hidden />
        </span>
        <h2 className="mt-1 text-lg font-semibold text-balance text-ink">
          Você não participou desta sessão
        </h2>
        <p className="text-sm leading-normal text-pretty text-muted">
          Só participa do planning poker quem esteve presente na chamada desta sessão.
        </p>
        <div className="mt-3 w-full">
          <Button variant="outline" onClick={onBack}>
            Voltar para a sessão
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConnectionErrorState({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex max-w-[340px] flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
          <SignalSlashIcon className="size-8" aria-hidden />
        </span>
        <h2 className="mt-1 text-lg font-semibold text-balance text-ink">
          Não foi possível conectar ao planning poker
        </h2>
        <p className="text-sm leading-normal text-pretty text-muted">
          Verifique sua internet e tente de novo. Nenhuma nota ou voto já registrado foi perdido.
        </p>
        <div className="mt-3 flex w-full flex-col gap-2">
          <Button onClick={onRetry}>Tentar novamente</Button>
          <Button variant="link" onClick={onBack} className="self-center p-2 underline">
            Voltar para a sessão
          </Button>
        </div>
      </div>
    </div>
  );
}
