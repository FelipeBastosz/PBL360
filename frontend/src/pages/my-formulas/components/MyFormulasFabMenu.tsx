import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/utils/cn';

export function MyFormulasFabMenu({ onOpenCreateModal }: { onOpenCreateModal: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed right-6 bottom-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate(ROUTES.manageMyFormulas);
            }}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Editar uma fórmula
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCreateModal();
            }}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Criar nova fórmula
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger' : '',
        )}
        aria-label="Ações de fórmula"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}
