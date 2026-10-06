import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { formatDayMonth } from '@/utils/formatDate';

export function PrefillNotice({ date }: { date: string }) {
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900 animate-slide-down"
    >
      <InformationCircleIcon className="size-5 shrink-0" aria-hidden />
      Mesa preenchida conforme a sessão de {formatDayMonth(date)}
    </p>
  );
}
