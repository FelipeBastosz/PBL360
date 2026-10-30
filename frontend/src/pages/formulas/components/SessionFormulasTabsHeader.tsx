import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

export type FormulaActiveTab = 'DESEMPENHO' | 'NOTA_FINAL';

type Props = {
  activeTab: FormulaActiveTab;
  onTabChange: (tab: FormulaActiveTab) => void;
};

export function SessionFormulasTabsHeader({ activeTab, onTabChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="shrink-0 bg-brand-900 text-white shadow-md">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-transform hover:bg-white/10 active:scale-90"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">Fórmulas</h1>
        </div>
        <UserMenuButton user={user} />
      </div>

      <div className={cn(PAGE_CONTAINER_CLASS, 'flex items-center gap-8 text-sm font-semibold')}>
        <button
          type="button"
          onClick={() => onTabChange('DESEMPENHO')}
          className={cn(
            'pb-3 transition-colors border-b-2',
            activeTab === 'DESEMPENHO'
              ? 'border-white text-white'
              : 'border-transparent text-white/60 hover:text-white',
          )}
        >
          Fórmulas de Desempenho
        </button>
        <button
          type="button"
          onClick={() => onTabChange('NOTA_FINAL')}
          className={cn(
            'pb-3 transition-colors border-b-2',
            activeTab === 'NOTA_FINAL'
              ? 'border-white text-white'
              : 'border-transparent text-white/60 hover:text-white',
          )}
        >
          Fórmula da Nota Final
        </button>
      </div>
    </header>
  );
}
