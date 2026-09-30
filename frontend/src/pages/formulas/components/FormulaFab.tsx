import { Button } from '@/components/ui/Button';

type Props = {
  onClick: () => void;
  disabled: boolean;
};

export function FormulaFab({ onClick, disabled }: Props) {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <Button onClick={onClick} disabled={disabled}>
          Criar nova fórmula
        </Button>
      </div>
    </div>
  );
}
