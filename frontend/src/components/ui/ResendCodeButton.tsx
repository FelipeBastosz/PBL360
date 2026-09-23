import { useCooldown } from '@/hooks/useCooldown';
import { Button } from './Button';

const RESEND_COOLDOWN_SECONDS = 60;

type ResendCodeButtonProps = {
  onResend: () => Promise<boolean>;
  isLoading: boolean;
};

export function ResendCodeButton({ onResend, isLoading }: ResendCodeButtonProps) {
  const { remaining, isCoolingDown, start } = useCooldown(RESEND_COOLDOWN_SECONDS);

  async function handleClick() {
    if (await onResend()) start();
  }

  return (
    <Button variant="link" onClick={handleClick} isLoading={isLoading} disabled={isCoolingDown}>
      {isCoolingDown ? `Reenviar código em ${remaining}s` : 'Não recebeu? Reenviar código'}
    </Button>
  );
}
