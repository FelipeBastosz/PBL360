import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  SessionFormulasTabsHeader,
  type FormulaActiveTab,
} from './components/SessionFormulasTabsHeader';
import { FinalScoreFormulaTab } from './components/FinalScoreFormulaTab';
import PerformanceTablesPage from '../performance-tables/PerformanceTablesPage';

export default function ProblemFormulaPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const [activeTab, setActiveTab] = useState<FormulaActiveTab>('DESEMPENHO');

  return (
    <div className="min-h-dvh bg-surface">
      <SessionFormulasTabsHeader activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'DESEMPENHO' ? (
        <PerformanceTablesPage showHeader={false} />
      ) : (
        <FinalScoreFormulaTab sessionId={sessionId} />
      )}
    </div>
  );
}
