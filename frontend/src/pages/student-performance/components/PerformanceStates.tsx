import type { ComponentType, ReactNode, SVGProps } from 'react';
import { ArrowPathIcon, ChartBarIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';

const BOX_CLASS =
  'flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-10 text-center';

type StateMessageProps = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName: string;
  title: string;
  children: ReactNode;
};

function StateMessage({ Icon, iconClassName, title, children }: StateMessageProps) {
  return (
    <div className={BOX_CLASS}>
      <span className={cn('flex size-14 items-center justify-center rounded-full', iconClassName)}>
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

export function PerformanceLoading({ studentName }: { studentName: string }) {
  return (
    <div className={BOX_CLASS}>
      <Spinner className="size-8 text-brand-900" label="Carregando desempenho" />
      <p className="text-sm text-muted">
        Carregando desempenho{studentName ? ` de ${studentName}` : ''}…
      </p>
    </div>
  );
}

export function PerformanceEmpty(props: { message: string; onShowAll?: () => void }) {
  return (
    <StateMessage
      Icon={ChartBarIcon}
      iconClassName="bg-brand-50 text-brand-900"
      title="Nenhuma sessão registrada"
    >
      <p className="max-w-sm text-sm text-muted">{props.message}</p>
      {props.onShowAll && (
        <Button size="sm" variant="outline" onClick={props.onShowAll}>
          Ver todos os problemas
        </Button>
      )}
    </StateMessage>
  );
}

export function PerformanceForbidden({ message }: { message: string }) {
  return (
    <StateMessage
      Icon={LockClosedIcon}
      iconClassName="bg-warning-soft text-warning"
      title="Você não tem acesso a esta evolução"
    >
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </StateMessage>
  );
}

export function PerformanceError(props: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert tone="error" className="w-full">
        {props.message}
      </Alert>
      <Button size="sm" onClick={props.onRetry}>
        <span className="inline-flex items-center gap-2">
          <ArrowPathIcon className="size-4" aria-hidden />
          Tentar novamente
        </span>
      </Button>
    </div>
  );
}
