import { Spinner } from '@/components/ui/Spinner';

export function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand-900 bg-surface">
      <Spinner className="size-10 border-4" label="Carregando" />
    </div>
  );
}
