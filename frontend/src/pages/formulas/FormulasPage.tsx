import { FormulaHeader } from './components/FormulaHeader';
import { FormulaSearch } from './components/FormulaSearch';
import { FormulaContent } from './components/FormulaContent';
import { FormulaFab } from './components/FormulaFab';
import { FormulaOverlays } from './components/FormulaOverlays';
import { useFormulaList } from './hooks/useFormulaList';
import { useFormulaDialogs } from './hooks/useFormulaDialogs';
import { useFormulasManager } from './hooks/useFormulasManager';

export default function FormulasPage() {
  const list = useFormulaList();
  const dialogs = useFormulaDialogs();
  const mgr = useFormulasManager(list, dialogs);

  return (
    <div className="min-h-dvh bg-surface pb-24 flex flex-col">
      <FormulaHeader />
      <FormulaSearch query={list.query} setQuery={list.setQuery} />
      <main className="flex-1 w-full max-w-md mx-auto px-4 mt-6">
        <FormulaContent list={list} manager={mgr} showSnackbar={dialogs.showSnackbar} />
      </main>
      <FormulaFab onClick={mgr.startCreate} disabled={mgr.isCreatingNew} />
      <FormulaOverlays dialogs={dialogs} isLoading={mgr.isProcessing} />
    </div>
  );
}
