import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { FAB_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/utils/cn';

export function MyFormulasFabMenu({ onOpenCreateModal }: { onOpenCreateModal: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={FAB_CONTAINER_CLASS}>
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate(ROUTES.manageMyFormulas);
            }}
            className="rounded-full border border-brand-accent bg-elevated px-5 py-2 text-sm font-semibold text-brand-accent shadow-sm hover:bg-brand-soft"
          >
            Editar uma fórmula
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCreateModal();
            }}
            className="rounded-full border border-brand-accent bg-elevated px-5 py-2 text-sm font-semibold text-brand-accent shadow-sm hover:bg-brand-soft"
          >
            Criar nova fórmula
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger-solid' : '',
        )}
        aria-label="Ações de fórmula"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
