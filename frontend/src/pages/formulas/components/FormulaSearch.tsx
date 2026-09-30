import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type FormulaSearchProps = {
  query: string;
  setQuery: (query: string) => void;
};

export function FormulaSearch({ query, setQuery }: FormulaSearchProps) {
  return (
    <div className="relative mt-4 px-4 w-full max-w-md mx-auto">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-3">
        <MagnifyingGlassIcon className="size-5 text-placeholder" aria-hidden />
      </div>
      <input
        type="text"
        placeholder="Pesquisar fórmula"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder shadow-sm focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
    </div>
  );
}
